/**
 * Outbound email.
 *
 * Every message is recorded in `outbound_email` first, then sent through
 * Cloudflare Email Service — the `EMAIL` send_email binding in wrangler.toml,
 * on the same account as the site, so there is no outside provider or API key.
 * Until MAIL_FROM is set (after the domain is onboarded for sending) the row
 * IS the delivery: an admin can read the verification link out of
 * the operations view instead of the flow dead-ending.
 *
 * Sending never holds a page up for long. A caller that can hand over its
 * `waitUntil` gets the provider call moved after the response; one that cannot
 * still waits, but only for SEND_TIMEOUT_MS — a provider having a bad minute
 * must not turn "sign up" into a spinner. Whatever does not get through stays
 * in the table as 'queued' or 'failed', and `retryQueuedMail` picks it up.
 */
import { all, run } from './db';
import { newId, nowIso } from './ids';

export interface Mail {
  to: string;
  subject: string;
  /** Plain text. The HTML part is generated from it, so the two never disagree. */
  body: string;
  /**
   * The workspace this message belongs to. Stamped on the row because an email
   * address is only unique per workspace — the operations view used to find the
   * recipient by joining on the address, which showed one visitor's
   * verification and reset links to every other visitor using the same address.
   */
  tenant: string;
  /**
   * Where a reply should go, when that is not the site's own reply address —
   * an enquiry forwarded to the team is answered straight back to whoever wrote
   * it. Falls back to MAIL_REPLY_TO, then to the From address.
   */
  replyTo?: string | null;
}

export interface SendOptions {
  /**
   * The request's waitUntil. When given, the provider call runs after the
   * response has gone; the row is still written before this returns, so the
   * message is never lost if the worker is stopped part-way.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/** Long enough for a healthy provider, short enough that a sick one cannot stall a page. */
const SEND_TIMEOUT_MS = 5_000;

/**
 * How many times one message is tried before the retry button leaves it alone.
 * An address that has bounced five times is not going to start working, and
 * the provider counts every attempt against the sending reputation.
 */
export const MAX_SEND_ATTEMPTS = 5;

/**
 * Only messages this recent are retried. Older ones are about something that
 * has moved on — a verification link lasts a day, a reset link an hour, and a
 * notification three days late has already been read in the workspace.
 */
export const RETRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const BRAND = 'Fashion Freelancing';

/** Variables this module reads that env.d.ts does not declare (yet). */
type MailEnv = Env & { MAIL_REPLY_TO?: string };

/** Whether anything will actually leave the building. Without both, every message stops at 'queued'. */
export const canSendMail = (env: Env): boolean => Boolean(env.EMAIL && env.MAIL_FROM);

/** "Fashion Freelancing <no-reply@…>" or a bare address, as Email Service wants it. */
function sender(from: string): string | EmailAddress {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const name = m?.[1]?.replace(/^"|"$/g, '');
  return m ? (name ? { email: m[2]!.trim(), name } : m[2]!.trim()) : from.trim();
}

export async function sendMail(
  database: D1Database,
  env: Env,
  mail: Mail,
  options: SendOptions = {},
): Promise<void> {
  const id = newId();
  await run(
    database,
    `INSERT INTO outbound_email (id, to_email, subject, body, status, reply_to, attempts, tenant, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?, 0, ?, ?)`,
    id,
    mail.to,
    mail.subject,
    mail.body,
    mail.replyTo ?? null,
    mail.tenant,
    nowIso(),
  );

  if (!canSendMail(env)) return; // queued only — see the note above

  const sending = attempt(database, env, { id, to: mail.to, subject: mail.subject, body: mail.body, replyTo: mail.replyTo ?? null });
  if (options.waitUntil) options.waitUntil(sending);
  else await sending;
}

/**
 * Send again whatever is still waiting: queued while no provider was set, or
 * failed on the way out. Newest first, because the newest are the ones somebody
 * is still waiting on.
 *
 * One at a time, on purpose. The provider rate-limits per second, and a retry
 * run is exactly the burst that trips it — so a rate-limit error ends the run early and
 * leaves the rest for the next press rather than failing all of them.
 *
 * `tenant` scopes the run the way the operations page is scoped: this
 * workspace plus the shared one.
 */
export async function retryQueuedMail(
  database: D1Database,
  env: Env,
  limit = 20,
  tenant?: string,
): Promise<{ configured: boolean; sent: number; failed: number }> {
  if (!canSendMail(env)) return { configured: false, sent: 0, failed: 0 };

  /* A message written in the last half-minute may still be on its way out
     after its own response (it reads 'queued' until the provider answers), so
     it is left to that attempt rather than sent twice. */
  const now = Date.now();
  const params: unknown[] = [
    MAX_SEND_ATTEMPTS,
    new Date(now - RETRY_WINDOW_MS).toISOString(),
    new Date(now - 30_000).toISOString(),
  ];
  if (tenant) params.push(tenant);
  params.push(Math.max(1, Math.min(limit, 50)));

  const rows = await all<{ id: string; to_email: string; subject: string; body: string; reply_to: string | null; attempts: number }>(
    database,
    `SELECT id, to_email, subject, body, reply_to, attempts
       FROM outbound_email
      WHERE status IN ('queued', 'failed') AND attempts < ? AND created_at > ? AND created_at < ?
        ${tenant ? "AND tenant IN (?, 'public')" : ''}
      ORDER BY created_at DESC
      LIMIT ?`,
    ...params,
  );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    // Claim the row before sending: two overlapping retry runs (a double
    // click, two admins) would otherwise both pick it and send it twice.
    const claim = await run(
      database,
      "UPDATE outbound_email SET attempts = attempts + 1 WHERE id = ? AND attempts = ? AND status IN ('queued', 'failed')",
      row.id, row.attempts,
    );
    if (claim.meta.changes !== 1) continue;
    const error = await attempt(database, env, {
      id: row.id, to: row.to_email, subject: row.subject, body: row.body, replyTo: row.reply_to,
    }, { counted: true });
    if (error === null) sent++;
    else {
      failed++;
      if (error.startsWith('E_RATE_LIMIT')) break;
    }
  }
  return { configured: true, sent, failed };
}

