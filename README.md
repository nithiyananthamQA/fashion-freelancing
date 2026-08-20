# Fashion Freelancing

A fashion services company first, and a curated network of independent
specialists second.

Two things live in this repo:

1. **The services website** — a static, dependency-light site selling the ten
   services the in-house team delivers. This is the business.
2. **The specialist network** — a server-rendered add-on for clients who
   specifically need to hire one professional, and for freelancers who want to
   be considered for that work.

The network extends the services site. It is not an open marketplace, and it
never uses marketplace vocabulary — no *talent marketplace*, *gig*, *seller*,
*buyer* or *work giver*. See [docs/05-service-led-specialist-network-plan.md](docs/05-service-led-specialist-network-plan.md),
which is the source of truth for scope and behaviour.

## The three journeys

```
Homepage / service page
├─ Start a project ............ our team delivers it. Fixed quote, no account.
│
└─ Need a specialist?
   ├─ Find a specialist ....... browse approved people, filter, request to hire,
   │                            or post a project and get matched
   └─ Join as a freelancer .... build a service-specific profile, submit a
                                portfolio, get approved, receive matched work
```

Browsing the directory and reading a profile need no account. Sign-in is asked
for only at the point of value — **Request to hire**, **Save specialist** or
**Post a project** — and whatever was already typed survives the detour.

## The ten services

Tech Pack · 3D Virtual Sampling · Seamless Pattern · Pattern CAD ·
Dobby & Jacquard · Website Development · AI Agent · AI Video & Photography ·
E-Commerce Listing · Graphic Design

They are defined once, in [`fashion-os/src/data/taxonomy.ts`](fashion-os/src/data/taxonomy.ts) —
service ids match the slugs of the ten public service pages, so a service page
links straight into the directory with its own filter applied. The seed
migration is generated from that file; never edit it by hand.

## Project structure

```
FashionFreelancing/
├── public-html/                     The services website — SOURCE OF TRUTH
│   ├── index.html                   Homepage (hero, ten-service rail, network
│   │                                doors, process, contact)
│   ├── pages/services/*.html        The ten service pages, hand-built
│   ├── pages/{about,help,terms,privacy,cookies,404,500}.html
│   ├── assets/styles.css            Base reset + type scale
│   ├── assets/night.css             THE dark glass design system (tokens,
│   │                                nav/footer skin, buttons, forms, motion)
│   ├── assets/network.css           Specialist-network components
│   ├── assets/site.js               Injects nav + footer, motion, quote bot
│   └── assets/quote-bot.js          Direct-service quote widget
│
├── fashion-os/                      The Astro app + the build
│   ├── src/data/taxonomy.ts         Canonical services, specialties, skills,
│   │                                tools, and the Website Dev stack logic
│   ├── src/server/                  auth · sessions · guards · storage ·
│   │                                validation · rate limiting · audit ·
│   │                                matching · repo queries
│   ├── src/pages/                   The network routes (see below)
│   ├── src/layouts/Night.astro      Shared shell — loads the same CSS and the
│   │                                same nav/footer as the services site
│   ├── migrations/                  D1 schema + generated taxonomy seed
│   ├── scripts/sync-public.mjs      Copies public-html/ into public/
│   ├── scripts/gen-taxonomy-sql.mjs Regenerates the seed migration
│   ├── public/{_headers,_redirects,favicon.svg}   hand-maintained
│   └── dist/                        BUILD OUTPUT — what Cloudflare serves
│
└── docs/                            Product documents
```

Everything `sync-public.mjs` writes into `fashion-os/public/` is generated and
git-ignored. Edit `public-html/`, never the copy.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` and `/pages/**` | Public, static | The services website |
| `/specialists` | Public | Directory, search and filters |
| `/specialists/[handle]` | Public | Profile, portfolio, request-to-hire |
| `/apply` | Public | Seven-step freelancer application |
| `/sign-in` | Public | Shared sign-in and account creation |
| `/company/setup` | Signed in | Finish the company profile |
| `/hire/[handle]` | Company | Private request to one specialist |
| `/projects/new` | Open form, company to publish | Post a project |
| `/projects` | Approved specialist | Matched and invited projects |
| `/workspace/company` | Company members | Saved, projects, applicants, engagements |
| `/workspace/freelancer` | Specialist | Status, requests, invitations, engagements |
| `/workspace/admin` | Admins | Review, moderation, taxonomy, audit |
| `/api/files/[...key]` | Authorized only | The only path to an R2 object |

Static routes are served from the CDN and never touch the worker. Every network
route opts into server rendering with `export const prerender = false`.

## Design system

One dark, editorial glass system, defined once in
[`public-html/assets/night.css`](public-html/assets/night.css) and used by both
halves of the site. The network pages introduce no new colours, fonts or
component library — they load `styles.css`, `night.css` and `network.css`, mount
`#site-nav` / `#site-footer`, and let `site.js` fill them, so the navigation is
literally the same code.

Existing pages keep their own inline `<style>` blocks, which load last and still
win. Adopting `night.css` therefore cannot regress them.

## Running it

```bash
cd fashion-os
npm install
npm run db:migrate:local     # create + seed the local D1 database
npm run dev                  # http://localhost:4321
```

`npm run dev` syncs the services site into `public/` first, so the static pages
and the network routes are both served from one origin.

Other commands:

```bash
npm run build                # sync + astro build -> dist/
npm run check                # typecheck every .astro and .ts file
node scripts/gen-taxonomy-sql.mjs   # after editing taxonomy.ts
npm run db:migrate           # apply migrations to the remote D1 database
```

### Two dev-server gotchas

**Stale Vite cache.** After `astro.config.mjs` changes, Vite re-optimizes its
dependencies and can fail with *"The file does not exist at …/.vite/deps_ssr/…"*.
Clear the cache and start again:

```bash
npm run dev:clean
```

**Never sync while the server is running.** `scripts/sync-public.mjs` deletes and
recreates `public/assets`, which breaks the dev server's static file serving —
pages render with no CSS at all. Sync, then restart. `npm run dev` already does
them in that order; only a manual `npm run sync` mid-session causes it.

## Security posture

- Passwords are PBKDF2-SHA256 (210k iterations) via WebCrypto; sessions are an
  opaque token in an HttpOnly cookie, stored hashed. Nothing about an account is
  written to browser storage.
- Authorization lives in `src/server/guards.ts` and the repo queries, not in
  templates — a new page cannot leak a draft profile or another company's brief.
- Uploads are checked for type, magic bytes and size, stored in a private R2
  bucket, and served only through `/api/files/[...key]`, which re-checks
  authorization on every request.
- Sign-up, sign-in, hire, messaging and upload routes are rate limited and
  honeypot-trapped. Every moderation and account action writes an audit row.
- Projects, workspaces and the API are excluded in `robots.txt` and marked
  `noindex`; signed-in responses are `private, no-store`.

## Known open item

Direct-service leads (the homepage form, the ten service-page forms and the
quote bot) still write to `localStorage` under `ff_leads`. Moving them to a
server-side lead endpoint is the one remaining Phase 1 task — see §16 of the
plan.
