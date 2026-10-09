/**
 * /sign-in/google — sends the browser to Google's account chooser.
 * `next` rides the round trip so a hire request or application picks up where
 * it left off, exactly as with a password sign-in.
 *
 * /sign-in/google?connect=1 — a signed-in person adding Google to their own
 * account from /account. The round trip remembers who started it.
 */
import type { APIRoute } from 'astro';
import { env } from '../../../server/db';
import { landingFor } from '../../../server/auth';
import { safeNext } from '../../../server/guards';
import { beginGoogleSignIn, googleConfigured } from '../../../server/google';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const runtime = env(ctx);
  if (ctx.url.searchParams.get('connect') === '1') {
    if (!ctx.locals.user) return ctx.redirect('/sign-in?next=/account');
    if (!googleConfigured(runtime)) return ctx.redirect('/account');
    return ctx.redirect(await beginGoogleSignIn(ctx, runtime, '/account', { userId: ctx.locals.user.id }), 302);
  }
  const next = safeNext(ctx.url.searchParams.get('next'), null);
  if (ctx.locals.user) return ctx.redirect(landingFor(next, ctx.locals.user));
  if (!googleConfigured(runtime)) return ctx.redirect('/sign-in');
  return ctx.redirect(await beginGoogleSignIn(ctx, runtime, next), 302);
};
