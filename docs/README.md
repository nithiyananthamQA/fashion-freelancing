# Fashion Freelancing — Product Documents

The current product direction is the service-led specialist network: the
ten-service public website stays the main business, and a curated specialist
network sits alongside it as an add-on for clients who need to hire one person.

The network is built — directory, profiles, the freelancer application wizard,
company setup, request-to-hire, project posting with explainable matching, both
workspaces, and the admin operations view. See §14 and §16 of the plan for what
is done and what is still open.

| File | Purpose |
|---|---|
| [05-service-led-specialist-network-plan.md](./05-service-led-specialist-network-plan.md) | **Source of truth.** Product scope, service taxonomy, UX contract, legacy removal, technical foundation, permissions, and rollout. |
| [06-remaining-work.md](./06-remaining-work.md) | Live checklist: where every kind of data is stored, what is still to build, and why D1 rather than Firestore. |
| [04-marketplace-integration-architecture.md](./04-marketplace-integration-architecture.md) | Technical reference for the E-Commerce Listing service — Amazon, Myntra and Flipkart catalogue integrations. Unrelated to the specialist network. |
| [HERO_MARQUEE_LOCK.md](./HERO_MARQUEE_LOCK.md) | The CSS contract that pins the homepage hero marquee to the bottom of the viewport. Read before touching the hero. |
| Fashion-Freelancing-Content-Package.html / .pdf | Content package for the services website. |

Implementation lives in the repo, not in a document:

- Canonical taxonomy — `fashion-os/src/data/taxonomy.ts`
- Database schema — `fashion-os/migrations/0001_init.sql`
- Design system — `public-html/assets/night.css`

Removed in the legacy clear-out (recoverable from git history, tag
`pre-network-removal-2026-08-19`): the Prisma schema for the old localStorage
marketplace, the marketplace intake-agent spec, and the React/Tailwind hero
reference. All three described flows and dependencies that no longer exist.
