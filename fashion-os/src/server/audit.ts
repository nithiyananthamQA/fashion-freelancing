/**
 * Audit history for account, moderation and payment actions (plan §13).
 * Writes are fire-and-forget from the caller's point of view but awaited
 * inside the request so a failed insert surfaces in logs rather than silently
 * losing the record.
 */
import { run } from './db';
import { newId, nowIso } from './ids';
import { tenantFromRequest } from './tenant';

export type AuditAction =
  | 'user.signed_up' | 'user.signed_in' | 'user.email_verified' | 'user.password_reset'
  | 'company.created' | 'company.member_added'
  | 'profile.created' | 'profile.submitted' | 'profile.approved'
  | 'profile.needs_changes' | 'profile.rejected' | 'profile.paused'
  | 'taxonomy.tag_proposed' | 'taxonomy.tag_approved' | 'taxonomy.tag_merged' | 'taxonomy.tag_rejected'
  | 'portfolio.moderated'
  | 'project.published' | 'project.closed'
  | 'hire_request.sent' | 'hire_request.answered'
  | 'engagement.created' | 'engagement.completed'
  | 'payment.recorded';

export async function audit(
  database: D1Database,
  entry: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string;
    detail?: unknown;
    request?: Request;
  },
): Promise<void> {
  // The workspace comes off the request cookie rather than a parameter, so no
  // call site can forget it. Rows used to be attributed by joining `users` on
  // actor_id, which put every anonymous action (actor_id NULL) into everybody's
  // activity log.
  await run(
    database,
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, ip, tenant, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    entry.actorId,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.detail === undefined ? null : JSON.stringify(entry.detail),
    entry.request?.headers.get('cf-connecting-ip') ?? null,
    tenantFromRequest(entry.request),
    nowIso(),
  );
}

/** In-product notification. Email delivery is separate — see mail.ts. */
export async function notify(
  database: D1Database,
  entry: { userId: string; kind: string; title: string; body?: string; link?: string },
): Promise<void> {
  await run(
    database,
    'INSERT INTO notifications (id, user_id, kind, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    newId(),
    entry.userId,
    entry.kind,
    entry.title,
    entry.body ?? null,
    entry.link ?? null,
    nowIso(),
  );
}
