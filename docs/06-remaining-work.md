# Remaining Work & Data Decisions

**Status:** Live checklist for finishing the specialist network.
**Companion to:** [05-service-led-specialist-network-plan.md](./05-service-led-specialist-network-plan.md) — the plan says *what* and *why*; this says *what is left* and *where things are stored*.

---

## 1. Where every kind of data lives

| Data | Stored in | Status |
|---|---|---|
| Accounts, sessions, verification tokens | **D1** — `users`, `sessions`, `auth_tokens` | Built |
| Companies and their members | **D1** — `companies`, `company_members` | Built |
| Specialist profiles, service offerings, search text | **D1** — `specialist_profiles`, `specialist_service_offerings`, `specialist_search` | Built |
| Taxonomy (services, specialties, skills, tools, stack) | **Code** — `src/data/taxonomy.ts`, mirrored into D1 by a generated migration | Built |
| Projects, requirements, invites, applications | **D1** — `projects`, `project_requirements`, `project_invites`, `applications` | Built |
| Hire requests and engagements | **D1** — `hire_requests`, `engagements` | Built |
| Messages | **D1** — `messages` | Built for hire requests, both sides |
| **Portfolio images / PDFs / video** | **R2** bucket `fashion-os-media`, key `portfolio/<userId>/<id>.<ext>` | Built, bucket not created yet |
| **Project & message attachments** | **R2**, key `attachment/<userId>/<id>.<ext>` | Storage layer built, no upload UI |
| Outbound email | **D1** — `outbound_email` | Built (queues when no provider) |
| Audit log, notifications, rate limits | **D1** — `audit_logs`, `notifications`, `rate_limits` | Built |
| Direct-service leads (contact forms, quote bot) | **D1** — `leads`, shown in `/workspace/admin` | Built |

### How file storage actually works

Nothing is ever public. Files go into a private R2 bucket and come back out through
one route, `/api/files/[...key]`, which re-checks authorization on **every**
request:

- A portfolio file is public only when both the item and the profile are approved.
- An attachment is readable only by its uploader, the company that owns the brief,
  the specialist it was sent to, or an admin.

Uploads are validated for size (25 MB), declared type, **and magic bytes** — a
script renamed to `.png` is rejected.

---

## 2. Can we use Firestore instead of D1?

Short answer: **you can, but it would be a downgrade here.** I would not move.

**Why D1 fits this app**

- The data is deeply relational. One directory query filters across profiles →
  offerings → skills/tools/stack, and requires *every* selected tag to be present
  (AND, not OR). In SQL that is one query. Firestore has no joins, and
  `array-contains-any` is an OR capped at ~30 values — it cannot express "has all
  of these five skills" without reading and filtering in the app.
- D1 runs *inside* Cloudflare, next to the worker. Firestore is an external
  service, so every page would add a cross-cloud round trip.
- The Firebase Admin SDK does not run on Workers (it needs gRPC/Node APIs). You
  would be on the REST API, hand-rolling auth tokens and losing transactions.
- Firestore bills per document read. A directory page reading 12 profiles plus
  their tag documents is many reads per page view; the same query in D1 is one.

**When Firestore would be worth it**

- Realtime messaging with live updates (the Phase 5 chat), where its listeners are
  genuinely good.
- If the business already ran on Firebase and wanted one console.

**If you want to move off D1 anyway**, the better swap is a serverless Postgres
that speaks HTTP (Neon or Supabase). It keeps every query in this repo working
with only the driver changed, because they are all plain SQL. Firestore would mean
rewriting the whole query layer *and* the filter logic.

A reasonable hybrid, later: keep D1 as the system of record, add Firestore or
Durable Objects only for the live chat.

---

## 3. What is left to build

Ordered so each item unblocks the next.

### 3.1 Cloud hosting — LATER, ON REQUEST ONLY
**Nothing is provisioned, and nothing in this repo will provision anything.**
Every id in `wrangler.toml` is a placeholder, and `npm run deploy` and
`npm run db:migrate` are deliberately disabled so no command can reach a real
Cloudflare account by accident.

The whole product runs locally on files under `.wrangler/state`. No account, no
billing, no external service.

When the owner's account is ready — and only when asked — the steps are in
DEPLOY.md. Do not run them speculatively: creating D1, KV or R2 touches a real
account, and R2 in particular requires billing details.

### 3.2 File uploads — off by design
Portfolio pieces are added as **links** (Behance, Figma, Drive, a live site).
File upload needs an R2 bucket, which needs billing on the account, so the
binding is commented out in `wrangler.toml` and the wizard hides the file field
whenever it is absent. The storage layer, the authorization checks and the
type/magic-byte validation are all written and tested — uncommenting the bucket
is the only step needed to turn uploads on.

### 3.3 Messaging and delivery (rest of Phase 5)
The `messages` and `attachments` tables exist and a specialist can already send one
question on a hire request. Still missing:
- A thread view on an active engagement, for both sides.
- Attachment upload into a thread (the storage layer is done; the UI is not).
- Deliverable submission, revision requests, and completion confirmation.

### 3.4 Malware scanning on upload
`attachments.scan_status` exists and defaults to `pending`; `/api/files` already
refuses anything marked `blocked`. Nothing sets `clean` yet — wire a scanner
(e.g. a queue consumer calling ClamAV or a hosted service) and flip the status.

### 3.5 Phone verification
The number is collected at application step 1 and stored, but never verified —
`users.phone_verified_at` is always null. Either wire an SMS provider or drop the
claim from the UI.

### 3.6 Notifications UI
Rows are written on every meaningful event, but nothing reads them. Add the bell /
list, and mark-as-read.

### 3.7 Company team management
`company_members` supports several people per company with owner/member roles, but
there is no invite flow — the creator is the only member.

### 3.8 Phase 6 — payments and operations
Contracts, invoices, payouts, disputes, reporting. `payments` is a skeleton table.
Payout details must be collected **after** approval, never in the application.

### 3.9 Automated tests
There are none in the repo. Every flow was verified with throwaway Playwright
scripts. Worth committing a small suite covering: the seven-step application, the
hire draft surviving sign-in, and the permission boundaries.

### 3.10 Search at scale
The directory matches with `LIKE '%term%'` against a denormalised `haystack`
column. Fine for hundreds of profiles; past that, move to D1/SQLite FTS5.

---

## 4. Known constraints worth remembering

- **Never run `npm run sync` while the dev server is up.** It deletes and recreates
  `public/assets`, which breaks static serving until a restart — pages render with
  no CSS. `npm run dev` already orders it correctly.
- **Rate limits apply in local development too.** Five sign-ups per hour per IP. If
  testing stalls at a sign-up, clear it:
  `npx wrangler d1 execute fashion_os --local --command "DELETE FROM rate_limits"`.
- **The first admin is made from outside the app** — `/workspace/admin` returns 404
  to everyone else, so there is no bootstrap screen by design. Use
  `npm run make-admin -- you@example.com` (add `--remote` for production).
- **The directory only lists approved profiles.** A fresh database shows an empty
  directory until an admin approves someone — that is correct, not a fault. There
  is deliberately no seeded demo data; the legacy marketplace's fake profiles were
  removed and not replaced.
- **Passwords are never echoed back** into a re-rendered form. That is deliberate;
  client-side validation exists so a failed submit almost never happens.
