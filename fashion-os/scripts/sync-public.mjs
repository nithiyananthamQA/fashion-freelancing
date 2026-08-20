/**
 * sync-public.mjs
 * Copies the static services website (../public-html) into fashion-os/public/
 * so one Astro build produces the whole site.
 *
 *   public-html/index.html  -> public/index.html   (served at /)
 *   public-html/pages/*     -> public/pages/*      (ten service pages, about, legal)
 *   public-html/assets/*    -> public/assets/*     (styles.css, night.css, network.css, site.js …)
 *   public-html/robots.txt  -> public/robots.txt
 *   public-html/sitemap.xml -> public/sitemap.xml
 *
 * Source of truth is public-html/. Everything this script writes into
 * fashion-os/public/ is generated — never edit it there.
 *
 * Not touched (real source, hand-maintained in fashion-os/public/):
 *   _headers, _redirects, favicon.svg
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');            // fashion-os/
const project = join(root, '..');         // FashionFreelancing/
const publicHtml = join(project, 'public-html');
const dest = join(root, 'public');

/** Directories this script owns end to end. */
const GENERATED_DIRS = ['pages', 'assets'];
const GENERATED_FILES = ['index.html', '404.html', 'robots.txt', 'sitemap.xml'];

/**
 * Sync a directory IN PLACE: copy everything over, then delete only what no
 * longer exists in the source.
 *
 * This used to `rm -rf` the destination first. That left a window — sometimes
 * hundreds of milliseconds — where public/assets did not exist. If the dev
 * server was running it lost its static files and every page rendered unstyled
 * or 500'd, which looked like a random app fault and was not. Syncing in place
 * means the directory is never absent, so running a build or a sync while the
 * dev server is up is now harmless.
 */
function syncDir(from, to) {
  if (!existsSync(from)) {
    console.warn(`[sync-public] skip — not found: ${from}`);
    return;
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, force: true });

  // prune files the source no longer has
  const walk = (dir, base = '') => {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? join(base, entry.name) : entry.name;
      if (entry.isDirectory()) out.push(...walk(join(dir, entry.name), rel));
      else out.push(rel);
    }
    return out;
  };
  const wanted = new Set(walk(from));
  for (const rel of walk(to)) {
    if (!wanted.has(rel)) rmSync(join(to, rel), { force: true });
  }
}

console.log('[sync-public] syncing the services website into fashion-os/public …');

mkdirSync(dest, { recursive: true });

// 1. homepage
if (existsSync(join(publicHtml, 'index.html'))) {
  cpSync(join(publicHtml, 'index.html'), join(dest, 'index.html'));
}

// 2. pages + assets
syncDir(join(publicHtml, 'pages'), join(dest, 'pages'));
syncDir(join(publicHtml, 'assets'), join(dest, 'assets'));

// 3. robots + sitemap
for (const file of ['robots.txt', 'sitemap.xml']) {
  const from = join(publicHtml, file);
  if (existsSync(from)) cpSync(from, join(dest, file));
}

// 4. top-level 404 so Cloudflare Pages serves it for unknown routes.
//    The source 404 lives in /pages/ and uses ../ relative paths — rewrite
//    them to absolute so it also works when served from the site root.
const src404 = join(publicHtml, 'pages', '404.html');
if (existsSync(src404)) {
  const html = readFileSync(src404, 'utf8')
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/index\.html/g, '/')
    // ./page.html and ./page.html#anchor -> /pages/page.html[#anchor]
    .replace(/href="\.\/([a-z0-9-]+\.html(?:#[a-z0-9-]+)?)"/gi, 'href="/pages/$1"');
  writeFileSync(join(dest, '404.html'), html);
}

console.log('[sync-public] done.');
