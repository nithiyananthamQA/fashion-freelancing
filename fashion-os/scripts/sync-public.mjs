/**
 * sync-public.mjs
 * Copies the plain public site (../public-html) and the shared JS modules
 * (../shared) into fashion-os/public/ so a single Astro build produces the
 * whole site. Runs automatically before `astro build` (see package.json).
 *
 * Layout:
 *   public-html/index.html      -> public/index.html
 *   public-html/pages/*         -> public/pages/*
 *   public-html/assets/*        -> public/assets/*
 *   shared/*.js                 -> public/*.js  AND  public/assets/*.js
 *     (site.js loads modules from /assets/; some Astro pages load from /)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');            // fashion-os/
const project = join(root, '..');         // FashionFreelancing/
const publicHtml = join(project, 'public-html');
const shared = join(project, 'shared');
const dest = join(root, 'public');

function copyDir(from, to) {
  if (!existsSync(from)) {
    console.warn(`[sync-public] skip — not found: ${from}`);
    return;
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

console.log('[sync-public] syncing public site into fashion-os/public …');

// 0. regenerate the per-service static pages from the service.html template
//    (public-html/pages/services/*.html) so they are never stale.
try {
  execFileSync(process.execPath, [join(here, 'generate-service-pages.mjs')], { stdio: 'inherit' });
} catch (e) {
  console.warn('[sync-public] generate-service-pages failed — continuing with existing pages:', e.message);
}

// 1. homepage
if (existsSync(join(publicHtml, 'index.html'))) {
  cpSync(join(publicHtml, 'index.html'), join(dest, 'index.html'));
}

// 2. pages + assets + shared (chat widget renderer + css live in public-html/shared)
copyDir(join(publicHtml, 'pages'), join(dest, 'pages'));
copyDir(join(publicHtml, 'assets'), join(dest, 'assets'));
copyDir(join(publicHtml, 'shared'), join(dest, 'shared'));

// 2b. top-level 404 so Cloudflare Pages serves it for unknown routes.
// The source 404 lives in /pages/ and uses ../ relative paths — rewrite
// them to absolute so it works when served from the site root.
const src404 = join(publicHtml, 'pages', '404.html');
if (existsSync(src404)) {
  const html = readFileSync(src404, 'utf8')
    .replace(/\.\.\/assets\//g, '/assets/')
    .replace(/\.\.\/index\.html/g, '/')
    // ./page.html  and  ./page.html#anchor  ->  /pages/page.html[#anchor]
    .replace(/href="\.\/([a-z0-9-]+\.html(?:#[a-z0-9-]+)?)"/gi, 'href="/pages/$1"');
  writeFileSync(join(dest, '404.html'), html);
}

// 3. shared modules — to BOTH /public and /public/assets
const modules = ['schema.js', 'store.js', 'api.js', 'ui.js'];
for (const m of modules) {
  const src = join(shared, m);
  if (!existsSync(src)) {
    console.warn(`[sync-public] skip module — not found: ${src}`);
    continue;
  }
  cpSync(src, join(dest, m));
  mkdirSync(join(dest, 'assets'), { recursive: true });
  cpSync(src, join(dest, 'assets', m));
}

console.log('[sync-public] done.');
