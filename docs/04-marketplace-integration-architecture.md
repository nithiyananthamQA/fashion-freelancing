# Marketplace Integration Architecture

System architecture for syncing a brand's products, digital tech packs,
AI-generated imagery, and stock levels with the major Indian /
international apparel marketplaces — **Amazon (Seller Central)**,
**Flipkart**, **Myntra**, **Tata CLiQ**, plus Shopify as the home base.

This is the doc Dinesh's 4th "Act as expert" prompt asked for. It
defines the platform layer the tech team builds *once*, so every brand
client gets the same robust pipeline.

---

## 1. Goals

| Goal | Why it matters |
|---|---|
| **One catalog, four sales channels** | Brand maintains products in one place; the platform pushes to each marketplace and pulls orders back. |
| **Real-time inventory parity** | Out-of-stocks across channels = lost ranking + suspensions. Inventory drift between channels is the #1 bottleneck. |
| **Compliance-clean assets** | Each marketplace has different image / title / variant rules. We normalise once, generate compliant variants. |
| **Tech-pack-aware** | Variant generation (sizes, colours) pulls from the tech pack BOM the freelancer delivered, not from manual data entry. |
| **AI-generated lifestyle imagery** | On-demand model swap / scene swap / background swap — automated for catalog refresh. |

---

## 2. High-level architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                 BRAND / FACTORY (the client)                     │
│  Shopify · Excel · Tally ERP · custom WMS · spreadsheet         │
└─────────────┬────────────────────────────────────────────────────┘
              │ webhook / pull
              ▼
┌──────────────────────────────────────────────────────────────────┐
│            PLATFORM CORE  (this codebase, server)                │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Catalog    │  │  Inventory  │  │  Asset / Image          │  │
│  │  Service    │  │  Service    │  │  Pipeline (AI)          │  │
│  │ Postgres    │  │ Redis +     │  │ Cloudflare R2 + Workers │  │
│  │ Prisma      │  │ Postgres    │  │ AI / SDXL on Replicate  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │              │                       │                │
│         └──────┬───────┴────────┬──────────────┘                │
│                ▼                ▼                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │       SYNC ORCHESTRATOR (event-driven workers)          │    │
│  │  · Adapter per marketplace                              │    │
│  │  · Retry + dead-letter queue                            │    │
│  │  · Idempotent jobs keyed on (sku × marketplace)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────┬─────────┬─────────┬─────────┬─────────────────────┘
              ▼         ▼         ▼         ▼
        ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
        │ Amazon │ │Flipkart│ │ Myntra │ │ Tata CLiQ  │
        │  SP-API│ │ Seller │ │ Partner│ │  Seller    │
        └────────┘ └────────┘ └────────┘ └────────────┘
```

---

## 3. Catalog Service — the single source of truth

Stores **one** canonical product per SKU. Each variant captures size,
colour, dimensions, materials (pulled from the tech-pack BOM), care
instructions, and base imagery.

Mapping to the database schema (see `fashion-os/migrations/0001_init.sql`):

- `Product` — name, brand-id, category, variant template
- `ProductVariant` — sku, size, colour, hex, materials, weight
- `ProductMedia` — base imagery (the assets pipeline derives all
  marketplace-specific renditions from these)
- `ProductTechPack` — the linked `PortfolioWork.embedUrl` / PDF
  delivered by the tech-pack freelancer
- `MarketplaceListing` — `(productId × marketplace) → externalId, last-synced-at, status`

**Outbound publish rules** for each marketplace live in TypeScript per
adapter (`adapters/amazon.ts`, `adapters/myntra.ts`…). Each adapter
implements the same interface:

```ts
interface MarketplaceAdapter {
  push(variant: ProductVariant, listing: MarketplaceListing): Promise<SyncResult>;
  pullInventory(externalSellerId: string): Promise<InventoryUpdate[]>;
  pullOrders(externalSellerId: string, since: Date): Promise<MarketplaceOrder[]>;
  validateAssets(variant: ProductVariant): ValidationIssue[];
}
```

This is the *only* place per-marketplace rules live. The orchestrator
treats every marketplace identically.

---

## 4. Inventory Sync — the bottleneck

Inventory drift between channels is the bug that suspends sellers and
loses ranking. Bottleneck patterns and fixes:

| Bottleneck | Why it happens | Fix |
|---|---|---|
| **Race conditions on dual sales** | Amazon and Myntra sell the last unit at the same millisecond | **Reservation tokens** in Redis: every marketplace requests a soft hold; the first to confirm wins, the loser gets a "low stock" push within 30s |
| **Slow marketplace acks** | Some adapters take 2-30s to confirm a stock-set | Apply optimistically locally, reconcile via the 5-minute pull job, alert on >2% drift |
| **Burst rate limits** | Catalogue refreshes blow through API quotas (Amazon SP-API: 5 req/s typical) | **Token bucket per marketplace** sized to the lower of (their published limit, our last-measured limit) |
| **Webhook starvation** | Myntra's webhook drops on outage; we don't know we're out of date | Every adapter runs a **5-minute polling job** alongside webhooks. The poll is the safety net. |
| **Stale cache** | Local DB shows 100 units; marketplace shows 50 because we missed an order | **Source-of-truth toggle**: when drift is detected, the marketplace adapter is treated as source of truth for that SKU for the next 15 minutes |

Storage: hot inventory lives in Redis (`inv:sku:{sku}` →
`{ qty, reservedQty, lastSyncAt }`), cold history lives in Postgres for
audit and reconciliation.

---

## 5. Image asset compliance

Each marketplace publishes its own image rules. The pipeline normalises
once and renders compliant variants on demand.

| Marketplace | Min resolution | Aspect | Background | Notes |
|---|---|---|---|---|
| Amazon | 1000×1000 | square | pure white | main image: product fills ≥85% of frame |
| Flipkart | 500×500 min, 2000×2000 recommended | square or 3:4 | white | no watermarks; logos on apparel acceptable |
| Myntra | 1080×1440 (3:4) | portrait | studio neutral | model shots required for category MAIN |
| Tata CLiQ | 800×1200 | portrait | white preferred | strict no-text rule |

**Pipeline:**

```
raw upload (R2)
   │
   ▼
