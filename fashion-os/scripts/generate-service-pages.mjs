/**
 * generate-service-pages.mjs
 * Generates one static HTML page per service from the service.html template:
 *
 *   public-html/pages/service.html  ->  public-html/pages/services/<slug>.html
 *
 * Each generated page gets:
 *   - the service slug baked in (no ?svc= query param needed)
 *   - a static <title> + meta description (crawlable without JS)
 *   - canonical/OG URLs without the query string
 *   - relative paths adjusted for living one directory deeper
 *
 * service.html stays the single source of truth for layout and content —
 * EDIT THE TEMPLATE, NOT THE GENERATED FILES, then re-run:
 *
 *   node scripts/generate-service-pages.mjs
 *
 * (sync-public.mjs runs this automatically before copying.)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const project = join(here, '..', '..');                 // FashionFreelancing/
const pagesDir = join(project, 'public-html', 'pages');
const outDir = join(pagesDir, 'services');

const template = readFileSync(join(pagesDir, 'service.html'), 'utf8');

/* Pull the SEO dict (slug -> {t: title, d: description}) straight out of the
   template's SEO bootstrap so titles/descriptions stay defined in ONE place. */
const seoMatch = template.match(/var SEO = (\{[\s\S]*?\});/);
if (!seoMatch) {
  console.error('[gen-services] could not find the SEO dict in service.html');
  process.exit(1);
}
const SEO = new Function('return ' + seoMatch[1])();

/* Pages with a fully custom, hand-built landing page — the generator must
   NEVER overwrite these. 'website' has its own conversion-focused redesign;
   '3d-virtual-sampling' has an interactive 3D-model landing page;
   'tech-pack' has the spec-sheet landing page. */
const CUSTOM = new Set(['website', '3d-virtual-sampling', 'tech-pack', 'seamless-pattern', 'pattern-cad', 'dobby-jacquard', 'ai-agent', 'ai-photography', 'ecom-listing', 'graphic-design']);
const slugs = Object.keys(SEO).filter((s) => !CUSTOM.has(s));

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  const { t, d } = SEO[slug];
  let html = template;

  /* 1. Bake the slug — both the head SEO bootstrap and the body renderer. */
  html = html.replace(
    "var slug = new URLSearchParams(location.search).get('svc') || '';",
    `var slug = '${slug}';`
  );
  html = html.replace(
    "const slug = new URLSearchParams(location.search).get('svc') || '';",
    `const slug = '${slug}';`
  );

  /* 2. Canonical/OG URL is now the page's own path — no query string. */
  html = html.replace(
    "var baseUrl = location.origin + location.pathname + '?svc=' + encodeURIComponent(slug);",
    'var baseUrl = location.origin + location.pathname;'
  );

  /* 3. Static title + description so crawlers see them without running JS.
        (The SEO bootstrap re-sets the same values at runtime — harmless.) */
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${t.replace(/&/g, '&amp;')} - Fashion Freelancing</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escAttr(d)}" />`
  );

  /* 4. Relative paths — generated pages live one directory deeper. */
  html = html
    .replace(/(href|src)="\.\.\/assets\//g, '$1="../../assets/')
    .replace(/href="agency\.html/g, 'href="../agency.html')
    .replace(/`agency\.html\?svc=/g, '`../agency.html?svc=');

  /* 5. Banner so nobody edits a generated file by hand. */
  html = html.replace(
    /^<!doctype html>/i,
    '<!doctype html>\n<!-- GENERATED from pages/service.html by scripts/generate-service-pages.mjs — edit the template, then re-run the script. -->'
  );

  writeFileSync(join(outDir, `${slug}.html`), html);
  console.log(`[gen-services] wrote pages/services/${slug}.html  (${t})`);
}

console.log(`[gen-services] done — ${slugs.length} pages.`);
