/**
 * Tag every editable element on the marketing pages with a stable `data-cms`
 * key, so the worker can fill it from the database and the editor can list it.
 *
 * Keys are `<section>.<kind>-<n>`: the section is the <section id>, else its
 * kicker, else its aria-label; the kind is heading / text / item / kicker /
 * chip / button / caption / tab / label / image; n counts within the section
 * in reading order. <title> and the meta description are `head.title` and
 * `head.description`. Existing keys are kept, so re-running never renumbers.
 *
 *   node scripts/annotate-cms.mjs        # tags the sources in public-html
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public-html');
const PAGES = ['index.html', 'pages/about.html', 'pages/help.html',
  ...['3d-virtual-sampling','ai-agent','ai-photography','dobby-jacquard','ecom-listing','graphic-design',
      'graphics-prints','pattern-cad','tech-pack','website'].map((s) => `pages/services/${s}.html`)];

const slug = (s) => s.toLowerCase().replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const KIND = { h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', p: 'text', li: 'item', figcaption: 'caption', dt: 'heading', dd: 'text' };
const SPAN_KINDS = [['kicker', 'kicker'], ['dp-h', 'tab'], ['fl', 'label'], ['proof-lead', 'text']];

function annotate(html) {
  const used = new Set([...html.matchAll(/data-cms="([^"]+)"/g)].map((m) => m[1]));
  const sectionNames = new Set();
  const count = {};
  let tagged = 0;
  const key = (section, kind) => {
    count[section] ??= {};
    let n = (count[section][kind] ?? 0) + 1;
    while (used.has(`${section}.${kind}-${n}`)) n++;
    count[section][kind] = n;
    const k = `${section}.${kind}-${n}`; used.add(k); tagged++; return k;
  };

  // head: title + description
  if (!/<title[^>]*data-cms/.test(html)) html = html.replace(/<title\b/, () => { tagged++; return '<title data-cms="head.title"'; });
  if (!/<meta name="description"[^>]*data-cms/.test(html)) html = html.replace(/<meta name="description"/, () => { tagged++; return '<meta name="description" data-cms="head.description"'; });

  // body: every top-level <section> plus the footer
  html = html.replace(/<(section|footer)\b([^>]*)>([\s\S]*?)<\/\1>/g, (whole, tag, attrs, inner) => {
    if (tag === 'section' && /<section\b/.test(inner)) return whole; // nested: leave alone
    let name = (attrs.match(/\bid="([^"]+)"/) || [])[1]
      || slug(strip((inner.match(/class="kicker[^"]*"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || ''))
      || slug((attrs.match(/aria-label="([^"]+)"/) || [])[1] || '')
      || (tag === 'footer' ? 'footer' : '');
    if (!name) name = `sec${sectionNames.size + 1}`;
    const base = name; let i = 2; while (sectionNames.has(name)) name = `${base}-${i++}`;
    sectionNames.add(name);

    // script/style/svg/template/nav are never tagged: lift them out, put them back after
    const holes = [];
    inner = inner.replace(/<(script|style|svg|template|nav)\b[\s\S]*?<\/\1>/g, (m) => { holes.push(m); return `@@HOLE${holes.length - 1}@@`; });

    inner = inner.replace(/<(h[1-5]|p|li|figcaption|dt|dd)\b([^>]*)>([\s\S]*?)<\/\1>/g, (m, t, a, body) => {
      if (/data-cms=/.test(a)) return m;
      if (t === 'li' && /<(p|h[1-5])\b/.test(body)) return m;   // its children carry the keys
      if (!strip(body)) return m;
      return `<${t}${a} data-cms="${key(name, KIND[t])}">${body}</${t}>`;
    });
    inner = inner.replace(/<span\b([^>]*class="([^"]*)"[^>]*)>([^<]+)<\/span>/g, (m, a, cls, body) => {
      if (/data-cms=/.test(a) || !strip(body)) return m;
      const hit = SPAN_KINDS.find(([c]) => cls.split(/\s+/).includes(c));
      return hit ? `<span${a} data-cms="${key(name, hit[1])}">${body}</span>` : m;
    });
    inner = inner.replace(/(<div class="chips[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/g, (m, open, body, close) =>
      open + body.replace(/<span(?![^>]*data-cms)([^>]*)>([^<]+)<\/span>/g, (mm, a, b) => `<span${a} data-cms="${key(name, 'chip')}">${b}</span>`) + close);
    inner = inner.replace(/<(a|button)\b([^>]*class="[^"]*btn[^"]*"[^>]*)>([^<]+)<\/\1>/g, (m, t, a, body) => {
      if (/data-cms=/.test(a) || !strip(body)) return m;
      return `<${t}${a} data-cms="${key(name, 'button')}">${body}</${t}>`;
    });
    inner = inner.replace(/<img\b([^>]*)>/g, (m, a) => (/data-cms=/.test(a) ? m : `<img${a} data-cms="${key(name, 'image')}">`));

    inner = inner.replace(/@@HOLE(\d+)@@/g, (_, n) => holes[+n]);
    return `<${tag}${attrs}>${inner}</${tag}>`;
  });
  return { html, tagged };
}

let total = 0;
for (const rel of PAGES) {
  const file = join(root, rel);
  const before = readFileSync(file, 'utf8');
  const { html, tagged } = annotate(before);
  if (html !== before) writeFileSync(file, html);
  const keys = [...html.matchAll(/data-cms="([^"]+)"/g)].map((m) => m[1]);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  console.log(`  ${rel.padEnd(44)} +${String(tagged).padStart(3)}  total ${String(keys.length).padStart(3)}  sections ${new Set(keys.map((k) => k.split('.')[0])).size}${dup.length ? '  DUPLICATES: ' + [...new Set(dup)].join(',') : ''}`);
  total += keys.length;
}
console.log(`  editable fields across the site: ${total}`);
