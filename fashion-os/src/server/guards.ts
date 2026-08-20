/**
 * Route authorization — plan §11, "Permission rules".
 *
 * Every signed-in page and every mutating endpoint starts with one of these.
 * They throw a `Response` (redirect for pages, JSON for the API), which Astro
 * returns directly, so a guard can never be forgotten halfway down a handler.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { one, type Ctx } from './db';
import type { SessionUser } from './session';

export class GuardRedirect extends Error {
  constructor(public readonly response: Response) {
    super('guard');
  }
}

const user = (ctx: Ctx): SessionUser | null => (ctx.locals as App.Locals).user;

/** Where to send someone after signing in — preserves the page they wanted. */
export function signInUrl(ctx: Ctx, note?: string): string {
  const next = ctx.url.pathname + ctx.url.search;
  const params = new URLSearchParams({ next });
  if (note) params.set('note', note);
  return `/sign-in?${params}`;
}

/** Any signed-in account. */
export function requireUser(ctx: Ctx): SessionUser {
  const current = user(ctx);
  if (!current) throw new GuardRedirect(redirect(signInUrl(ctx)));
  return current;
}

/**
 * A company member. `next` is preserved so a visitor who clicks "Request to
 * hire" lands back on the same specialist after signing in (§6.1), and a
 * signed-in account with no company yet is sent to finish company setup.
 */
export function requireCompany(ctx: Ctx): { user: SessionUser; companyId: string } {
  const current = requireUser(ctx);
  const companyId = current.companyIds[0];
  if (!companyId) {
    const next = encodeURIComponent(ctx.url.pathname + ctx.url.search);
    throw new GuardRedirect(redirect(`/company/setup?next=${next}`));
  }
  return { user: current, companyId };
}

/** An approved specialist. Draft and in-review profiles get their workspace. */
export function requireApprovedSpecialist(ctx: Ctx): { user: SessionUser; profileId: string } {
  const current = requireUser(ctx);
  if (!current.profileId) throw new GuardRedirect(redirect('/apply'));
  if (current.profileStatus !== 'approved') throw new GuardRedirect(redirect('/workspace/freelancer'));
  return { user: current, profileId: current.profileId };
}

/** Any specialist profile, approved or not — used by the wizard and workspace. */
export function requireSpecialist(ctx: Ctx): { user: SessionUser; profileId: string } {
  const current = requireUser(ctx);
  if (!current.profileId) throw new GuardRedirect(redirect('/apply'));
  return { user: current, profileId: current.profileId };
}

export function requireAdmin(ctx: Ctx): SessionUser {
  const current = user(ctx);
  // A non-admin must not be able to discover that /workspace/admin exists.
  if (!current || !current.isAdmin) throw new GuardRedirect(notFound());
  return current;
}

// --- ownership checks -------------------------------------------------------

/** Confirm a project belongs to the caller's company before exposing it. */
export async function assertProjectOwner(
  database: D1Database,
  projectId: string,
  companyId: string,
): Promise<void> {
  const row = await one<{ id: string }>(
    database,
    'SELECT id FROM projects WHERE id = ? AND company_id = ?',
    projectId,
    companyId,
  );
  if (!row) throw new GuardRedirect(notFound());
}

/** A freelancer may read a project only when invited or matched to it (§11). */
export async function assertProjectVisibleToSpecialist(
  database: D1Database,
  projectId: string,
  profileId: string,
): Promise<void> {
  const row = await one<{ id: string }>(
    database,
    `SELECT p.id FROM projects p
      WHERE p.id = ?
        AND p.status IN ('published','responding','shortlisted')
        AND (
          EXISTS (SELECT 1 FROM project_invites i WHERE i.project_id = p.id AND i.profile_id = ?)
          OR (p.visibility = 'matched'
              AND EXISTS (SELECT 1 FROM specialist_service_offerings o
                           WHERE o.profile_id = ? AND o.service_id = p.service_id))
        )`,
    projectId,
    profileId,
    profileId,
  );
  if (!row) throw new GuardRedirect(notFound());
}

// --- responses --------------------------------------------------------------

const redirect = (location: string): Response =>
  new Response(null, { status: 302, headers: { Location: location } });

const notFound = (): Response => new Response(null, { status: 404 });

/**
 * Wrap a page body so a thrown guard becomes its redirect. Astro pages call
 * this instead of try/catch:
 *
 *   const gate = await guard(Astro, () => requireCompany(Astro));
 *   if (gate.response) return gate.response;
 */
export async function guard<T>(
  _ctx: APIContext | AstroGlobal,
  fn: () => T | Promise<T>,
): Promise<{ value: T; response: null } | { value: null; response: Response }> {
  try {
    return { value: await fn(), response: null };
  } catch (error) {
    if (error instanceof GuardRedirect) return { value: null, response: error.response };
    throw error;
  }
}
