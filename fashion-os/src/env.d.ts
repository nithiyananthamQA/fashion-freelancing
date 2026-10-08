/// <reference types="astro/client" />

/**
 * Ambient types for the Cloudflare bindings and the request-scoped locals.
 *
 * This file imports, which makes it a module, so the declarations have to be
 * re-exposed through `declare global` — otherwise `Env` and `App.Locals` stay
 * local to this file and every consumer sees the un-augmented Astro types.
 *
 * `Env` is the shape the `cloudflare:workers` module resolves to at runtime;
 * it must stay in step with the bindings declared in wrangler.toml.
 */
import type { SessionUser } from './server/session';

declare global {
  /** Unique per build — see `vite.define` in astro.config.mjs. */
  const __SITE_BUILD__: string;

  interface Env {
    /** D1 — see wrangler.toml and migrations/. */
    DB: D1Database;
    /**
     * R2 — optional. Not provisioned, because R2 requires billing details on
     * the account. When absent the app offers links instead of file uploads.
     */
    MEDIA?: R2Bucket;
    SITE_URL: string;
    /** Both must be set for mail to leave the building — see src/server/mail.ts. */
    MAIL_FROM?: string;
    RESEND_API_KEY?: string;
    /**
     * "1" turns on the per-visitor demo sandboxes (src/server/tenant.ts).
     * Unset in production, which is one shared workspace.
     */
    DEMO_SANDBOX?: string;
  }

  namespace App {
    interface Locals {
      /** Signed-in account, or null. Resolved once per request in middleware. */
      user: SessionUser | null;
      /** 'public' in production; a browser's sandbox id only under DEMO_SANDBOX — see src/server/tenant.ts. */
      tenant: string;
    }
  }
}

export {};