/**
 * One delivery attempt, recorded on the row either way. Never throws: it is
 * often running after the response has gone, where an exception has nobody
 * to report to. Returns the error, or null when the provider accepted it.
 */
async function attempt(
  database: D1Database,
  env: Env,
  mail: { id: string; to: string; subject: string; body: string; replyTo: string | null },
  { counted = false }: { counted?: boolean } = {},
): Promise<string | null> {
  let error: string | null = null;
  try {
    const replyTo = mail.replyTo || (env as MailEnv).MAIL_REPLY_TO || undefined;
    const sending = env.EMAIL!.send({
      from: sender(env.MAIL_FROM!),
      to: mail.to,
      subject: mail.subject,
      text: mail.body,
      html: renderHtml(mail.subject, mail.body),
      ...(replyTo ? { replyTo } : {}),
    });
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), SEND_TIMEOUT_MS));
    await Promise.race([sending, timeout]);
  } catch (caught) {
    // Email Service errors carry a code (E_RATE_LIMIT_EXCEEDED, E_SENDER_NOT_VERIFIED, …)
    const code = (caught as { code?: string }).code;
    error = `${code ? `${code} ` : ''}${String((caught as Error)?.message ?? caught)}`.slice(0, 500);
  }

  try {
    await run(
      database,
      'UPDATE outbound_email SET status = ?, error = ?, attempts = attempts + ? WHERE id = ?',
      error === null ? 'sent' : 'failed',
      error,
      counted ? 0 : 1,  // a retry already counted this attempt when it claimed the row
      mail.id,
    );
  } catch (caught) {
    console.error('[mail] could not record the delivery attempt:', caught);
  }
  return error;
}

// --- the HTML part ------------------------------------------------------------
// Built from the plain text rather than written separately, so no message can
// say one thing in HTML and another in text. Deliberately plain: one column,
// inline styles only (mail clients strip <style>), the brand name as the only
// decoration, and every link visible as the address it goes to.

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* Works on the raw text and escapes every piece itself: matching URLs after
   escaping would swallow an `&quot;` that closes a quoted link. A URL never
   contains a quote or an angle bracket here, so once escaped it is safe in the
   attribute; trailing punctuation belongs to the sentence, not the link. */
const URL_IN_TEXT = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g;

function linkify(text: string): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const url = escapeHtml(match[0]);
    out += escapeHtml(text.slice(last, match.index)) +
      `<a href="${url}" style="color:#7c3aed;word-break:break-all;">${url}</a>`;
    last = match.index + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

function renderHtml(subject: string, text: string): string {
  const paragraphs = text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;">${linkify(block).replace(/\n/g, '<br>')}</p>`)
    .join('');

  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(subject)}</title></head>` +
    '<body style="margin:0;padding:0;background:#f4f2f7;">' +
    '<div style="max-width:560px;margin:0 auto;padding:32px 20px;' +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;" +
    'font-size:15px;line-height:1.6;color:#1d1b22;">' +
    `<p style="margin:0 0 20px;font-size:16px;font-weight:700;letter-spacing:-0.01em;">${BRAND}</p>` +
    `<div style="background:#ffffff;border:1px solid #e4e0ea;border-radius:12px;padding:24px 24px 8px;">${paragraphs}</div>` +
    `<p style="margin:20px 0 0;font-size:12.5px;color:#6b6676;">${BRAND} — fashion services, and a curated network of independent specialists.</p>` +
    '</div></body></html>'
  );
}

// --- messages -----------------------------------------------------------------

export const verifyEmailMessage = (siteUrl: string, name: string, token: string): Omit<Mail, 'to' | 'tenant'> => ({
  subject: 'Confirm your email — Fashion Freelancing',
  body:
    `Hi ${name},\n\n` +
    `Confirm your email address to finish setting up your Fashion Freelancing account:\n\n` +
    `${siteUrl}/sign-in/verify?token=${token}\n\n` +
    `This link expires in 24 hours. If you did not create an account, ignore this message.\n`,
});

export const resetPasswordMessage = (siteUrl: string, name: string, token: string): Omit<Mail, 'to' | 'tenant'> => ({
  subject: 'Reset your password — Fashion Freelancing',
  body:
    `Hi ${name},\n\n` +
    `Use this link to choose a new password:\n\n` +
    `${siteUrl}/sign-in/reset?token=${token}\n\n` +
    `The link expires in one hour. If you did not ask for this, nothing has changed.\n`,
});

/**
 * The email copy of an in-product notification. The link goes through
 * /workspace/notifications/open, so following it from the inbox marks the
 * notification read exactly as clicking it in the workspace does.
 */
export const notificationMessage = (
  siteUrl: string,
  name: string,
  notificationId: string,
  entry: { title: string; body?: string },
): Omit<Mail, 'to' | 'tenant'> => ({
  subject: entry.title,
  body:
    `Hi ${name},\n\n` +
    `${entry.title}\n\n` +
    (entry.body ? `${entry.body}\n\n` : '') +
    `Open it in your workspace:\n${siteUrl}/workspace/notifications/open?id=${notificationId}\n\n` +
    `You are getting this because you have an account on Fashion Freelancing. ` +
    `Everything here is also in the notifications list in your workspace.\n`,
});
