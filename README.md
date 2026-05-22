# FASHION OS

A simple marketplace for fashion freelancers. Hire someone, or get hired. Pay safely.

## The user flow

The whole site has **two equal paths** from the homepage:

```
                 ┌─ Homepage ─┐
                 │            │
        ┌────────┴────────┐   ┌────────┴────────┐
        │ I want to hire  │   │ I want to       │
        │ someone         │   │ get hired       │
        └────────┬────────┘   └────────┬────────┘
                 │                     │
        ┌────────▼────────┐   ┌────────▼────────┐
        │ Browse people   │   │ Browse jobs     │
        │ Pick someone    │   │ Click a job     │
        │ See their page  │   │ Apply           │
        └────────┬────────┘   └─────────────────┘
                 │
        ┌────────▼────────────────────────┐
        │ Hire them — pick:               │
        │  • a ready-made package, or     │
        │  • describe a custom job        │
        └────────┬────────────────────────┘
                 │
                 ▼
            Pay safely (we hold money until you approve)
```

No jargon. No "OS", "gig", "tier", "milestone", "escrow", or "verified-AI-matched-elite-talent". Just:

- **freelancer** (not creator/seller/talent)
- **package** (not gig/tier/service-level)
- **custom job** (not brief/RFP/proposal)
- **money is held safely until you approve** (not escrow)
- **Find a freelancer / Find a job** (not Talent / Marketplace)

## Project structure

```
FashionFreelancing/
├── public-html/                      Marketing + flow site (just open in a browser)
│   ├── index.html                    Homepage — 1 sentence + 2 path cards + 3 steps
│   ├── sitemap.xml · robots.txt
│   ├── assets/{styles.css, site.js, services.js}
│   └── pages/
│       │  ─ The two paths ─
│       ├── marketplace.html          Find a freelancer / Find a job (one page, two tabs)
│       ├── profile.html              Person's page (with "Hire" as the main button)
│       ├── gig.html                  A package detail (with packages, FAQ, reviews)
│       ├── hire.html                 The hire form — pick package or custom job
│       ├── brief.html                A custom job's detail (when applying)
│       │  ─ Help & info ─
│       ├── how-it-works.html         Three steps, hire/work tabs
│       ├── pricing.html              Free for buyers, optional Pro for freelancers
│       ├── about.html                Who we are
│       ├── help.html                 FAQs + contact form
│       │  ─ Auth ─
│       ├── login.html, signup.html, onboarding.html
│       ├── forgot-password.html, check-email.html, reset-password.html, email-verify.html
│       ├── dashboard-router.html     Demo: pick which workspace to see
│       │  ─ Stories & community ─
│       ├── blog.html, blog-post.html, community.html
│       │  ─ Legal & errors ─
│       ├── terms.html, privacy.html, cookies.html
│       └── 404.html, 500.html
│
└── fashion-os/                       The signed-in app (Astro + React 19 + Tailwind)
    └── src/pages/
        │  ─ Freelancer workspace ─
        ├── dashboard/index.astro     Home
        ├── dashboard/orders.astro    My jobs (was: Orders)
        ├── dashboard/orders/[id]     A single job (chat, files, deliver)
        ├── dashboard/gigs.astro      My services (was: My gigs)
        ├── dashboard/messages.astro  Messages
        ├── dashboard/proposals.astro Pitches I sent (was: Custom briefs)
        ├── dashboard/earnings.astro  My earnings
        ├── dashboard/profile.astro   My page (was: Edit profile)
        ├── dashboard/ai.astro        AI helper (was: AI Studio)
        ├── dashboard/settings.astro
        ├── dashboard/notifications.astro
        ├── dashboard/search.astro
        │
        │  ─ Brand workspace ─
        ├── brand/index.astro
        ├── brand/talent.astro        Find a freelancer
        ├── brand/post.astro          Post a job (was: Post a brief)
        ├── brand/applicants.astro    People who applied
        ├── brand/orders.astro        My orders
        ├── brand/messages.astro
        ├── brand/saved.astro         Saved freelancers
        ├── brand/billing.astro
        ├── brand/team.astro
        ├── brand/settings.astro
        │
        │  ─ Admin (internal) ─
        └── admin/{index, moderation, verification, disputes, fraud, users, subscriptions, services, reports, analytics, settings}.astro
```

**Total: 26 HTML pages + 38 Astro pages, all building clean.**

## Run it (one command, one port)

```bash
cd fashion-os
pnpm dev
# open http://localhost:4321
```

That's the whole thing. Astro serves both the public HTML site (homepage, marketplace, login, etc.) **and** the signed-in app (dashboards, admin) on the same port — so links between them work, sessions persist across the whole site, and `localStorage` is shared.

| URL | What |
|---|---|
| `/` | Homepage |
| `/pages/marketplace.html` | Find a freelancer / Find a job |
| `/pages/profile.html?id=u_amara` | Public freelancer page |
| `/pages/hire.html?freelancerId=u_amara` | Hiring form |
| `/pages/login.html`, `/pages/signup.html` | Auth |
| `/dashboard` | Creator workspace |
| `/brand` | Brand workspace |
| `/admin` | Admin console |

### Build for production
```bash
cd fashion-os
pnpm build         # outputs to fashion-os/dist/
pnpm preview       # serve dist/ at http://localhost:4321
```

### Editing pages
- **Public/marketing pages** are plain HTML in `fashion-os/public/index.html` and `fashion-os/public/pages/`. Edit and the page reloads.
- **Dashboard pages** are Astro in `fashion-os/src/pages/`. Hot reload works.
- **Shared logic** (auth, store, api) lives in `fashion-os/public/{store,api,ui,schema}.js` — used by *both* sides.

### Shared logic vs. mock data
Run the smoke test at any time:
```bash
node -e "globalThis.window=globalThis; const Store=require('./shared/store.js'); globalThis.FFStore=Store; const api=require('./shared/api.js'); api.users.signIn({email:'sara@auriga.world'}).then(s=>console.log('Signed in as', s.name))"
```

To swap mock for a real backend, change one file: `shared/api.js`. Each method body becomes a `fetch()` call — schemas and method signatures stay identical.

## What changed in this update

The previous version was overloaded with industry jargon — "OS", "production workflow", "champagne accent", "verified AI-matched elite talent", competing fork buttons next to a search bar next to category strips. Three different ways to do the same thing.

This version cuts to **two paths** with **plain wording** so a non-technical person — say, a fashion designer who's never used a marketplace before — can land on the homepage and immediately know what to do:

> *Hire fashion freelancers, or get hired as one. Simple as that.*

Then two big buttons. Then three plain steps. Then live activity. Then sign up.

That's it.
