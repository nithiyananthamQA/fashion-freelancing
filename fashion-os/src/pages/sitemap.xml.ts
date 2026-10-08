/**
 * /sitemap.xml — written per request so every approved specialist profile is
 * listed the day it is approved, not the next time somebody edits a file.
 *
 * Absolute <loc> values: the sitemap spec requires them and Google rejects
 * relative ones. Every URL here answers 200 directly — no .html forms, no
 * redirects. Signed-in routes, projects and the application form are left out:
 * they are noindex, and listing a noindex page only earns a Search Console
 * warning.
 */
import type { APIRoute } from 'astro';
import { all, db } from '../server/db';
import { sitePages } from '../server/site-content';
import { PUBLIC_TENANT } from '../server/tenant';

export const prerender = false;

const SITE = 'https://fashionfreelancing.com';

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async (ctx) => {
  const urls: { loc: string; lastmod?: string; priority: string }[] = [];
  for (const page of sitePages()) {
    urls.push({ loc: SITE + page.path, priority: page.path === '/' ? '1.0' : page.path.startsWith('/pages/services/') ? '0.8' : '0.6' });
  }
  urls.push({ loc: `${SITE}/pages/cookies`, priority: '0.2' });
  urls.push({ loc: `${SITE}/specialists`, priority: '0.7' });

  // A missing table or a database hiccup still serves the marketing pages.
  try {
    const profiles = await all<{ handle: string; updated_at: string }>(db(ctx),
      `SELECT p.handle, p.updated_at FROM specialist_profiles p JOIN users u ON u.id = p.user_id
        WHERE p.status = 'approved' AND u.status = 'active' AND p.handle IS NOT NULL AND u.tenant = ?
        ORDER BY p.updated_at DESC LIMIT 5000`, PUBLIC_TENANT);
    for (const p of profiles) urls.push({ loc: `${SITE}/specialists/${encodeURIComponent(p.handle)}`, lastmod: p.updated_at.slice(0, 10), priority: '0.5' });
  } catch (error) {
    console.error('[sitemap] profiles unavailable:', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
