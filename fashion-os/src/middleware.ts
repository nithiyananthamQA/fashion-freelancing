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

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

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
