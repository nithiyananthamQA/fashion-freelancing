/**
 * GET /api/files/[...key] — the ONLY way an R2 object is read.
 *
 * Every request re-checks authorization against the row that owns the object
 * (plan §11, §13). There is no public bucket and no signed URL that outlives
 * the session, so a link copied out of the page is useless to anyone else.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db, env, one } from '../../../server/db';
import { getObject } from '../../../server/storage';
import { PUBLIC_TENANT } from '../../../server/tenant';

export const GET: APIRoute = async (ctx) => {
  const key = ctx.params.key;
  if (!key) return new Response(null, { status: 404 });

  // Uploads are off unless an R2 bucket is bound, so there is nothing to serve.
  const bucket = env(ctx).MEDIA;
  if (!bucket) return new Response(null, { status: 404 });

  const database = db(ctx);
  const user = ctx.locals.user;

  // 1. Portfolio evidence on an approved profile is public, exactly as the
  //    profile page is. Anything not yet approved is owner-or-admin only.
  const portfolio = await one<{ profile_id: string; moderation: string; owner: string; profile_status: string }>(
    database,
    `SELECT pi.profile_id, pi.moderation, p.user_id AS owner, p.status AS profile_status
       FROM portfolio_items pi JOIN specialist_profiles p ON p.id = pi.profile_id
      WHERE pi.media_key = ?`,
    key,
  );
  if (portfolio) {
    const isPublic = portfolio.moderation === 'approved' && portfolio.profile_status === 'approved';
    const isOwner = user?.id === portfolio.owner;
    if (!isPublic && !isOwner && !user?.isAdmin) return new Response(null, { status: 404 });
    return getObject(bucket, key);
  }

  // 2. Attachments are always private: whoever is party to the request, the
  //    project, the reply or the work the file was sent with — and the
  //    operations team of the workspace it belongs to.
  const attachment = await one<{
    owner_id: string; owner_tenant: string; filename: string; scan_status: string;
    project_id: string | null; hire_request_id: string | null; engagement_id: string | null; message_id: string | null;
  }>(
    database,
    `SELECT at.owner_id, u.tenant AS owner_tenant, at.filename, at.scan_status,
            at.project_id, at.hire_request_id, at.engagement_id, at.message_id
       FROM attachments at
       JOIN users u ON u.id = at.owner_id
      WHERE at.media_key = ? AND at.scan_status != ?`,
    key,
    'blocked',
  );
  if (!attachment || !user) return new Response(null, { status: 404 });

  // An admin is an admin of one workspace (src/server/tenant.ts), not of all of them.
  const isAdmin = user.isAdmin && (attachment.owner_tenant === ctx.locals.tenant || attachment.owner_tenant === PUBLIC_TENANT);
  if (isAdmin || user.id === attachment.owner_id) return getObject(bucket, key, attachment.filename);

  // Nobody else reads a file a scanner has not cleared (see repo/attachments.ts).
  if (attachment.scan_status !== 'clean') return new Response(null, { status: 404 });

  // A file sent inside a conversation belongs to whatever that conversation hangs off.
  const message = attachment.message_id
    ? await one<{ hire_request_id: string | null; application_id: string | null; engagement_id: string | null }>(
        database,
        'SELECT hire_request_id, application_id, engagement_id FROM messages WHERE id = ?',
        attachment.message_id,
      )
    : null;

  const allowed = await one<{ n: number }>(
    database,
    `SELECT COUNT(*) AS n FROM (
        SELECT 1 FROM projects p
          WHERE p.id = ?1 AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = ?4)
        UNION ALL
        -- a specialist who replied to the project, or who may see it right now
        -- by the same rule as /projects: invited, or matched to an open one (§11)
        SELECT 1 FROM projects p
          JOIN specialist_profiles sp ON sp.user_id = ?4
          WHERE p.id = ?1 AND (
            EXISTS (SELECT 1 FROM applications a WHERE a.project_id = p.id AND a.profile_id = sp.id)
            OR EXISTS (SELECT 1 FROM project_invites i WHERE i.project_id = p.id AND i.profile_id = sp.id)
            OR (sp.status = 'approved' AND p.visibility = 'matched'
                AND p.status IN ('published', 'responding', 'shortlisted')
                AND EXISTS (SELECT 1 FROM specialist_service_offerings o
                             WHERE o.profile_id = sp.id AND o.service_id = p.service_id)))
        UNION ALL
        SELECT 1 FROM hire_requests h
          WHERE h.id = ?2 AND (
            h.company_id IN (SELECT company_id FROM company_members WHERE user_id = ?4)
            OR h.profile_id IN (SELECT id FROM specialist_profiles WHERE user_id = ?4))
        UNION ALL
        SELECT 1 FROM engagements e
          WHERE e.id = ?3 AND (
            e.company_id IN (SELECT company_id FROM company_members WHERE user_id = ?4)
            OR e.profile_id IN (SELECT id FROM specialist_profiles WHERE user_id = ?4))
        UNION ALL
        SELECT 1 FROM applications a
          JOIN projects p ON p.id = a.project_id
          WHERE a.id = ?5 AND (
            p.company_id IN (SELECT company_id FROM company_members WHERE user_id = ?4)
            OR a.profile_id IN (SELECT id FROM specialist_profiles WHERE user_id = ?4))
      )`,
    attachment.project_id,
    attachment.hire_request_id ?? message?.hire_request_id ?? null,
    attachment.engagement_id ?? message?.engagement_id ?? null,
    user.id,
    message?.application_id ?? null,
  );

  if (!allowed || allowed.n === 0) return new Response(null, { status: 404 });
  return getObject(bucket, key, attachment.filename);
};
