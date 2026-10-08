/**
 * POST /api/leads — the direct-service enquiry endpoint.
 *
 * Every "start a project" form on the services website posts here: the homepage
 * contact form, the ten service-page forms, and the quote bot. They previously
 * wrote to `localStorage` under 'ff_leads', which meant the enquiry never left
 * the visitor's browser and nobody was ever told about it.
 *
 * Saving it is not the same as somebody reading it, so every enquiry is also
 * pushed at the people who answer them: a notification (and its email copy)
 * to every admin, and — when LEADS_TO is set — the whole enquiry mailed to the
 * team inbox with Reply-To set to the person who wrote it, so answering is one
 * click from wherever the team already reads mail.
 *
 * Returns JSON so the existing pages can keep their own success animation, and
 * degrades to a plain redirect for a no-JavaScript form post.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { waitUntil } from 'cloudflare:workers';
import { db, env, run } from '../../server/db';
import { newId, nowIso } from '../../server/ids';
import { audit, notifyAdmins } from '../../server/audit';
import { sendMail } from '../../server/mail';
import { clientKey, limited, tooManyRequests } from '../../server/rate-limit';
import { json, parse, trapped } from '../../server/validate';
import { SERVICES, getService } from '../../data/taxonomy';
import { tenantOf } from '../../server/tenant';

const SERVICE_IDS = [...SERVICES.map((s) => s.id), 'multiple'];
const SOURCES = ['contact-form', 'quote-bot'] as const;

/** Variables this route reads that env.d.ts does not declare (yet). */
type LeadEnv = Env & { LEADS_TO?: string };

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();

  // Silently accept a trapped submission: a bot told it failed simply retries.
  if (trapped(form)) return json({ ok: true });

  const database = db(ctx);
  if (await limited(database, 'apply', clientKey(ctx.request))) return tooManyRequests();

  const { f, errors } = parse(form);
  const name = f.text('name', 'Your name', { required: true, min: 2, max: 120 });
  const email = f.email('email');
  const message = f.text('message', 'Your message', { required: true, min: 5, max: 4000 });
  const company = f.text('company', 'Company', { max: 120 });
  const timeline = f.text('timeline', 'Timeline', { max: 120 });
  // Optional on every lead form ("WhatsApp / phone"); when it arrives the
  // enquiries page offers a WhatsApp reply.
  const phone = f.text('phone', 'Phone', { max: 40 });
  const service = f.choice('service', 'Service', SERVICE_IDS);
  const source = f.choice('source', 'Source', SOURCES) ?? 'contact-form';
  const page = f.text('page', 'Page', { max: 200 });

  if (Object.keys(errors).length) return json({ ok: false, errors }, 400);

  const id = newId();
  const tenant = tenantOf(ctx);
  await run(
    database,
    `INSERT INTO leads (id, name, email, company, phone, service, message, timeline, source, page, ip, tenant, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, name, email, company || null, phone || null, service, message, timeline || null, source,
    page || null,
    ctx.request.headers.get('cf-connecting-ip'),
    tenant,
    nowIso(),
  );

  /* The enquiry is saved by now. Recording and telling people about it must
     not be able to undo that: a failure here would show the visitor "That did
     not send", and they would send it again — so it is logged, and the visitor
     still hears yes. */
  try {
    await audit(database, {
      actorId: null, action: 'lead.created', entityType: 'lead', entityId: id,
      detail: { source, service }, request: ctx.request,
    });
    const serviceName = service === 'multiple'
      ? 'More than one service'
      : (service ? getService(service)?.name ?? service : 'No service chosen');
    const contact = [email, phone || null].filter(Boolean).join(' · ');
    const summary = message.length > 280 ? `${message.slice(0, 280).trimEnd()}…` : message;

    await notifyAdmins(database, {
      kind: 'lead',
      title: `New enquiry from ${name}${company ? ` (${company})` : ''} — ${serviceName}`,
      body: `${contact}${timeline ? ` · ${timeline}` : ''}\n\n${summary}`,
      link: '/workspace/admin/enquiries',
    });

    const runtime = env(ctx) as LeadEnv;
    const team = (runtime.LEADS_TO ?? '').split(',').map((a) => a.trim()).filter(Boolean);
    const site = (runtime.SITE_URL ?? '').replace(/\/+$/, '');
    for (const to of team) {
      await sendMail(database, runtime, {
        to,
        tenant,
        replyTo: email,
        subject: `New enquiry: ${name} — ${serviceName}`,
        body:
          `${name}${company ? ` from ${company}` : ''} wrote in through the ${source === 'quote-bot' ? 'quote bot' : 'contact form'}` +
          `${page ? ` on ${page}` : ''}.\n\n` +
          `Service: ${serviceName}\n` +
          `Email: ${email}\n` +
          (phone ? `Phone: ${phone}\n` : '') +
          (timeline ? `Timeline: ${timeline}\n` : '') +
          `\n${message}\n\n` +
          `Reply to this email to answer them directly. The enquiry, its notes and its status are at:\n` +
          `${site}/workspace/admin/enquiries\n`,
      }, { waitUntil });
    }
  } catch (error) {
    console.error('[leads] could not tell the team about enquiry', id, error);
  }

  // A form posted without JavaScript expects a page, not JSON.
  if ((ctx.request.headers.get('accept') ?? '').includes('text/html')) {
    return ctx.redirect('/?sent=1#contact', 303);
  }
  return json({ ok: true });
};
