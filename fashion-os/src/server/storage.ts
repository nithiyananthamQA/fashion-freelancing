/**
 * Portfolio and attachment storage in R2 (plan §11, §13).
 *
 * Nothing here is public. Objects are written under an owner-scoped key and
 * read back only through /api/files/[...key], which re-checks authorization on
 * every request. There is no bucket-level public access and no signed URL that
 * outlives a session.
 */
import { newId } from './ids';

/** Types a portfolio item or project attachment may use. */
export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export interface UploadProblem {
  message: string;
}

/**
 * Validate before touching the bucket. The declared content type is checked
 * against the file's magic bytes, because a browser will happily label a
 * script `image/png`.
 */
export async function checkUpload(file: File): Promise<UploadProblem | null> {
  if (file.size === 0) return { message: 'That file is empty.' };
  if (file.size > MAX_UPLOAD_BYTES) return { message: 'Files must be 25 MB or smaller.' };
  if (!ALLOWED_TYPES[file.type]) {
    return { message: 'Use a JPG, PNG, WebP, AVIF, PDF or MP4 file.' };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!magicMatches(file.type, head)) {
    return { message: 'That file does not match its type. Re-export it and try again.' };
  }
  return null;
}

function magicMatches(contentType: string, head: Uint8Array): boolean {
  const startsWith = (...bytes: number[]): boolean => bytes.every((b, i) => head[i] === b);
  switch (contentType) {
    case 'image/jpeg': return startsWith(0xff, 0xd8, 0xff);
    case 'image/png':  return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case 'application/pdf': return startsWith(0x25, 0x50, 0x44, 0x46);
    // RIFF....WEBP
    case 'image/webp': return startsWith(0x52, 0x49, 0x46, 0x46) &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    // ISO base media: ....ftyp — covers both AVIF and MP4
    case 'image/avif':
    case 'video/mp4':
      return head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70;
    default: return false;
  }
}

export function objectKey(ownerId: string, kind: 'portfolio' | 'attachment', contentType: string): string {
  return `${kind}/${ownerId}/${newId()}.${ALLOWED_TYPES[contentType] ?? 'bin'}`;
}

export async function putObject(bucket: R2Bucket, key: string, file: File): Promise<void> {
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'private, max-age=0, must-revalidate' },
  });
}

export async function getObject(bucket: R2Bucket, key: string): Promise<Response> {
  const object = await bucket.get(key);
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Private by default: never let a CDN or shared cache keep a brief or a
  // portfolio file that only one authorized account was allowed to read.
  headers.set('cache-control', 'private, max-age=0, must-revalidate');
  headers.set('content-disposition', 'inline');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}

export const deleteObject = (bucket: R2Bucket, key: string): Promise<void> => bucket.delete(key);
