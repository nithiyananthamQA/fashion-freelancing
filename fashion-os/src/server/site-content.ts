/**
 * Editable marketing pages.
 *
 * The pages under public-html are the design; the worker serves them as
 * templates. Every editable element carries a `data-cms` key (put there by
 * scripts/annotate-cms.mjs), and a row in `site_content` overrides that one
 * element on that one page. No row means the page's own text — so the
 * default for every field is what the page already said, and a reset is a
 * delete. History keeps each change so any of them can be put back.
 */
import type { Ctx } from './db';
import { all, db, one, run } from './db';
import { newId, nowIso } from './ids';

const TEMPLATES = import.meta.glob('/src/site-templates/**/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface SitePage { slug: string; path: string; file: string; title: string }

const SERVICE_SLUGS = ['tech-pack', '3d-virtual-sampling', 'graphics-prints', 'pattern-cad', 'dobby-jacquard',
  'website', 'ai-agent', 'ai-photography', 'ecom-listing', 'graphic-design'];

/** The names editors know the pages by — the same ones the homepage cards use. */
const PAGE_NAMES: Record<string, string> = {
  home: 'Homepage', 'tech-pack': 'Tech Pack', '3d-virtual-sampling': '3D Virtual Sampling', 'graphics-prints': 'Graphics & Prints',
  'pattern-cad': 'Pattern CAD', 'dobby-jacquard': 'Dobby & Jacquard', website: 'Website Development', 'ai-agent': 'AI Agent',
  'ai-photography': 'AI Video & Photography', 'ecom-listing': 'E-Com Listing', 'graphic-design': 'Graphic Design', about: 'About', help: 'Help & FAQ',
};
function titleOf(html: string, fallback: string): string {
  const t = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  return unescapeHtml(t.split(/ — | – | \| | - /)[0] || fallback).trim();
}
const template = (file: string): string | undefined => TEMPLATES[`/src/site-templates/${file}`];

/** Every page the editor can change, in site order. */
export function sitePages(): SitePage[] {
  const pages: SitePage[] = [
    { slug: 'home', path: '/', file: 'index.html', title: 'Homepage' },
    ...SERVICE_SLUGS.map((s) => ({ slug: s, path: `/pages/services/${s}`, file: `pages/services/${s}.html`, title: s })),
    { slug: 'about', path: '/pages/about', file: 'pages/about.html', title: 'About' },
    { slug: 'help', path: '/pages/help', file: 'pages/help.html', title: 'Help' },
  ];
  return pages.filter((p) => template(p.file)).map((p) => ({ ...p, title: PAGE_NAMES[p.slug] ?? titleOf(template(p.file)!, p.title) }));
}
export const pageBySlug = (slug: string) => sitePages().find((p) => p.slug === slug) ?? null;
export const pageByPath = (path: string) => sitePages().find((p) => p.path === path) ?? null;

// --- fields ------------------------------------------------------------------

export type Kind = 'text' | 'html' | 'image' | 'attr';
export interface Field {
  key: string; section: string; kind: Kind; tag: string;
  /** what the page says on its own */
  original: string;
  /** the editor's override, if any */
  value: string | null;
  label: string;
}
export interface Section { id: string; label: string; fields: Field[] }

const LABEL: Record<string, string> = { heading: 'Heading', text: 'Paragraph', item: 'List item', kicker: 'Kicker', chip: 'Chip', button: 'Button', caption: 'Caption', tab: 'Tab label', label: 'Form label', image: 'Image' };
const humanise = (id: string) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unescapeHtml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const attr = (attrs: string, name: string) => (attrs.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

/** Elements with a data-cms key, in document order, with their original content. */
interface Hit { key: string; tag: string; start: number; end: number; open: string; attrs: string; inner: string }
function hits(html: string): Hit[] {
  const out: Hit[] = [];
  const re = /<([a-z][a-z0-9]*)\b([^>]*?\sdata-cms="([^"]+)"[^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const open = m[0], tag = m[1] ?? '', attrs = m[2] ?? '', key = m[3] ?? '';
    if (!tag || !key) continue;
    if (tag === 'img' || tag === 'meta') { out.push({ key, tag, start: m.index, end: m.index + open.length, open, attrs, inner: '' }); continue; }
    const close = html.indexOf(`</${tag}>`, m.index + open.length);
    if (close === -1) continue;
    out.push({ key, tag, start: m.index, end: close + tag.length + 3, open, attrs, inner: html.slice(m.index + open.length, close) });
  }
  return out;
}

