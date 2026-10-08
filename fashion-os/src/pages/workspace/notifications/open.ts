/**
 * GET /workspace/notifications/open?id=… — mark one notification read, then go
 * where it points.
 *
 * Every notification link, in the list and in the email copy, goes through
 * here, so reading one anywhere clears it everywhere. It is the one GET in the
 * workspace that writes — an email can only carry a link, not a form — and
 * the most it can change is the reader's own read marker: the row is looked up
 * by id AND the signed-in account, so a forged link does nothing to anybody
 * else's.
 *
 * The stored link is only followed when it is a path on this site. Links are
 * written by our own code today, but the redirect must not be the place that
 * finds out if one ever is not.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db, one, run } from '../../../server/db';
import { guard, requireUser, safeNext } from '../../../server/guards';
import { nowIso } from '../../../server/ids';

const LIST = '/workspace/notifications';

export const GET: APIRoute = async (ctx) => {
  // Signed out (an email link opened in a fresh browser): sign in, then come
  // straight back here with the same id.
  const gate = await guard(ctx, () => requireUser(ctx));
  if (gate.response) return gate.response;
  const user = gate.value;

  const database = db(ctx);
  const notification = await one<{ id: string; link: string | null; read_at: string | null }>(
    database,
    'SELECT id, link, read_at FROM notifications WHERE id = ? AND user_id = ?',
    ctx.url.searchParams.get('id') ?? '',
    user.id,
  );
  if (!notification) return ctx.redirect(LIST, 303);

  if (!notification.read_at) {
    await run(database, 'UPDATE notifications SET read_at = ? WHERE id = ?', nowIso(), notification.id);
  }
  return ctx.redirect(safeNext(notification.link, LIST), 303);
};
