# Deploying to Cloudflare Workers

> **Current hosting (since 2026-09-09):** the site runs in the Cloudflare account
> `Freelancingfashion@gmail.com` (id `d798bbc8cbee648ce1697e580547335a`) and
> deploys automatically from GitHub through Workers Builds — every push to
> `main` builds `fashion-os` and deploys. D1 `fashion_os` was migrated there
> with all data; R2 `fashion-os-media` is enabled, so uploads are on.
> `SITE_URL` points at the workers.dev URL until the custom domain is connected.
> The old account's worker has been deleted; its D1 database is kept for a while as a backup.

The site is one Cloudflare **Worker** serving two things from one origin:

- the **services website**, static files straight from the CDN
- the **specialist network**, server-rendered by the worker, backed by
  D1 (database) and R2 (portfolio and attachment storage)

> @astrojs/cloudflare v14 builds a Worker with static assets, **not** a Pages
> project. Cloudflare Pages rejects it: *the name 'ASSETS' is reserved in Pages
> projects*. Deploy with `npm run deploy`, which runs
> `wrangler deploy --config dist/server/wrangler.json`.

One build produces both.

## How the build fits together

```
FashionFreelancing/                 ← git repo root
├── public-html/                    ← the static services site (source of truth)
└── fashion-os/                     ← the Astro app + the build
    ├── scripts/sync-public.mjs         copies public-html/ into public/
    ├── migrations/                     D1 schema + generated taxonomy seed
    ├── public/_headers                 caching + security headers
    ├── public/_redirects               clean URLs + legacy retirement map
    └── dist/                       ← BUILD OUTPUT (what Cloudflare serves)
```

`npm run build` runs `sync-public.mjs` (pulling the services site into
`fashion-os/public/`), then `astro build`.

`dist/`, `node_modules/` and the synced copies under `fashion-os/public/` are
git-ignored — Cloudflare regenerates them on every build.

## One-time infrastructure

Create the two bindings before the first deploy, then put the real ids into
`fashion-os/wrangler.toml`.

```bash
cd fashion-os

# 1. Database — copy the printed database_id into wrangler.toml,
#    replacing REPLACE_WITH_D1_DATABASE_ID
npx wrangler d1 create fashion_os

# 2. Object storage for portfolio evidence and project attachments
npx wrangler r2 bucket create fashion-os-media

# 3. Apply the schema and seed the taxonomy
npm run db:migrate
```

The bucket must stay **private**. Files are only ever read back through
`/api/files/[...key]`, which re-checks authorization per request.

## Secrets

```bash
npx wrangler secret put RESEND_API_KEY    # optional, enables real email — or set it in the dashboard
```

And set `MAIL_FROM` (e.g. `no-reply@fashionfreelancing.com`) as a Worker
variable in the dashboard, alongside `SITE_URL`.

Without a mail provider the app still works: verification and reset messages are
recorded in the `outbound_email` table and shown in `/workspace/admin`, so no
flow dead-ends. Set both variables before real sign-ups.

## Deploys: Workers Builds (GitHub)

The worker is connected to `nithiyananthamQA/fashion-freelancing`. Every push
to `main` builds and deploys. Project settings, should they ever need
re-entering:

| Setting | Value |
|---|---|
| **Root directory** | `fashion-os` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler d1 migrations apply fashion_os --remote && npx wrangler deploy --config dist/server/wrangler.json` |
| **Build variable** | `NODE_VERSION` = `22` |
| **Non-production branch builds** | off |

> The **root directory must be `fashion-os`** — the build runs there, and
> `sync-public.mjs` reaches up to `../public-html`.

`npm run deploy` from a laptop is no longer the path: it needs an API token
for the hosting account in `CLOUDFLARE_API_TOKEN`, and without one wrangler
falls back to whatever account is logged in locally.

## Editable site content

Every heading, paragraph, chip, button, image, page title and search
description on the marketing pages (home, the ten service pages, about, help)
is editable from the dashboard at `/workspace/content`.

- **How it works.** `public-html` stays the design. `scripts/annotate-cms.mjs`
  tags every editable element with a stable `data-cms` key (already done —
  re-run it after adding a new page or section; existing keys never change).
  The build copies those pages to `src/site-templates/` and the worker renders
  them, filling each key from `site_content`. No row = the page's own text, so
  a reset is a delete. `site_content_history` keeps every change for undo.
- **Who.** Admins, and accounts with `role = 'editor'`, which opens
  `/workspace/content` and nothing else. Grant or remove it on
  *Workspace → People → "Make content editor"*, or from a terminal:
  `node scripts/make-editor.mjs someone@brand.com "Their Name" --remote`
  (creates the account and prints a one-time password).
- **Images** upload to R2 under `site/…` and are served publicly from
  `/media/site/…`; portfolio files stay private behind `/api/files`.
- **Deploying schema changes.** Workers Builds only builds and deploys, so the
  dashboard deploy command must apply migrations first:
  `npx wrangler d1 migrations apply fashion_os --remote && npx wrangler deploy --config dist/server/wrangler.json`

## Making the first admin

`/workspace/admin` returns 404 to everyone who is not an admin, so there is no
self-service bootstrap screen by design — the first admin is made from outside
the app:

```bash
# promotes the account if it exists, creates it if it does not
npm run make-admin -- you@fashionfreelancing.com --remote

# optionally set the password at the same time
npm run make-admin -- you@fashionfreelancing.com --password 'a long passphrase' --remote
```

Drop `--remote` to do the same against the local database. The script clears that
user's existing sessions, so sign in again for the role to take effect.

## Before going live

- [ ] `database_id` in `wrangler.toml` is the real one, not the placeholder
- [ ] `npm run db:migrate` has run against the remote database
- [ ] `MAIL_FROM` and `RESEND_API_KEY` are set, and a test sign-up delivers mail
- [ ] At least one admin exists
- [ ] Enough approved specialists per visible service, or a manual-match
      fallback is in place (plan §14, Phase 6)
- [ ] Spot-check the retirement redirects in `public/_redirects` — old
      marketplace URLs should land on `/specialists`, `/sign-in` or `/`

## Local development

```bash
cd fashion-os
npm install
npm run db:migrate:local
npm run dev            # http://localhost:4321
```

The local D1 and R2 live under `.wrangler/state/`. `npm run preview` builds and
serves through `wrangler pages dev`, which is the closest match to production.
