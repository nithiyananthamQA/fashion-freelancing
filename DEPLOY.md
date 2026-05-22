# Deploying to Cloudflare Pages

This is the **Fashion Freelancing** site. It's a fully static build — no server,
no database — so it drops straight onto Cloudflare Pages.

## How the project fits together

```
FashionFreelancing/          ← git repo root
├── public-html/             ← the plain HTML public site (source of truth)
├── shared/                  ← shared JS modules: schema, store, api, ui
└── fashion-os/              ← the Astro app (dashboards) + the build
    ├── scripts/sync-public.mjs   copies public-html/ + shared/ into public/
    ├── public/_headers           Cloudflare caching + security headers
    ├── public/_redirects         clean-URL redirects
    └── dist/                     ← BUILD OUTPUT (what Cloudflare serves)
```

`pnpm build` runs `sync-public.mjs` first (pulls the public site + shared
modules into `fashion-os/public/`), then `astro build` produces `dist/`.
One build = the whole site.

## Cloudflare Pages settings

When you create the Pages project (connect the GitHub repo), use **exactly** these:

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Framework preset** | `Astro` (or `None`) |
| **Build command** | `pnpm build` |
| **Build output directory** | `dist` |
| **Root directory** | `fashion-os` |
| **Node version** | `20` (or newer) — set env var `NODE_VERSION` = `20` |

> The **Root directory must be `fashion-os`** — the build runs there, and
> `sync-public.mjs` reaches up to `../public-html` and `../shared`.

If Cloudflare doesn't detect `pnpm`, add an environment variable
`PNPM_VERSION` = `9` (or leave the build command as `npm install && npm run build`).

## After deploy

Cloudflare gives you a `https://<project>.pages.dev` URL.
Every push to `main` rebuilds and redeploys automatically.

## Notes

- This deploys as a **working demo**: the dashboard uses mock data in the
  browser's localStorage and auto-signs-in a demo user. There is no real
  backend or payments yet — data is per-browser and resets when cleared.
- `dist/`, `node_modules/`, and the synced copies under `fashion-os/public/`
  are git-ignored — Cloudflare regenerates them on every build.
