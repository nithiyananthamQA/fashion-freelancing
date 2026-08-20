/**
 * Per-visitor sandboxes.
 *
 * Every browser gets a workspace id in a cookie the first time it asks for a
 * page. Everything that browser creates is stamped with it, and every listing
 * shows only that workspace plus the shared demo content.
 *
 * The effect: a reviewer can walk the whole product alone — sign up as a
 * freelancer, approve it as an admin, hire it as a company — without their test
 * data appearing to anyone else, and without anyone else's appearing to them.
 *
 * This is a demo-time isolation boundary, not a security boundary. It keeps
 * strangers' test data apart; it is not designed to withstand someone who
 * deliberately forges another workspace id.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { one } from './db';
import { newId } from './ids';

type Ctx = APIContext | AstroGlobal;

const COOKIE = 'ff_ws';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Content everybody sees: the seeded specialists and the ten services. */
export const PUBLIC_TENANT = 'public';

/**
 * The workspace for this request, creating one if the browser has none.
 * Safe to call on every request — it only writes the cookie when it is missing.
 */
export function resolveTenant(ctx: Ctx): string {
  const existing = ctx.cookies.get(COOKIE)?.value;
  if (existing && /^[0-9A-Z]{20,32}$/.test(existing)) return existing;

  const id = newId();
  ctx.cookies.set(COOKIE, id, {
    httpOnly: true,
    secure: ctx.url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return id;
}

/** The workspace already resolved for this request by the middleware. */
export const tenantOf = (ctx: Ctx): string =>
  (ctx.locals as App.Locals).tenant ?? PUBLIC_TENANT;

/**
 * SQL fragment + params for "mine or shared". Written as a helper so no query
 * can accidentally forget the shared half and show an empty directory.
 */
export function tenantScope(column: string, tenant: string): { sql: string; params: string[] } {
  return { sql: `${column} IN (?, ?)`, params: [tenant, PUBLIC_TENANT] };
}

/**
 * The workspace named by a raw Request's cookie header.
 *
 * `audit()` and the rate limiter only ever receive a Request, not the Astro
 * context, so this is how they stamp the workspace without every call site
 * having to pass it down.
 */
export function tenantFromRequest(request: Request | undefined): string {
  const header = request?.headers.get('cookie');
  if (!header) return PUBLIC_TENANT;
  const match = header.match(/(?:^|;\s*)ff_ws=([0-9A-Z]{20,32})(?:;|$)/);
  return match?.[1] ?? PUBLIC_TENANT;
}

/*
 * Ownership guards.
 *
 * Every listing in the product is workspace-scoped, but the POST handlers that
 * act on what those listings show took an id straight from the form. A form can
 * be replayed with somebody else's id, so the check has to happen again on
 * write. These return the row only when it belongs to the caller's workspace —
 * `if (!await ownedProfile(...)) return;` is the whole pattern.
 */

/** A specialist profile, only if its owner is in this workspace. */
export function ownedProfile<T = { id: string }>(
  database: D1Database,
  profileId: string,
  tenant: string,
  columns = 'p.id',
): Promise<T | null> {
  return one<T>(
    database,
    `SELECT ${columns} FROM specialist_profiles p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = ? AND u.tenant IN (?, ?)`,
    profileId, tenant, PUBLIC_TENANT,
  );
}

/** A posted project, only if the company that posted it is in this workspace. */
export function ownedProject<T = { id: string }>(
  database: D1Database,
  projectId: string,
  tenant: string,
  columns = 'p.id',
): Promise<T | null> {
  return one<T>(
    database,
    `SELECT ${columns} FROM projects p
       JOIN companies c ON c.id = p.company_id
      WHERE p.id = ? AND c.tenant IN (?, ?)`,
    projectId, tenant, PUBLIC_TENANT,
  );
}

/** A direct-service enquiry, only if it was submitted in this workspace. */
export function ownedLead<T = { id: string }>(
  database: D1Database,
  leadId: string,
  tenant: string,
  columns = 'id',
): Promise<T | null> {
  return one<T>(
    database,
    `SELECT ${columns} FROM leads WHERE id = ? AND tenant IN (?, ?)`,
    leadId, tenant, PUBLIC_TENANT,
  );
}
