/**
 * Account creation and sign-in.
 *
 * One account system for both roles (plan §3): the same user record can own a
 * company membership and a specialist profile. Nothing here writes to browser
 * storage — the only client-side artefact is the HttpOnly session cookie.
 */
import { one, run } from './db';
import { isoIn, newId, newToken, nowIso, sha256 } from './ids';
import { hashPassword, needsRehash, verifyPassword } from './password';
import { audit } from './audit';
import { resetPasswordMessage, sendMail, verifyEmailMessage } from './mail';
import { PUBLIC_TENANT } from './tenant';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export interface NewAccount {
  name: string;
  email: string;
  password: string;
  country?: string | null;
  timezone?: string | null;
  acceptedTerms: boolean;
  /** The visitor's private workspace — see src/server/tenant.ts. */
  tenant: string;
}

export type SignUpResult =
  | { ok: true; userId: string }
  | { ok: false; field: string; message: string };

export async function signUp(
  database: D1Database,
  env: Env,
  request: Request,
  account: NewAccount,
): Promise<SignUpResult> {
  const email = account.email.toLowerCase();
  // Email is unique per workspace, not globally: two reviewers must both be
  // able to sign up as "test@test.com" in their own sandbox.
  const existing = await one<{ id: string }>(
    database, 'SELECT id FROM users WHERE email = ? AND tenant = ?', email, account.tenant,
  );
  if (existing) {
    return {
      ok: false,
      field: 'email',
      message: 'An account already uses that email. Sign in instead, or reset your password.',
    };
  }

  const id = newId();
  const now = nowIso();
  await run(
    database,
    `INSERT INTO users (id, email, password_hash, name, country, timezone, terms_accepted_at, tenant, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    email,
    await hashPassword(account.password),
    account.name,
    account.country ?? null,
    account.timezone ?? null,
    account.acceptedTerms ? now : null,
    account.tenant,
    now,
    now,
  );

  await issueEmailVerification(database, env, id, account.name, email, account.tenant);
  await audit(database, { actorId: id, action: 'user.signed_up', entityType: 'user', entityId: id, request });
  return { ok: true, userId: id };
}

export type SignInResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

export async function signIn(
  database: D1Database,
  request: Request,
  email: string,
  password: string,
  tenant: string,
): Promise<SignInResult> {
  // Scoped to the workspace so one visitor can never sign in as another's
  // test account, even if they guess the address.
  const row = await one<{ id: string; password_hash: string; status: string }>(
    database,
    "SELECT id, password_hash, status FROM users WHERE email = ? AND tenant IN (?, 'public')",
    email.toLowerCase(),
    tenant,
  );

  // Same message and roughly the same work whether the account exists or not,
  // so this endpoint cannot be used to enumerate registered emails.
  const generic = { ok: false as const, message: 'That email and password do not match.' };
  if (!row) {
    await hashPassword(password);
    return generic;
  }
  if (!(await verifyPassword(password, row.password_hash))) return generic;
  if (row.status !== 'active') {
    return { ok: false, message: 'That account is not active. Contact us if you think this is wrong.' };
  }

  // Transparently upgrade hashes when the iteration count is raised.
  if (needsRehash(row.password_hash)) {
    await run(
      database,
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      await hashPassword(password),
      nowIso(),
      row.id,
    );
  }

  await audit(database, { actorId: row.id, action: 'user.signed_in', entityType: 'user', entityId: row.id, request });
  return { ok: true, userId: row.id };
}

// --- one-time tokens --------------------------------------------------------

export async function issueEmailVerification(
  database: D1Database,
  env: Env,
  userId: string,
  name: string,
  email: string,
  tenant: string,
): Promise<void> {
  const token = newToken();
  await run(
    database,
    `INSERT INTO auth_tokens (id, user_id, purpose, token_hash, expires_at, created_at)
     VALUES (?, ?, 'verify_email', ?, ?, ?)`,
    newId(),
    userId,
    await sha256(token),
    isoIn(VERIFY_TTL_MS),
    nowIso(),
  );
  const message = verifyEmailMessage(env.SITE_URL, name, token);
  await sendMail(database, env, { to: email, tenant, ...message });
}

export async function issuePasswordReset(
  database: D1Database,
  env: Env,
  email: string,
  tenant: string,
): Promise<void> {
  // Scoped like signIn. An address is only unique per workspace, so an unscoped
  // lookup would mint a reset token against whichever workspace's account
  // SQLite happened to return — letting one visitor take over another's.
  const user = await one<{ id: string; name: string }>(
    database,
    "SELECT id, name FROM users WHERE email = ? AND status = ? AND tenant IN (?, ?)",
    email.toLowerCase(),
    'active',
    tenant,
    PUBLIC_TENANT,
  );
  // Return silently for an unknown address — the caller always shows the same
  // "check your email" screen, so this route reveals nothing either.
  if (!user) return;

  const token = newToken();
  await run(
    database,
    `INSERT INTO auth_tokens (id, user_id, purpose, token_hash, expires_at, created_at)
     VALUES (?, ?, 'reset_password', ?, ?, ?)`,
    newId(),
    user.id,
    await sha256(token),
    isoIn(RESET_TTL_MS),
    nowIso(),
  );
  const message = resetPasswordMessage(env.SITE_URL, user.name, token);
  await sendMail(database, env, { to: email.toLowerCase(), tenant, ...message });
}

/** Consume a one-time token. Returns the user id, or null if it is invalid. */
export async function consumeToken(
  database: D1Database,
  purpose: 'verify_email' | 'reset_password',
  token: string,
): Promise<string | null> {
  const hash = await sha256(token);
  const row = await one<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
    database,
    'SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token_hash = ? AND purpose = ?',
    hash,
    purpose,
  );
  if (!row || row.used_at || row.expires_at <= nowIso()) return null;
  await run(database, 'UPDATE auth_tokens SET used_at = ? WHERE id = ?', nowIso(), row.id);
  return row.user_id;
}

export async function markEmailVerified(database: D1Database, userId: string, request: Request): Promise<void> {
  const now = nowIso();
  await run(database, 'UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?', now, now, userId);
  await audit(database, { actorId: userId, action: 'user.email_verified', entityType: 'user', entityId: userId, request });
}

export async function setPassword(
  database: D1Database,
  userId: string,
  password: string,
  request: Request,
): Promise<void> {
  const now = nowIso();
  await run(
    database,
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    await hashPassword(password),
    now,
    userId,
  );
  // Every existing session is invalidated — a password reset must log out
  // whoever might already be signed in with the old credentials.
  await run(database, 'DELETE FROM sessions WHERE user_id = ?', userId);
  await audit(database, { actorId: userId, action: 'user.password_reset', entityType: 'user', entityId: userId, request });
}

/**
 * Where to send someone straight after signing in. An explicit `next` wins,
 * otherwise the account's own role decides (§6.1).
 */
export function landingFor(
  next: string | null,
  roles: { companyIds: string[]; profileId: string | null; isAdmin: boolean },
): string {
  // Only same-origin paths — never redirect to an attacker-supplied host.
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  if (roles.isAdmin) return '/workspace/admin';
  if (roles.profileId) return '/workspace/freelancer';
  if (roles.companyIds.length) return '/workspace/company';
  return '/specialists';
}
