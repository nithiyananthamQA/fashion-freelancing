/**
 * Shortlist — the list of specialists a visitor is considering.
 *
 * It works signed OUT. Putting an account wall in front of "I might want this
 * person" was the wrong trade: it interrupts the one thing a visitor came to do
 * (compare people) to demand a decision they are not ready to make.
 *
 * So: signed out, the shortlist lives in a cookie. The moment the visitor signs
 * in and has a company, everything in that cookie is merged into
 * `saved_specialists` and the cookie is dropped. Nothing they picked is lost,
 * and they were never asked to stop and register.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { all, one, run } from './db';
import { nowIso } from './ids';
import { PUBLIC_TENANT, tenantOf } from './tenant';

type Ctx = APIContext | AstroGlobal;

const COOKIE = 'ff_shortlist';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** A shortlist is for comparing a handful of people, not hoarding. */
const MAX_ITEMS = 40;

export function readCookieShortlist(ctx: Ctx): string[] {
  const raw = ctx.cookies.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_ITEMS)
      : [];
  } catch {
    return [];
  }
}

function writeCookieShortlist(ctx: Ctx, ids: string[]): void {
  if (!ids.length) {
    ctx.cookies.delete(COOKIE, { path: '/' });
    return;
  }
  ctx.cookies.set(COOKIE, encodeURIComponent(JSON.stringify(ids.slice(0, MAX_ITEMS))), {
    httpOnly: true,
    secure: ctx.url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Toggle in the cookie. Returns true when the specialist is now shortlisted. */
export function toggleCookieShortlist(ctx: Ctx, profileId: string): boolean {
  const current = readCookieShortlist(ctx);
  const at = current.indexOf(profileId);
  if (at === -1) {
    current.push(profileId);
    writeCookieShortlist(ctx, current);
    return true;
  }
  current.splice(at, 1);
  writeCookieShortlist(ctx, current);
  return false;
}

/** Toggle in the database, for a signed-in company member. */
export async function toggleSavedSpecialist(
  database: D1Database,
  companyId: string,
  userId: string,
  profileId: string,
): Promise<boolean> {
  const existing = await one<{ profile_id: string }>(
    database,
    'SELECT profile_id FROM saved_specialists WHERE company_id = ? AND profile_id = ?',
    companyId,
    profileId,
  );
  if (existing) {
    await run(database, 'DELETE FROM saved_specialists WHERE company_id = ? AND profile_id = ?', companyId, profileId);
    return false;
  }
  await run(
    database,
    'INSERT INTO saved_specialists (company_id, profile_id, saved_by, created_at) VALUES (?, ?, ?, ?)',
    companyId,
    profileId,
    userId,
    nowIso(),
  );
  return true;
}

/**
 * Fold anything shortlisted while signed out into the company's saved list.
 * Called after sign-in and after company setup. Safe to call repeatedly.
 */
export async function mergeCookieShortlist(
  ctx: Ctx,
  database: D1Database,
  companyId: string,
  userId: string,
): Promise<number> {
  const ids = readCookieShortlist(ctx);
  if (!ids.length) return 0;

  // Only approved profiles from this workspace survive the merge — a profile
  // could have been paused or rejected between shortlisting and signing in, and
  // the ids come from a cookie the visitor could have edited by hand.
  const rows = await all<{ id: string }>(
    database,
    `SELECT p.id FROM specialist_profiles p
       JOIN users u ON u.id = p.user_id
      WHERE p.status = 'approved' AND u.tenant IN (?, ?)
        AND p.id IN (${ids.map(() => '?').join(',')})`,
    tenantOf(ctx), PUBLIC_TENANT, ...ids,
  );
  if (rows.length) {
    const now = nowIso();
    await database.batch(
      rows.map((row) =>
        database
          .prepare(
            `INSERT INTO saved_specialists (company_id, profile_id, saved_by, created_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (company_id, profile_id) DO NOTHING`,
          )
          .bind(companyId, row.id, userId, now),
      ),
    );
  }
  writeCookieShortlist(ctx, []);
  return rows.length;
}

/** The shortlist for whoever is asking — company list if signed in, cookie if not. */
export async function currentShortlist(
  ctx: Ctx,
  database: D1Database,
  companyId: string | null,
): Promise<Set<string>> {
  if (companyId) {
    const rows = await all<{ profile_id: string }>(
      database,
      'SELECT profile_id FROM saved_specialists WHERE company_id = ?',
      companyId,
    );
    return new Set(rows.map((r) => r.profile_id));
  }
  return new Set(readCookieShortlist(ctx));
}
