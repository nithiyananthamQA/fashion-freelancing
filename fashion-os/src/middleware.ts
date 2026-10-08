/**
 * Resolves the signed-in account once per request and hangs it off
 * `Astro.locals.user`, so no page or endpoint has to repeat the cookie lookup.
 *
 * Static routes (the services website) never reach this — they are served
 * straight from the CDN by Cloudflare Pages.
 */
import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { loadUser, pruneExpired } from './server/session';
import { PUBLIC_TENANT, resolveTenant } from './server/tenant';

/* Retired service pages -> where they live now, mirrored from public/_redirects.
   That file is read by the asset layer in production; nothing reads it in local
   dev or a preview build. Checked before the `.html` rule below, so an old
   `.html` address lands on the new page in one hop, not two. */
const RETIRED: Record<string, string> = {
  '/pages/services/website': '/pages/services/web-development',
  '/pages/services/web-design': '/pages/services/web-development',
  '/pages/services/graphic-design': '/pages/services/web-development',
  '/pages/services/seamless-pattern': '/pages/services/graphics-prints',
};

/* The asset layer adds these to static files from public/_headers; nothing
   adds them to what the worker renders, so they are set here. */
const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  'strict-transport-security': 'max-age=31536000',
};

function secure(response: Response): Response {
  // Response.redirect() and some fetched responses have immutable headers.
  try {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!response.headers.has(name)) response.headers.set(name, value);
    return response;
  } catch {
    const copy = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!copy.headers.has(name)) copy.headers.set(name, value);
    return copy;
  }
}

/* Expired sessions, one-time tokens and rate-limit windows are deleted only by
   pruneExpired, and there is no cron trigger to run it. About one request in
   fifty does, after its response has gone — the sweep never sits on anyone's
   page load, and a failure costs nothing but a log line. */
const PRUNE_ONE_IN = 50;

function pruneNowAndThen(context: APIContext, database: D1Database): void {
  if (Math.random() * PRUNE_ONE_IN >= 1) return;
  const cf = (context.locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
  if (!cf) return;
  cf.waitUntil(pruneExpired(database).catch((error) => console.error('[middleware] prune failed:', error)));
}

export const onRequest = defineMiddleware(async (context, next) => secure(await handle(context, next)));

async function handle(context: APIContext, next: MiddlewareNext): Promise<Response> {
  // The marketing pages used to be static files, and the asset layer answered
  // their `.html` and trailing-slash forms with a redirect to the clean URL.
  // Now that the worker renders them, Astro would quietly serve all three
  // forms, so the same page would exist at three addresses. Keep one.
  const { pathname, search } = context.url;
  // One host: www answers with the apex, so search engines index one copy and
  // a sign-in cookie set on one host is never missing on the other.
  if (context.url.hostname.startsWith('www.')) {
    const method = context.request.method;
    return Response.redirect(`${context.url.protocol}//${context.url.host.slice(4)}${pathname}${search}`, method === 'GET' || method === 'HEAD' ? 301 : 308);
  }
  const retired = RETIRED[pathname.replace(/\.html$|\/+$/, '')];
  if (retired) return context.redirect(retired + search, 301);
  if (pathname === '/index.html') return context.redirect('/' + search, 301);
  if (pathname.startsWith('/pages/') && pathname.endsWith('.html')) return context.redirect(pathname.slice(0, -5) + search, 301);
  if (pathname.startsWith('/pages/') && pathname.length > 1 && pathname.endsWith('/')) return context.redirect(pathname.replace(/\/+$/, '') + search, 301);

  context.locals.user = null;
  // The marketing pages are the same for everyone and served from the edge
  // cache (src/server/site-content.ts): no cookie, no session lookup.
  if (pathname === '/' || pathname.startsWith('/pages/')) {
    context.locals.tenant = PUBLIC_TENANT;
    return next();
  }
  // One shared workspace, 'public' — or, under DEMO_SANDBOX=1, a private
  // one per browser (src/server/tenant.ts).
  context.locals.tenant = resolveTenant(context);

  const database = (env as unknown as Env).DB;
  if (database) {
    try {
      context.locals.user = await loadUser(context, database);
    } catch (error) {
      // A broken session must not take the page down — render signed out.
      console.error('[middleware] session lookup failed:', error);
    }
    pruneNowAndThen(context, database);
  }

  const response = await next();

  // Signed-in and API responses must never be stored by a shared cache.
  const path = context.url.pathname;
  if (context.locals.user || path.startsWith('/api/') || path.startsWith('/workspace/')) {
    response.headers.set('cache-control', 'private, no-store');
  }
  return response;
}
