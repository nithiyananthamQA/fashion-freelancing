/**
 * Public site images uploaded by editors. Only the `site/` prefix is served
 * without a session — portfolio pieces and attachments stay behind
 * /api/files, which re-checks who may read each one.
 */
import type { APIRoute } from 'astro';
import { env } from '../../server/db';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const key = ctx.params.key ?? '';
  const bucket = env(ctx).MEDIA;
  if (!bucket || !key.startsWith('site/') || key.includes('..')) return new Response(null, { status: 404 });
  const object = await bucket.get(key);
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // every upload gets a new key, so a URL never changes what it points at
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
};
