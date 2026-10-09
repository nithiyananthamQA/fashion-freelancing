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
import { audit, notify } from './audit';
import { safeNext } from './guards';
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
  /** 'public' in production; the visitor's sandbox under DEMO_SANDBOX — see src/server/tenant.ts. */
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
  // able to sign up as "test@test.com" in their own sandbox. In production
  // there is one workspace, so this is the plain global check.
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
  // test account, even if they guess the address. In sandbox mode the same
  // address can exist in the visitor's own workspace AND in 'public'; their
  // own account wins, rather than whichever row SQLite happened to return.
  // In production `tenant` is 'public' and the unique index allows one row.
  const row = await one<{ id: string; password_hash: string; status: string }>(
    database,
    `SELECT id, password_hash, status FROM users
      WHERE email = ? AND tenant IN (?, 'public')
      ORDER BY tenant = 'public' LIMIT 1`,
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

// --- Google -----------------------------------------------------------------

/**
 * Stored in place of a password hash for accounts made through Google. It is
 * not a `pbkdf2$…` hash, so verifyPassword rejects every guess against it; the
 * owner can still add a real password with "Forgot password", which proves
 * they hold the address.
 */
const NO_PASSWORD = 'google$';

/**
 * Tell the owner whenever Google is connected to or removed from their account
 * — in the workspace and, through notify(), by email. If it wasn't them, this
 * is how they find out.
 */
async function googleNotice(database: D1Database, userId: string, connected: boolean, googleEmail: string | null): Promise<void> {
  try {
    await notify(database, {
      userId,
      kind: 'security',
      title: connected ? 'Google sign-in was added to your account' : 'Google sign-in was removed from your account',
      body: connected
        ? `You can now sign in with the Google account ${googleEmail ?? ''}. If this wasn't you, reset your password straight away and tell us at hello@fashionfreelancing.com.`
        : "Your account no longer signs in with Google. If this wasn't you, reset your password straight away and tell us at hello@fashionfreelancing.com.",
      link: '/account',
    });
  } catch (error) {
    // the change itself has happened; a failed notice must not undo it
    console.error('[auth] google notice failed:', error);
  }
}

export type GoogleSignInResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; message: string };

/**
 * Sign in with an identity Google has already checked (src/server/google.ts):
 * the returning Google account first, then an existing account with the same
 * address — which gets linked — and otherwise a new account.
 */
