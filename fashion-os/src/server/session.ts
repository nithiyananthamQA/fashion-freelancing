/**
 * Sessions — an opaque random token in an HttpOnly cookie, its SHA-256 stored
 * in the sessions table. Nothing about the account is ever written to browser
 * storage (plan §13), so client JavaScript cannot read or forge a session.
 */
import type { APIContext } from 'astro';
import { all, one, run, type Ctx } from './db';
import { isoIn, newId, newToken, nowIso, sha256 } from './ids';

export const SESSION_COOKIE = 'ff_sid';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/** Sent mail is kept this long for the operations view, then pruned. */
const SENT_MAIL_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  /** 'editor' may change the marketing pages' content and nothing else. */
  role: 'member' | 'editor';
  isEditor: boolean;
  emailVerified: boolean;
  /** Companies this account belongs to; empty for a freelancer-only account. */
  companyIds: string[];
  /** The account's specialist profile, if it has started one. */
  profileId: string | null;
  profileStatus: string | null;
  profileHandle: string | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  is_admin: number;
  role: string;
  email_verified_at: string | null;
  status: string;
}

export async function createSession(
  database: D1Database,
  userId: string,
  userAgent: string | null,
): Promise<string> {
  const token = newToken();
  await run(
    database,
    'INSERT INTO sessions (id, user_id, expires_at, user_agent, created_at) VALUES (?, ?, ?, ?, ?)',
    await sha256(token),
    userId,
    isoIn(SESSION_TTL_MS),
    userAgent?.slice(0, 250) ?? null,
    nowIso(),
  );
  return token;
}

export function setSessionCookie(ctx: APIContext, token: string): void {
  ctx.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ctx.url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(ctx: APIContext, database: D1Database): Promise<void> {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (token) await run(database, 'DELETE FROM sessions WHERE id = ?', await sha256(token));
  ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * "Sign out everywhere": every session this account holds, on every device,
 * this one included. The rows are the sessions, so deleting them is the whole
 * revocation — there is no signed cookie that could outlive it.
 */
export async function destroyAllSessions(ctx: Ctx, database: D1Database, userId: string): Promise<void> {
  await run(database, 'DELETE FROM sessions WHERE user_id = ?', userId);
  ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** The stored id (the hash) of this request's session, or null when signed out. */
export async function currentSessionId(ctx: Ctx): Promise<string | null> {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : null;
}

/** Resolve the signed-in account for a request. Returns null when signed out. */
export async function loadUser(ctx: Ctx, database: D1Database): Promise<SessionUser | null> {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await one<UserRow & { expires_at: string }>(
    database,
    `SELECT u.id, u.email, u.name, u.is_admin, u.role, u.email_verified_at, u.status, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ?`,
    await sha256(token),
  );
  if (!row) return null;

  // Expired or disabled accounts are treated as signed out, and the stale row
  // is cleared so the table does not grow unbounded.
  if (row.expires_at <= nowIso() || row.status !== 'active') {
    await run(database, 'DELETE FROM sessions WHERE id = ?', await sha256(token));
    return null;
  }

  const memberships = await all<{ company_id: string }>(
    database,
    'SELECT company_id FROM company_members WHERE user_id = ?',
    row.id,
  );
  const profile = await one<{ id: string; status: string; handle: string | null }>(
    database,
    'SELECT id, status, handle FROM specialist_profiles WHERE user_id = ?',
    row.id,
  );

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isAdmin: row.is_admin === 1,
    role: row.role === 'editor' ? 'editor' : 'member',
    isEditor: row.is_admin === 1 || row.role === 'editor',
    emailVerified: row.email_verified_at !== null,
    companyIds: memberships.map((m) => m.company_id),
    profileId: profile?.id ?? null,
    profileStatus: profile?.status ?? null,
    profileHandle: profile?.handle ?? null,
  };
}

/**
 * Drop sessions, one-time tokens and rate-limit windows that have already
 * expired, and mail that was delivered long enough ago to be of no use to the
 * operations view. Nothing else ever deletes them, so the middleware runs this
 * now and then, after the response has gone (src/middleware.ts).
 *
 * Queued and failed mail is kept: without a provider a queued row IS the
 * delivery (src/server/mail.ts), and a failure is what someone needs to see.
 */
export async function pruneExpired(database: D1Database): Promise<void> {
  const now = nowIso();
  await database.batch([
    database.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    database.prepare('DELETE FROM auth_tokens WHERE expires_at <= ?').bind(now),
    database.prepare('DELETE FROM rate_limits WHERE expires_at <= ?').bind(now),
    database.prepare("DELETE FROM outbound_email WHERE status = 'sent' AND created_at <= ?").bind(isoIn(-SENT_MAIL_TTL_MS)),
  ]);
}

export { newId };
