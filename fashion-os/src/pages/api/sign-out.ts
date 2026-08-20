/** POST /api/sign-out — clears the session cookie and its database row. */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db } from '../../server/db';
import { destroySession } from '../../server/session';

export const POST: APIRoute = async (ctx) => {
  await destroySession(ctx, db(ctx));
  return ctx.redirect('/', 303);
};

/* A GET must not change state — send anyone who lands here to the form. */
export const GET: APIRoute = (ctx) => ctx.redirect('/sign-in', 303);
