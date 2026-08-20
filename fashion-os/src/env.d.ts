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
  interface Env {
    /** D1 — see wrangler.toml and migrations/. */
    DB: D1Database;
    /**
     * R2 — optional. Not provisioned, because R2 requires billing details on
     * the account. When absent the app offers links instead of file uploads.
     */
    MEDIA?: R2Bucket;
    SITE_URL: string;
    MAIL_FROM?: string;
    SESSION_SECRET?: string;
    RESEND_API_KEY?: string;
  }

  namespace App {
    interface Locals {
      /** Signed-in account, or null. Resolved once per request in middleware. */
      user: SessionUser | null;
      /** This browser's private workspace id — see src/server/tenant.ts. */
      tenant: string;
    }
  }
}

export {};
