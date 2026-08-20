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

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
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

/** Resolve the signed-in account for a request. Returns null when signed out. */
export async function loadUser(ctx: Ctx, database: D1Database): Promise<SessionUser | null> {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await one<UserRow & { expires_at: string }>(
    database,
    `SELECT u.id, u.email, u.name, u.is_admin, u.email_verified_at, u.status, s.expires_at
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
    emailVerified: row.email_verified_at !== null,
    companyIds: memberships.map((m) => m.company_id),
    profileId: profile?.id ?? null,
    profileStatus: profile?.status ?? null,
    profileHandle: profile?.handle ?? null,
  };
}

/** Drop sessions and one-time tokens that have already expired. */
export async function pruneExpired(database: D1Database): Promise<void> {
  const now = nowIso();
  await database.batch([
    database.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    database.prepare('DELETE FROM auth_tokens WHERE expires_at <= ?').bind(now),
    database.prepare('DELETE FROM rate_limits WHERE expires_at <= ?').bind(now),
  ]);
}

export { newId };