export function fieldsOf(page: SitePage, overrides: Map<string, { kind: Kind; value: string }>): Section[] {
  const html = template(page.file) ?? '';
  const sections = new Map<string, Section>();
  const push = (s: Section, f: Field) => { s.fields.push(f); };
  for (const h of hits(html)) {
    const dot = h.key.indexOf('.');
    const sectionId = dot === -1 ? h.key : h.key.slice(0, dot);
    const kindName = (dot === -1 ? '' : h.key.slice(dot + 1)).replace(/-\d+$/, '');
    let kind: Kind; let original: string;
    if (h.tag === 'img') { kind = 'image'; original = JSON.stringify({ src: attr(h.attrs, 'src') ?? '', alt: attr(h.attrs, 'alt') ?? '' }); }
    else if (h.tag === 'meta') { kind = 'attr'; original = unescapeHtml(attr(h.attrs, 'content') ?? ''); }
    else if (/<[a-z]/i.test(h.inner)) { kind = 'html'; original = h.inner.trim(); }
    else { kind = 'text'; original = unescapeHtml(h.inner.replace(/\s+/g, ' ').trim()); }
    const label = sectionId === 'head' ? (h.tag === 'title' ? 'Browser tab title' : 'Search description') : (LABEL[kindName] ?? humanise(kindName));
    const s = sections.get(sectionId) ?? { id: sectionId, label: sectionId === 'head' ? 'Page title & search snippet' : humanise(sectionId), fields: [] };
    push(s, { key: h.key, section: sectionId, kind, tag: h.tag, original, value: overrides.get(h.key)?.value ?? null, label });
    sections.set(sectionId, s);
  }
  // a section is named by its kicker when it has one
  // a section is named by its kicker; failing that, by its first heading
  for (const s of sections.values()) {
    if (s.id === 'head') continue;
    const kicker = s.fields.find((f) => /\.kicker-1$/.test(f.key));
    const heading = s.fields.find((f) => /\.heading-1$/.test(f.key));
    if (kicker) s.label = stripTags(kicker.value ?? kicker.original);
    else if (s.id === 'footer') s.label = 'Footer';
    else if (heading) s.label = stripTags(heading.value ?? heading.original).slice(0, 60);
    else {
      // no heading either: a call-to-action strip is best known by its button,
      // then by its opening words
      const button = s.fields.find((f) => /\.button-1$/.test(f.key));
      const text = s.fields.find((f) => /\.text-1$/.test(f.key));
      const from = button ?? text;
      s.label = from ? stripTags(from.value ?? from.original).slice(0, 48).replace(/\s+\S*$/, (m) => (from === text ? '…' : m))
        : /^sec\d+$/.test(s.id) ? s.id.replace(/^sec/, 'Section ') : humanise(s.id);
    }
  }
  return [...sections.values()];
}
const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();

// --- storage -------------------------------------------------------------------

export async function loadOverrides(ctx: Ctx, page: SitePage): Promise<Map<string, { kind: Kind; value: string }>> {
  // The page must never depend on the content table being there. If the
  // query fails — a migration not yet applied, a database hiccup — the page
  // is served as designed and the edits reappear once the table is back.
  try {
    const rows = await all<{ key: string; kind: Kind; value: string }>(db(ctx), 'SELECT key, kind, value FROM site_content WHERE page = ?', page.path);
    return new Map(rows.map((r) => [r.key, { kind: r.kind, value: r.value }]));
  } catch (error) {
    console.error('[site-content] overrides unavailable, serving the template:', error);
    return new Map();
  }
}

