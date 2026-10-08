/**
 * Audit history for account, moderation and payment actions (plan §13).
 * Writes are fire-and-forget from the caller's point of view but awaited
 * inside the request so a failed insert surfaces in logs rather than silently
 * losing the record.
 *
 * Notifications live here too: the in-product row, and the email copy of it.
 */
import { env as workerEnv, waitUntil } from 'cloudflare:workers';
import { all, one, run } from './db';
import { newId, nowIso } from './ids';
import { canSendMail, notificationMessage, sendMail } from './mail';
import { tenantFromRequest } from './tenant';

export type AuditAction =
  | 'user.signed_up' | 'user.signed_in' | 'user.email_verified' | 'user.password_reset'
  | 'user.password_changed' | 'user.sessions_revoked' | 'user.verification_resent'
  | 'company.created' | 'company.member_added' | 'company.member_invited'
  | 'profile.created' | 'profile.submitted' | 'profile.approved'
  | 'profile.needs_changes' | 'profile.rejected' | 'profile.paused'
  | 'taxonomy.tag_proposed' | 'taxonomy.tag_approved' | 'taxonomy.tag_merged' | 'taxonomy.tag_rejected'
  | 'portfolio.moderated'
  | 'project.published' | 'project.closed'
  | 'hire_request.sent' | 'hire_request.answered'
  | 'engagement.created' | 'engagement.completed'
  | 'payment.recorded'
  // operations — the admin tools in src/pages/workspace/admin
  | 'user.suspended' | 'user.reactivated' | 'user.closed' | 'user.role_changed'
  | 'lead.created' | 'lead.updated' | 'lead.note_added'
  | 'project.matched'
  | 'engagement.disputed' | 'engagement.dispute_resolved' | 'engagement.closed'
  | 'payment.updated'
  | 'mail.retried';

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

/**
 * In-product notification, plus an email copy of it.
 *
 * The row is the notification; the email is a courtesy that points back at it.
 * So the email can never fail the action that triggered it — whatever goes
 * wrong is logged and the caller carries on — and it is only sent when it can
 * actually leave: without a provider, queueing a copy of every notification
 * would bury the verification and reset links in the operations view under
 * messages the person can already read in their workspace.
 *
 * Who gets one: the recipient's account must be active. A suspended or closed
 * account cannot sign in to open the link, so the email would only be noise.
 *
 * Messages are the one chatty kind. A conversation can produce ten
 * notifications in ten minutes, and ten emails for it is how an address ends
 * up in the spam folder. So for `message` and any `*_message` kind, at most ONE
 * email goes out per conversation per recipient per hour; the rest are still
 * notifications, just not emails. A conversation is recognised by its title
 * ("New message about <brief>") — the one thing every message call site
 * already puts the thread into — so a message notification must keep naming
 * its thread in the title for this to hold.
 */
export async function notify(
  database: D1Database,
  entry: { userId: string; kind: string; title: string; body?: string; link?: string },
): Promise<void> {
  const id = newId();
  await run(
    database,
    'INSERT INTO notifications (id, user_id, kind, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    entry.userId,
    entry.kind,
    entry.title,
    entry.body ?? null,
    entry.link ?? null,
    nowIso(),
  );

  try {
    await emailCopy(database, id, entry);
  } catch (error) {
    console.error('[notify] email copy failed:', error);
  }
}

const MESSAGE_EMAIL_GAP_MS = 60 * 60 * 1000;
const isChatty = (kind: string) => kind === 'message' || kind.endsWith('_message');

async function emailCopy(
  database: D1Database,
  notificationId: string,
  entry: { userId: string; kind: string; title: string; body?: string },
): Promise<void> {
  // notify() is called from pages that only hold the database, so the
  // bindings come from the module rather than a context — as in db.ts.
  const runtime = workerEnv as unknown as Env;
  if (!canSendMail(runtime)) return;

  const recipient = await one<{ email: string; name: string; status: string; tenant: string }>(
    database, 'SELECT email, name, status, tenant FROM users WHERE id = ?', entry.userId,
  );
  if (!recipient || recipient.status !== 'active') return;

  if (isChatty(entry.kind)) {
    const recent = await one<{ id: string }>(
      database,
      `SELECT id FROM outbound_email
        WHERE tenant = ? AND to_email = ? AND subject = ? AND created_at > ?
        LIMIT 1`,
      recipient.tenant, recipient.email, entry.title,
      new Date(Date.now() - MESSAGE_EMAIL_GAP_MS).toISOString(),
    );
    if (recent) return;
  }

  const site = (runtime.SITE_URL ?? '').replace(/\/+$/, '');
  await sendMail(
    database,
    runtime,
    { to: recipient.email, tenant: recipient.tenant, ...notificationMessage(site, recipient.name, notificationId, entry) },
    { waitUntil: background },
  );
}

/**
 * The provider call runs after the response. `waitUntil` from
 * cloudflare:workers is bound to the current request; called outside one (a
 * script, a test) it throws, and the send still runs — it just is not
 * guaranteed to finish, which is what the retry button is for.
 */
function background(promise: Promise<unknown>): void {
  try {
    waitUntil(promise);
  } catch {
    /* no request to extend — see above */
  }
}

/** The same notification to every active admin — leads, applications and projects that need a person. */
export async function notifyAdmins(
  database: D1Database,
  entry: { kind: string; title: string; body?: string; link?: string },
): Promise<void> {
  const admins = await all<{ id: string }>(database, "SELECT id FROM users WHERE is_admin = 1 AND status = 'active'");
  for (const admin of admins) await notify(database, { userId: admin.id, ...entry });
}
