/**
 * POST /api/leads — the direct-service enquiry endpoint.
 *
 * Every "start a project" form on the services website posts here: the homepage
 * contact form, the ten service-page forms, and the quote bot. They previously
 * wrote to `localStorage` under 'ff_leads', which meant the enquiry never left
 * the visitor's browser and nobody was ever told about it.
 *
 * Returns JSON so the existing pages can keep their own success animation, and
 * degrades to a plain redirect for a no-JavaScript form post.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { db, run } from '../../server/db';
import { newId, nowIso } from '../../server/ids';
import { audit } from '../../server/audit';
import { clientKey, limited, tooManyRequests } from '../../server/rate-limit';
import { HONEYPOT, json, parse, trapped } from '../../server/validate';
import { SERVICES } from '../../data/taxonomy';

const SERVICE_IDS = [...SERVICES.map((s) => s.id), 'multiple'];
const SOURCES = ['contact-form', 'quote-bot'] as const;

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
  const service = f.choice('service', 'Service', SERVICE_IDS);
  const source = f.choice('source', 'Source', SOURCES) ?? 'contact-form';

  if (Object.keys(errors).length) return json({ ok: false, errors }, 400);

  const id = newId();
  await run(
    database,
    `INSERT INTO leads (id, name, email, company, service, message, timeline, source, page, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, name, email, company || null, service, message, timeline || null, source,
    f.text('page', 'Page', { max: 200 }) || null,
    ctx.request.headers.get('cf-connecting-ip'),
    nowIso(),
  );
  await audit(database, {
    actorId: null, action: 'user.signed_up', entityType: 'lead', entityId: id,
    detail: { source, service }, request: ctx.request,
  });

  // A form posted without JavaScript expects a page, not JSON.
  if ((ctx.request.headers.get('accept') ?? '').includes('text/html')) {
    return ctx.redirect('/?sent=1#contact', 303);
  }
  return json({ ok: true });
};
