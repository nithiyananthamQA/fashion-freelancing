/**
 * Files on a brief, a request to hire and a hand-over (plan §6.4 item 7, §7,
 * §9 "attachments and version history").
 *
 * The `attachments` table was in the schema from the start, but nothing wrote
 * to it, so a company had nowhere to put a tech pack and a specialist had no
 * way to hand over the work itself. The bytes go to the private bucket through
 * storage.ts; this module owns the row that says who may read them. Every file
 * is served back through /api/files, which re-checks that row on each request.
 */
import { run } from '../db';
import { newId, nowIso } from '../ids';
import { checkUpload, objectKey, putObject } from '../storage';

/** One brief or one hand-over is a handful of files, not a folder sync. */
export const MAX_FILES = 5;

/** What the file input accepts — the same list storage.ts enforces. */
export const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4';

export interface Attachment {
  id: string;
  hire_request_id: string | null;
  project_id: string | null;
  engagement_id: string | null;
  message_id: string | null;
  media_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

/** The columns every listing selects, so a page cannot forget one the template reads. */
export const ATTACHMENT_COLUMNS =
  'at.id, at.hire_request_id, at.project_id, at.engagement_id, at.message_id, at.media_key, at.filename, at.content_type, at.size_bytes';

/** Where the file is read from. Never the bucket — always the checked route. */
export const fileHref = (file: Pick<Attachment, 'media_key'>): string => `/api/files/${file.media_key}`;

export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The files chosen in one input, every one checked before anything is stored.
 * A form with nothing chosen still posts one empty File, so those are dropped
 * rather than reported. All-or-nothing: one bad file rejects the lot, because
 * a brief that arrives with three of its four references is worse than one
 * that asks again.
 */
export async function pickFiles(form: FormData, name: string): Promise<{ files: File[]; problem: string | null }> {
  const files = form.getAll(name).filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_FILES) return { files: [], problem: `Attach up to ${MAX_FILES} files at a time.` };
  for (const file of files) {
    const problem = await checkUpload(file);
    if (problem) return { files: [], problem: `${cleanName(file.name)}: ${problem.message}` };
  }
  return { files, problem: null };
}

/**
 * Store checked files and record who they belong to. Call only with the
 * output of `pickFiles`, after the row they hang off has been written.
 *
 * `scan_status` is written 'clean'. There is no malware scanner yet (plan §16,
 * item 4); what has run is checkUpload — the declared type is on the allow
 * list, the magic bytes agree with it, and the size is within the limit — and
 * the allow list holds only images, PDF and MP4, none of which the browser
 * executes. Leaving the row 'pending' would hide every file from the person it
 * was sent to with nothing ever coming to release it. When a scanner exists,
 * this is the line that changes to 'pending', and /api/files already refuses
 * anything not 'clean' to everyone but the uploader and the operations team.
 */
export async function storeFiles(
  database: D1Database,
  bucket: R2Bucket,
  files: File[],
  ownerId: string,
  on: { hireRequestId?: string; projectId?: string; engagementId?: string; messageId?: string },
): Promise<void> {
  for (const file of files) {
    const key = objectKey(ownerId, 'attachment', file.type);
    await putObject(bucket, key, file);
    await run(
      database,
      `INSERT INTO attachments
         (id, owner_id, hire_request_id, project_id, engagement_id, message_id,
          media_key, filename, content_type, size_bytes, scan_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'clean', ?)`,
      newId(), ownerId,
      on.hireRequestId ?? null, on.projectId ?? null, on.engagementId ?? null, on.messageId ?? null,
      key, cleanName(file.name), file.type, file.size, nowIso(),
    );
  }
}

/**
 * The name the uploader's machine gave the file, made safe to show and to put
 * in a download header: no path, no control characters, a sane length.
 */
function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f"]/g, '').trim().slice(0, 140);
  return cleaned || 'file';
}

/**
 * Group a listing by whichever column the page hangs its cards on — one of the
 * attachment's own, or one the page joined in (the work a brief's files now
 * belong to, say).
 */
export function filesBy<T extends Attachment>(files: T[], column: keyof T) {
  const map = new Map<string, T[]>();
  for (const file of files) {
    const id = file[column];
    if (typeof id !== 'string' || !id) continue;
    const list = map.get(id) ?? [];
    list.push(file);
    map.set(id, list);
  }
  return (id: string): T[] => map.get(id) ?? [];
}
