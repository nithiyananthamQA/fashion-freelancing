/**
 * Resolves the signed-in account once per request and hangs it off
 * `Astro.locals.user`, so no page or endpoint has to repeat the cookie lookup.
 *
 * Static routes (the services website) never reach this — they are served
 * straight from the CDN by Cloudflare Pages.
 */
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { loadUser } from './server/session';
import { resolveTenant } from './server/tenant';

export const onRequest = defineMiddleware(async (context, next) => {
  // The marketing pages used to be static files, and the asset layer answered
  // their `.html` and trailing-slash forms with a redirect to the clean URL.
  // Now that the worker renders them, Astro would quietly serve all three
  // forms, so the same page would exist at three addresses. Keep one.
  const { pathname, search } = context.url;
  if (pathname === '/index.html') return context.redirect('/' + search, 301);
  if (pathname.startsWith('/pages/') && pathname.endsWith('.html')) return context.redirect(pathname.slice(0, -5) + search, 301);
  if (pathname.startsWith('/pages/') && pathname.length > 1 && pathname.endsWith('/')) return context.redirect(pathname.replace(/\/+$/, '') + search, 301);

  context.locals.user = null;
  // Every visitor gets a private workspace; shared demo content is 'public'.
  context.locals.tenant = resolveTenant(context);

  const database = (env as unknown as Env).DB;
  if (database) {
    try {
      context.locals.user = await loadUser(context, database);
    } catch (error) {
      // A broken session must not take the page down — render signed out.
      console.error('[middleware] session lookup failed:', error);
    }
  }

  const response = await next();

  // Signed-in and API responses must never be stored by a shared cache.
  const path = context.url.pathname;
  if (context.locals.user || path.startsWith('/api/') || path.startsWith('/workspace/')) {
    response.headers.set('cache-control', 'private, no-store');
  }
  return response;
});
