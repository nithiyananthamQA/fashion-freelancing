/**
 * POST /api/saved — add or remove a specialist from the shortlist.
 *
 * No sign-in wall. Shortlisting is how a visitor compares people, so it must
 * work before they have an account: signed out it goes in a cookie, and the
 * cookie is merged into the company's list the moment they sign in.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db, one } from '../../server/db';
import { toggleCookieShortlist, toggleSavedSpecialist } from '../../server/shortlist';
import { PUBLIC_TENANT, tenantOf } from '../../server/tenant';

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const profileId = String(form.get('profileId') ?? '');
  const rawNext = String(form.get('next') ?? '/specialists');
  // Same-origin paths only, so this cannot become an open redirect.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/specialists';

  const database = db(ctx);

  // Only an approved profile in this visitor's workspace can be shortlisted —
  // never leak that a draft, or another visitor's specialist, exists.
  const profile = await one<{ id: string }>(
    database,
    `SELECT p.id FROM specialist_profiles p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = ? AND p.status = 'approved' AND u.tenant IN (?, ?)`,
    profileId, tenantOf(ctx), PUBLIC_TENANT,
  );
  if (!profile) return new Response(null, { status: 404 });

  const user = ctx.locals.user;
  const companyId = user?.companyIds[0] ?? null;

  if (user && companyId) await toggleSavedSpecialist(database, companyId, user.id, profileId);
  else toggleCookieShortlist(ctx, profileId);

  return ctx.redirect(next, 303);
};
