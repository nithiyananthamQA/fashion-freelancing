// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

/**
 * The services website (homepage, ten service pages, about/help/legal) is a set
 * of static files synced into public/ by scripts/sync-public.mjs — it is served
 * straight from the CDN and never touches the worker.
 *
 * The specialist network is server-rendered. Each of those routes opts in with
 * `export const prerender = false`, so marketing performance is unaffected.
 */
export default defineConfig({
  output: 'static',
  /**
   * Astro's own session store is switched off. It would otherwise make the
   * Cloudflare adapter demand a KV namespace we never use — our sign-in
   * sessions live in D1 (see src/server/session.ts). One less binding to
   * provision, and the session runtime is dropped from the bundle.
   */
  session: false,
  /**
   * Reject cross-site form posts to every server-rendered route. Astro's
   * default today, pinned here so an upgrade can never quietly turn off the
   * only CSRF defence the forms rely on (with SameSite=Lax cookies).
   */
  security: { checkOrigin: true },
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  site: 'https://fashionfreelancing.com',
  trailingSlash: 'ignore',
  server: { host: true, port: 4321 },
  vite: {
    build: { sourcemap: false },
    /** Part of the edge-cache key for rendered marketing pages (src/server/site-content.ts):
        every deploy starts from an empty cache, so no page outlives its templates. */
    define: { __SITE_BUILD__: JSON.stringify(Date.now().toString(36)) },
    /**
     * `astro/assets/services/noop` is discovered lazily on the first request,
     * which makes Vite re-optimize and reload mid-boot. Excluding it stops the
     * most common instance of the deps_ssr race described in README.
     * The general protection is that `npm run dev` starts from a clean
     * optimizer cache — see the note there.
     */
    optimizeDeps: { exclude: ['astro/assets/services/noop'] },
    /**
     * Stop Vite discovering new SSR dependencies mid-session.
     *
     * The Cloudflare adapter runs the app in workerd, which holds module URLs
     * from `.vite/deps_ssr`. When Vite discovers a dependency on a later
     * request it re-optimizes, rewrites those files under new hashes, and the
     * running worker then 500s on every subsequent request with
     * "The file does not exist at .../deps_ssr/<name>.js?v=<hash>".
     *
     * Pre-bundling everything at startup removes the mid-session rewrite.
     * Dev only — `astro build` never uses the optimizer.
     */
    ssr: { optimizeDeps: { noDiscovery: true } },
  },
});
