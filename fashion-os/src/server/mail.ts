/**
 * Outbound email.
 *
 * Every message is recorded in `outbound_email` first, then sent if a provider
 * is configured. With no provider (local development, or before the API key is
 * set) the row IS the delivery: an admin can read the verification link out of
 * the operations view instead of the flow dead-ending.
 */
import { run } from './db';
import { newId, nowIso } from './ids';

export interface Mail {
  to: string;
  subject: string;
  body: string;
  /**
   * The workspace this message belongs to. Stamped on the row because an email
   * address is only unique per workspace — the operations view used to find the
   * recipient by joining on the address, which showed one visitor's
   * verification and reset links to every other visitor using the same address.
   */
  tenant: string;
}

export async function sendMail(database: D1Database, env: Env, mail: Mail): Promise<void> {
  const id = newId();
  await run(
    database,
    'INSERT INTO outbound_email (id, to_email, subject, body, status, tenant, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    mail.to,
    mail.subject,
    mail.body,
    'queued',
    mail.tenant,
    nowIso(),
  );

  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return; // queued only — see the note above

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [mail.to],
        subject: mail.subject,
        text: mail.body,
      }),
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
    await run(database, 'UPDATE outbound_email SET status = ? WHERE id = ?', 'sent', id);
  } catch (error) {
    await run(
      database,
      'UPDATE outbound_email SET status = ?, error = ? WHERE id = ?',
      'failed',
      String(error).slice(0, 500),
      id,
    );
  }
}

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
