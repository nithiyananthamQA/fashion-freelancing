/**
 * POST /api/site-media — an editor replaces an image on a marketing page.
 * The file is checked the same way portfolio uploads are (type sniffed, 25 MB
 * cap) and stored under `site/…`, the one prefix /media serves publicly.
 */
import type { APIRoute } from 'astro';
import { env } from '../../server/db';
import { GuardRedirect, requireEditor } from '../../server/guards';
import { ALLOWED_TYPES, checkUpload, putObject } from '../../server/storage';
import { newId } from '../../server/ids';
import { json } from '../../server/validate';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let user;
  try { user = requireEditor(ctx); } catch (e) { if (e instanceof GuardRedirect) return e.response; throw e; }
  const bucket = env(ctx).MEDIA;
  if (!bucket) return json({ ok: false, error: 'Uploads are not enabled on this site.' }, 503);
  const form = await ctx.request.formData();
  const file = form.get('file');
  const slug = String(form.get('page') ?? '').replace(/[^a-z0-9-]/g, '');
  const fieldKey = String(form.get('key') ?? '').replace(/[^a-z0-9.-]/g, '');
  if (!(file instanceof File) || !slug || !fieldKey) return json({ ok: false, error: 'Choose an image first.' }, 400);
  if (!file.type.startsWith('image/')) return json({ ok: false, error: 'Only images can go here.' }, 400);
  const problem = await checkUpload(file);
  if (problem) return json({ ok: false, error: problem.message }, 400);
  const key = `site/${slug}/${fieldKey}-${newId()}.${ALLOWED_TYPES[file.type] ?? 'bin'}`;
  await putObject(bucket, key, file);
  return json({ ok: true, url: `/media/${key}`, by: user.id });
};
