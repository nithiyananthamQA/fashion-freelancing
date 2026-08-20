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
