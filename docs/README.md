# Fashion Freelancing — Architect Docs

Design documents Dinesh asked for. None of these change the live site;
they're deliverables for the platform / backend roadmap.

| File | What it answers |
|---|---|
| [01-prisma-schema.md](./01-prisma-schema.md) | Prisma / Postgres schema for the full marketplace (Users, Freelancers, Briefs, Orders with milestones + timesheets, Reviews, Conversations, Payments, Marketplace integrations). Drop-in when migrating from the localStorage demo. |
| [02-ai-intake-agent.md](./02-ai-intake-agent.md) | System prompt + strict JSON schema for the AI Project Intake bot. Includes the worked example session and the matching-algorithm contract. |
| [03-hero-react-component.md](./03-hero-react-component.md) | React + Tailwind reference component for the dark hero + 3-category service filter (Design & 3D / AI & Software / Production & QC). |
| [04-marketplace-integration-architecture.md](./04-marketplace-integration-architecture.md) | System architecture for syncing brand catalogs to Amazon / Flipkart / Myntra / Tata CLiQ. Covers inventory drift, asset compliance, AI lifestyle imagery, and Cloudflare-native deployment. |

## What's actually shipping on the live site

Separately from these docs, the live site is getting Dinesh's
strategic improvisations as **additive enhancements** (no teardown of
the v8 nebula theme):

- Dual-audience second row on the hero (Brand · Exporter · Factory · Tech)
- 3-category macro filter (Design / AI / Production-QC) on the marketplace
- Hourly vs Fixed-milestone toggle on the hire page
- Industrial service additions (Tukatech, Browzwear, Screen Color Separation)
- AI Intake **wizard styled as chat** at `/pages/start.html` —
  deterministic 5-question flow that emits the same JSON shape as the
  spec in `02-ai-intake-agent.md`, so the LLM swap is one-line later