export async function signInWithGoogle(
  database: D1Database,
  request: Request,
  identity: { sub: string; email: string; name: string },
  tenant: string,
): Promise<GoogleSignInResult> {
  type Row = { id: string; status: string; email_verified_at: string | null; google_sub: string | null };
  const now = nowIso();
  const inactive = { ok: false as const, message: 'That account is not active. Contact us if you think this is wrong.' };

  let row = await one<Row>(database,
    `SELECT id, status, email_verified_at, google_sub FROM users
      WHERE google_sub = ? AND tenant IN (?, 'public') ORDER BY tenant = 'public' LIMIT 1`,
    identity.sub, tenant);

  if (!row) {
    row = await one<Row>(database,
      `SELECT id, status, email_verified_at, google_sub FROM users
        WHERE email = ? AND tenant IN (?, 'public') ORDER BY tenant = 'public' LIMIT 1`,
      identity.email, tenant);
    // The address already belongs to a different Google identity — never
    // move an account from one Google login to another.
    if (row?.google_sub && row.google_sub !== identity.sub) {
      return { ok: false, message: 'That email is linked to a different Google account. Sign in with that one, or with your password.' };
    }
    if (row) {
      if (row.status !== 'active') return inactive;
      /* Linking proves the person holds the address. If the existing account
         never confirmed it, its password may have been set by someone who
         only typed that address in — so it is wiped and its sessions ended,
         and the account belongs to the person who actually owns the email. */
      if (!row.email_verified_at) {
        await run(database, 'UPDATE users SET password_hash = ? WHERE id = ?', NO_PASSWORD, row.id);
        await run(database, 'DELETE FROM sessions WHERE user_id = ?', row.id);
      }
      await run(database,
        'UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?',
        identity.sub, now, now, row.id);
      await audit(database, { actorId: row.id, action: 'user.google_linked', entityType: 'user', entityId: row.id, detail: { via: 'sign-in' }, request });
      await googleNotice(database, row.id, true, identity.email);
      return { ok: true, userId: row.id, created: false };
    }

    // Nobody yet: a new account, already confirmed, since Google checked the address.
    const id = newId();
    await run(database,
      `INSERT INTO users (id, email, password_hash, name, email_verified_at, terms_accepted_at, google_sub, tenant, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, identity.email, NO_PASSWORD, identity.name, now, now, identity.sub, tenant, now, now);
    await audit(database, { actorId: id, action: 'user.signed_up', entityType: 'user', entityId: id, detail: { via: 'google' }, request });
    return { ok: true, userId: id, created: true };
  }

  if (row.status !== 'active') return inactive;
  await audit(database, { actorId: row.id, action: 'user.signed_in_google', entityType: 'user', entityId: row.id, request });
  return { ok: true, userId: row.id, created: false };
}

/** How an account can sign in: with a password, with Google, or both. */
export async function signInMethods(database: D1Database, userId: string): Promise<{ password: boolean; google: boolean }> {
  const row = await one<{ password_hash: string; google_sub: string | null }>(
    database, 'SELECT password_hash, google_sub FROM users WHERE id = ?', userId,
  );
  return { password: Boolean(row?.password_hash.startsWith('pbkdf2$')), google: Boolean(row?.google_sub) };
}

export type ConnectGoogleResult = 'connected' | 'already' | 'in-use' | 'email-in-use';

/**
 * A signed-in person adds Google to their own account (from /account). They
 * have proved both sides — this session, and the Google account they just
 * chose — so the Google address may differ from the one they sign in with.
 * Refused when that Google account, or its address, already belongs to a
 * different account here: one identity, one account.
 */
export async function connectGoogle(
  database: D1Database,
  request: Request,
  userId: string,
  identity: { sub: string; email: string },
): Promise<ConnectGoogleResult> {
  const owner = await one<{ id: string }>(database, 'SELECT id FROM users WHERE google_sub = ?', identity.sub);
  if (owner) return owner.id === userId ? 'already' : 'in-use';
  const sameEmail = await one<{ id: string }>(database, 'SELECT id FROM users WHERE email = ? AND id <> ?', identity.email, userId);
  if (sameEmail) return 'email-in-use';
  const done = await run(database,
    'UPDATE users SET google_sub = ?, updated_at = ? WHERE id = ? AND google_sub IS NULL', identity.sub, nowIso(), userId);
  if (!done.meta.changes) return 'already';
  await audit(database, { actorId: userId, action: 'user.google_linked', entityType: 'user', entityId: userId, detail: { via: 'account' }, request });
  await googleNotice(database, userId, true, identity.email);
  return 'connected';
}

/**
 * Remove Google from an account. Only when it also has a password — otherwise
 * this would lock the owner out of their own account.
 */
export async function disconnectGoogle(database: D1Database, request: Request, userId: string): Promise<boolean> {
  const methods = await signInMethods(database, userId);
  if (!methods.google || !methods.password) return false;
  await run(database, 'UPDATE users SET google_sub = NULL, updated_at = ? WHERE id = ?', nowIso(), userId);
  await audit(database, { actorId: userId, action: 'user.google_unlinked', entityType: 'user', entityId: userId, request });
  await googleNotice(database, userId, false, null);
  return true;
}

/** What a freshly signed-in account is, for `landingFor` and the shortlist merge. */
export async function rolesOf(database: D1Database, userId: string) {
  const company = await one<{ company_id: string }>(
    database, 'SELECT company_id FROM company_members WHERE user_id = ? LIMIT 1', userId,
  );
  const profile = await one<{ id: string }>(
    database, 'SELECT id FROM specialist_profiles WHERE user_id = ?', userId,
  );
  const account = await one<{ is_admin: number; role: string }>(database, 'SELECT is_admin, role FROM users WHERE id = ?', userId);
  return {
    companyIds: company ? [company.company_id] : [],
    profileId: profile?.id ?? null,
    isAdmin: account?.is_admin === 1,
    role: account?.role ?? 'member',
  };
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
  // Scoped like signIn, and resolved the same way, so the reset lands on the
  // very account a sign-in with that address would open. An unscoped lookup
  // would mint a token against whichever sandbox's account SQLite returned —
  // letting one visitor take over another's.
  const user = await one<{ id: string; name: string }>(
    database,
    `SELECT id, name FROM users
      WHERE email = ? AND status = ? AND tenant IN (?, ?)
      ORDER BY tenant = ? LIMIT 1`,
    email.toLowerCase(),
    'active',
    tenant,
    PUBLIC_TENANT,
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

/**
 * Whether a one-time token would still be accepted, without using it up.
 * Lets a page say "this link has expired" when it opens instead of after the
 * visitor has pressed the button.
 */
export async function tokenIsLive(
  database: D1Database,
  purpose: 'verify_email' | 'reset_password',
  token: string,
): Promise<boolean> {
  if (!token) return false;
  const row = await one<{ id: string }>(
    database,
    `SELECT id FROM auth_tokens
      WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?`,
    await sha256(token),
    purpose,
    nowIso(),
  );
  return row !== null;
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
  /** The session hash to leave signed in — the person who made the change. */
  keepSessionId: string | null = null,
  /** A forgotten-password reset, or a change made while signed in — the audit log tells them apart. */
  reason: 'reset' | 'change' = 'reset',
): Promise<void> {
  const now = nowIso();
  await run(
    database,
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    await hashPassword(password),
    now,
    userId,
  );
  // Every other session is invalidated — a new password must log out whoever
  // might already be signed in with the old one. A reset keeps none; a change
  // from the account page keeps the browser it was made in.
  await run(database, 'DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?', userId, keepSessionId);
  await audit(database, { actorId: userId, action: reason === 'change' ? 'user.password_changed' : 'user.password_reset', entityType: 'user', entityId: userId, request });
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; field: 'current' | 'password'; message: string };

/**
 * A signed-in password change. The current password is asked for again: a
 * session left open on a shared computer must not be enough to lock the owner
 * out of their own account.
 */
export async function changePassword(
  database: D1Database,
  userId: string,
  current: string,
  next: string,
  request: Request,
  keepSessionId: string | null,
): Promise<ChangePasswordResult> {
  const row = await one<{ password_hash: string }>(database, 'SELECT password_hash FROM users WHERE id = ?', userId);
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return { ok: false, field: 'current', message: 'That is not your current password.' };
  }
  if (current === next) {
    return { ok: false, field: 'password', message: 'Choose a password you are not already using.' };
  }
  await setPassword(database, userId, next, request, keepSessionId, 'change');
  return { ok: true };
}

/**
 * Where to send someone straight after signing in. An explicit `next` wins,
 * otherwise the account's own role decides (§6.1).
 */
export function landingFor(
  next: string | null,
  roles: { companyIds: string[]; profileId: string | null; isAdmin: boolean; role?: string },
): string {
  // Only same-origin paths — never redirect to an attacker-supplied host.
  const safe = safeNext(next, null);
  if (safe) return safe;
  if (roles.isAdmin) return '/workspace/admin';
  if (roles.role === 'editor') return '/workspace/content';
  if (roles.profileId) return '/workspace/freelancer';
  if (roles.companyIds.length) return '/workspace/company';
  return '/specialists';
}