Asset Pipeline Worker (Cloudflare Worker)
   ├─ analyze: detect bg type, foreground bbox, has-text?
   ├─ derive base masters: square-white, portrait-studio
   ├─ generate AI variants on demand (Replicate / SDXL): model
   │  swap, scene swap, colour-variant swap
   └─ store rendition manifest in Postgres
   │
   ▼
on publish: per-marketplace renderer picks the right base + applies
   final compliance pass (resolution check, text scan, watermark scrub)
```

**AI lifestyle imagery flow:**

1. Tech-pack freelancer uploads flat shots + the spec sheet.
2. Brand picks "Generate lifestyle images" on the product.
3. Pipeline runs an SDXL pass with the flat as a control net, the
   brand's reference moodboard as style guide, swaps the model and
   scene per marketplace SOPs.
4. Brand approves; renditions flagged "ai-generated" in metadata so
   the marketplace audit team can identify them if asked.

---

## 6. Bottleneck mitigations summary

| Bottleneck | Mitigation |
|---|---|
| Marketplace API rate limits | Token bucket per adapter, sized to *measured* throughput, not advertised |
| Webhook reliability | Always pair with 5-min poll. Webhook is fast path, poll is correctness path |
| Image upload latency | Pre-generate marketplace renditions; publish is a metadata-only call |
| Drift between channels | 15-min reconciliation; the channel that diverges most becomes read-source temporarily |
| Bulk catalog imports | Chunk to 50 SKUs/job; idempotency key = sha1(sku, variant, marketplace) |
| Brand changes the spec mid-listing | Lock the listing during the change, push a single "update" call per channel, unlock |
| Marketplace bans an asset | Flag in `MarketplaceListing.status = "asset_rejected"`, automatically queue an alt-rendition; alert ops |

---

## 7. Observability — what to dashboard

The bare minimum the platform team monitors:

| Metric | Threshold |
|---|---|
| Sync success rate per marketplace | <99% for >5min → page |
| Median push latency per marketplace | >10s for >5min → page |
| Inventory drift % per marketplace | >2% for any SKU >15min → page |
| API quota usage per marketplace | >85% of bucket for >5min → page |
| Webhook lag (received → applied) | >60s for >5min → warn |
| Image rendition queue depth | >500 for >10min → warn |
| Auth-token expiry warnings | <7 days for any active connection → email brand |

---

## 8. Phasing the build

| Phase | Scope | Why this order |
|---|---|---|
| **0** — Adapter for Shopify (read-only) | Pull products + inventory | Most clients arrive with Shopify; safest read-only first |
| **1** — Amazon SP-API push | Variants, listings, stock | Biggest channel; sets the abstraction the others reuse |
| **2** — Inventory reconciler | Cross-channel drift detection | Without this, every multi-channel client gets suspensions |
| **3** — Myntra + Flipkart adapters | Indian marketplaces | Same abstraction as Amazon; mostly config |
| **4** — Tata CLiQ adapter | Premium Indian channel | Lower volume; deferred |
| **5** — Asset pipeline (compliance variants) | Cloudflare Worker + R2 | After enough listings exist to know which rules bite first |
| **6** — AI lifestyle imagery | Replicate / SDXL pipeline | Last because it's optional; existing flat shots work for launch |

---

## 9. Cloudflare-native deployment

Because the platform already deploys on Cloudflare Pages, the
integration layer fits cleanly into the Cloudflare ecosystem:

- **Cloudflare Workers** — adapter execution + asset pipeline. Each
  adapter is one Worker; scales horizontally without extra ops.
- **Workers Queues** — sync orchestration + retry / dead-letter
- **Cloudflare R2** — raw image storage and rendition cache
- **Cloudflare D1** *or* **external Postgres** — for the catalog DB
  (D1 is cheaper at startup, swap to Postgres for >1M-row tables)
- **Cloudflare KV** — rate-limit token buckets (low write-volume,
  global)
- **Hyperdrive** — pool Postgres connections from Workers without TCP
  setup penalty

Total monthly cost at small scale (≤10k SKUs, ≤50k sync jobs/day):
roughly **$25–75** before AI image generation.
