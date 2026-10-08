/**
 * POST /api/sign-out — clears the session cookie and its database row.
 *
 * With `everywhere=1` (the button on /account) it ends every session the
 * account holds, on every device — the answer to "I signed in on a computer
 * that wasn't mine".
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../server/db';
import { destroyAllSessions, destroySession } from '../../server/session';

export const POST: APIRoute = async (ctx) => {
  const database = db(ctx);
  // The plain sign-out button sends no fields; a body that is not a form is
  // just that.
  const form = await ctx.request.formData().catch(() => null);
  const user = ctx.locals.user;

  if (user && form?.get('everywhere') === '1') {
    await destroyAllSessions(ctx, database, user.id);
    return ctx.redirect('/sign-in?note=everywhere', 303);
  }
  await destroySession(ctx, database);
  return ctx.redirect('/', 303);
};

/* A GET must not change state — send anyone who lands here to the form. */
export const GET: APIRoute = (ctx) => ctx.redirect('/sign-in', 303);
