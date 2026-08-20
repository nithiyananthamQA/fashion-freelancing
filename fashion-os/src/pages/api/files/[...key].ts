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

  // 2. Attachments are always private: the uploader, the company that owns the
  //    brief, the specialist it was sent to, or an admin.
  const attachment = await one<{
    owner_id: string; project_id: string | null; hire_request_id: string | null; engagement_id: string | null;
  }>(
    database,
    'SELECT owner_id, project_id, hire_request_id, engagement_id FROM attachments WHERE media_key = ? AND scan_status != ?',
    key,
    'blocked',
  );
  if (!attachment || !user) return new Response(null, { status: 404 });

  if (user.isAdmin || user.id === attachment.owner_id) return getObject(bucket, key);

  const allowed = await one<{ n: number }>(
    database,
    `SELECT COUNT(*) AS n FROM (
        SELECT 1 FROM projects p
          WHERE p.id = ?1 AND p.company_id IN (SELECT company_id FROM company_members WHERE user_id = ?4)
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
          WHERE a.project_id = ?1 AND a.profile_id IN (SELECT id FROM specialist_profiles WHERE user_id = ?4)
      )`,
    attachment.project_id,
    attachment.hire_request_id,
    attachment.engagement_id,
    user.id,
  );

  if (!allowed || allowed.n === 0) return new Response(null, { status: 404 });
  return getObject(bucket, key);
};
