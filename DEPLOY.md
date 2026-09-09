# Deploying to Cloudflare Workers

> **Current hosting (since 2026-09-09):** the site runs in the Cloudflare account
> `Freelancingfashion@gmail.com` (id `d798bbc8cbee648ce1697e580547335a`) and
> deploys automatically from GitHub through Workers Builds — every push to
> `main` builds `fashion-os` and deploys. D1 `fashion_os` was migrated there
> with all data; R2 `fashion-os-media` is enabled, so uploads are on.
> `SITE_URL` points at the workers.dev URL until the custom domain is connected.
> The old account's worker is retired.

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
npx wrangler pages secret put RESEND_API_KEY    # optional, enables real email
```

And set `MAIL_FROM` (e.g. `no-reply@fashionfreelancing.com`) in the Pages
environment variables, alongside `SITE_URL`.

Without a mail provider the app still works: verification and reset messages are
recorded in the `outbound_email` table and shown in `/workspace/admin`, so no
flow dead-ends. Set both variables before real sign-ups.

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Framework preset** | `Astro` |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `fashion-os` |
| **Node version** | env var `NODE_VERSION` = `22` |

> The **root directory must be `fashion-os`** — the build runs there, and
> `sync-public.mjs` reaches up to `../public-html`.

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