/** Only the inline tags a paragraph or heading on these pages actually uses. */
const ALLOWED = new Set(['b', 'strong', 'i', 'em', 'u', 'span', 'a', 'br', 'small', 'mark']);
export function cleanHtml(input: string): string {
  return input.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (m, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return '';
    if (m.startsWith('</')) return `</${t}>`;
    const keep: string[] = [];
    const cls = attr(attrs, 'class'); if (cls) keep.push(`class="${escapeHtml(cls)}"`);
    if (t === 'a') {
      const href = attr(attrs, 'href'); if (href && /^(https?:\/\/|\/|#|mailto:)/i.test(href)) keep.push(`href="${escapeHtml(href)}"`);
      const target = attr(attrs, 'target'); if (target === '_blank') keep.push('target="_blank" rel="noopener"');
    }
    return `<${t}${keep.length ? ' ' + keep.join(' ') : ''}${t === 'br' ? ' /' : ''}>`;
  });
}

/** Write one field: an empty value or one equal to the original is a reset. */
export async function saveField(ctx: Ctx, page: SitePage, field: Field, raw: string, userId: string): Promise<'saved' | 'reset' | 'unchanged'> {
  let value = raw.trim();
  if (field.kind === 'html') value = cleanHtml(value);
  if (field.kind === 'image') { try { const j = JSON.parse(value); value = JSON.stringify({ src: String(j.src ?? '').trim(), alt: String(j.alt ?? '').trim() }); } catch { return 'unchanged'; } }
  const current = field.value;
  const isReset = value === '' || value === field.original;
  if ((isReset && current === null) || (!isReset && value === current)) return 'unchanged';
  const now = nowIso();
  await run(db(ctx), 'INSERT INTO site_content_history (id, page, key, old_value, new_value, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    newId(), page.path, field.key, current, isReset ? null : value, userId, now);
  if (isReset) { await run(db(ctx), 'DELETE FROM site_content WHERE page = ? AND key = ?', page.path, field.key); return 'reset'; }
  await run(db(ctx), `INSERT INTO site_content (page, key, kind, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT(page, key) DO UPDATE SET kind = excluded.kind, value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    page.path, field.key, field.kind, value, userId, now);
  return 'saved';
}

export interface Change { id: string; key: string; old_value: string | null; new_value: string | null; changed_by_name: string | null; changed_at: string }
export const recentChanges = (ctx: Ctx, page: SitePage, limit = 12) => all<Change>(db(ctx),
  `SELECT h.id, h.key, h.old_value, h.new_value, u.name AS changed_by_name, h.changed_at
     FROM site_content_history h LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.page = ? ORDER BY h.changed_at DESC LIMIT ?`, page.path, limit);

/** Put a field back to what it was before a given change. */
export async function undoChange(ctx: Ctx, page: SitePage, changeId: string, userId: string): Promise<boolean> {
  const c = await one<Change>(db(ctx), 'SELECT id, key, old_value, new_value, changed_at FROM site_content_history WHERE id = ? AND page = ?', changeId, page.path);
  if (!c) return false;
  const now = nowIso();
  const current = await one<{ value: string }>(db(ctx), 'SELECT value FROM site_content WHERE page = ? AND key = ?', page.path, c.key);
  await run(db(ctx), 'INSERT INTO site_content_history (id, page, key, old_value, new_value, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    newId(), page.path, c.key, current?.value ?? null, c.old_value, userId, now);
  if (c.old_value === null) await run(db(ctx), 'DELETE FROM site_content WHERE page = ? AND key = ?', page.path, c.key);
  else {
    const kind: Kind = c.key.includes('.image-') ? 'image' : c.key === 'head.description' ? 'attr' : /<[a-z]/i.test(c.old_value) ? 'html' : 'text';
    await run(db(ctx), `INSERT INTO site_content (page, key, kind, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(page, key) DO UPDATE SET kind = excluded.kind, value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
      page.path, c.key, kind, c.old_value, userId, now);
  }
  return true;
}

// --- rendering -----------------------------------------------------------------

/** The page as the visitor gets it: the template with every override applied. */
export function renderPage(page: SitePage, overrides: Map<string, { kind: Kind; value: string }>): string {
  let html = template(page.file) ?? '';
  if (!overrides.size) return html;
  // apply from the end so earlier offsets stay valid
  for (const h of hits(html).reverse()) {
    const o = overrides.get(h.key); if (!o) continue;
    let replacement: string;
    if (h.tag === 'img') {
      let src = '', alt = '';
      try { const j = JSON.parse(o.value); src = j.src ?? ''; alt = j.alt ?? ''; } catch { continue; }
      // a replaced image must not be shadowed by the original's responsive candidates
      const attrs = h.attrs.replace(/\s(src|srcset|sizes|alt|width|height)="[^"]*"/g, '');
      replacement = `<img${attrs} src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
      const before = html.slice(0, h.start), after = html.slice(h.end);
      const picStart = before.lastIndexOf('<picture');
      if (picStart !== -1 && before.indexOf('</picture>', picStart) === -1) {
        const picClose = after.indexOf('</picture>');
        if (picClose !== -1) {
          const picOpenEnd = before.indexOf('>', picStart) + 1;
          html = before.slice(0, picOpenEnd) + replacement + after.slice(picClose);
          continue;
        }
      }
    } else if (h.tag === 'meta') {
      replacement = h.open.replace(/\scontent="[^"]*"/, '') .replace(/>$/, ` content="${escapeHtml(o.value)}">`);
    } else if (o.kind === 'html') {
      replacement = `${h.open}${cleanHtml(o.value)}</${h.tag}>`;
    } else {
      replacement = `${h.open}${escapeHtml(o.value)}</${h.tag}>`;
    }
    html = html.slice(0, h.start) + replacement + html.slice(h.end);
  }
  return html;
}

/** The site's own 404 page, with a 404 status. Never rewrites, so it can never loop. */
export function notFoundResponse(): Response {
  const html = (template('404.html') ?? '<!doctype html><title>Not found</title><h1>Not found</h1>')
    .replace(/\.\.\/assets\//g, '/assets/').replace(/\.\.\/index\.html/g, '/');
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}

export async function renderSitePage(ctx: Ctx, path: string): Promise<Response | null> {
  const page = pageByPath(path);
  if (!page) return null;
  const html = renderPage(page, await loadOverrides(ctx, page));
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
