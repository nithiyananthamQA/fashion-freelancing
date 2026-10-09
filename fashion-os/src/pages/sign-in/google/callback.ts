/**
 * /sign-in/google/callback — where Google sends the browser back.
 *
 * Every way this can go wrong (the person cancelled, the link was replayed or
 * forged, Google refused the code, the account is suspended) lands back on
 * /sign-in with a plain note, never on an error page.
 */
import type { APIRoute } from 'astro';
import { db, env } from '../../../server/db';
import { connectGoogle, landingFor, rolesOf, signInWithGoogle } from '../../../server/auth';
import { finishGoogleSignIn, googleConfigured, stateMatches, takePending } from '../../../server/google';
import { clientKey, limited, tooManyRequests } from '../../../server/rate-limit';
import { createSession, setSessionCookie } from '../../../server/session';
import { mergeCookieShortlist } from '../../../server/shortlist';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const runtime = env(ctx);
  const pending = takePending(ctx);
  const back = (note: string) =>
    ctx.redirect(`/sign-in?note=${note}${pending?.next ? `&next=${encodeURIComponent(pending.next)}` : ''}`);

  if (!googleConfigured(runtime)) return ctx.redirect('/sign-in');
  if (ctx.url.searchParams.get('error')) return back('google-cancelled');
  const code = ctx.url.searchParams.get('code');
  if (!pending || !code || !stateMatches(pending, ctx.url.searchParams.get('state'))) return back('google-failed');

  const database = db(ctx);
  if (await limited(database, 'signIn', clientKey(ctx.request))) return tooManyRequests();

  /* Adding Google to an account from /account: only the same signed-in
     session that started it may finish it. */
  if (pending.mode === 'connect') {
    const user = ctx.locals.user;
    if (!user || user.id !== pending.userId) return ctx.redirect('/sign-in?next=/account');
    const identity = await finishGoogleSignIn(ctx, runtime, code, pending);
    if (!identity) return ctx.redirect('/account?google=failed');
    return ctx.redirect(`/account?google=${await connectGoogle(database, ctx.request, user.id, identity)}`);
  }

  const identity = await finishGoogleSignIn(ctx, runtime, code, pending);
  if (!identity) return back('google-failed');

  const result = await signInWithGoogle(database, ctx.request, identity, ctx.locals.tenant);
  if (!result.ok) return back(result.message.startsWith('That email is linked') ? 'google-other-account' : 'google-inactive');

  const token = await createSession(database, result.userId, ctx.request.headers.get('user-agent'));
  setSessionCookie(ctx, token);
  const roles = await rolesOf(database, result.userId);
  // anything shortlisted before signing in now belongs to their company
  if (roles.companyIds[0]) await mergeCookieShortlist(ctx, database, roles.companyIds[0], result.userId);
  return ctx.redirect(landingFor(pending.next, roles));
};
