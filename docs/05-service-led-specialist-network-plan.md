# Service-Led Specialist Network — Product & Implementation Plan

**Status:** Source of truth for the next product build  
**Scope:** Keep the current 10-service website as the main business and add a fully functional, curated specialist network.  
**Design rule:** All new pages must match the current dark, editorial glass design system. No legacy marketplace UI, wording, data, or flows may be reused.

---

## 1. Product decision

Fashion Freelancing is a **fashion services company first** and a curated network of independent specialists second.

The current website must continue to sell the company-delivered services:

- Tech Pack
- 3D Virtual Sampling
- Seamless Pattern
- Pattern CAD
- Dobby & Jacquard
- Website Development
- AI Agent
- AI Video & Photography
- E-Commerce Listing
- Graphic Design

The new network is an optional route for clients who specifically need to hire an individual professional.

```text
Current homepage / service page
├─ Start a project with our team
│  └─ Existing direct-service quote flow; no account required
│
└─ Need a specialist?
   ├─ Company / brand: Find a specialist
   │  ├─ Browse approved people
   │  ├─ Filter by the same 10 services and their specialties
   │  ├─ Request to hire a selected person
   │  └─ Or post a project for matched specialists
   │
   └─ Freelancer: Join as a freelancer
      ├─ Build a service-specific profile
      ├─ Submit portfolio and availability
      ├─ Receive approval
      └─ Receive matching project invitations
```

This is not an open, generic freelancer marketplace. It is a curated extension of the existing service business.

---

## 2. Public language and entry points

Use plain language everywhere. Do not use terms such as *talent marketplace*, *gig*, *seller*, *buyer*, or *work giver*.

| Audience | Public label | Supporting copy |
|---|---|---|
| Companies, brands, factories, founders | **Find a specialist** | Browse approved professionals for a specific project. |
| Independent professionals | **Join as a freelancer** | Show your work and get considered for suitable projects. |
| Clients who want the Fashion Freelancing team | **Start a project** | Get a fixed quote for one or more of our services. |

### Homepage addition

Add one focused section **after the 10-service rail and before the current “How it works” section**.

```text
Need a specialist for your project?
Browse approved professionals across our ten services,
or join the network and receive relevant work opportunities.

[ Find a specialist ]       [ Join as a freelancer ]
For brands & companies      For independent professionals
```

The existing homepage hero and its **Start a project** CTA stay unchanged.

### Service-page addition

Each existing service page receives a small contextual module close to its existing project CTA:

- Primary: **Start this project with our team**
- Secondary: **Find a [service name] specialist**

Examples:

- `Find a Tech Pack specialist`
- `Find a Pattern CAD specialist`
- `Find a Website Development specialist`

The second CTA opens the directory with the selected service pre-filtered.

---

## 3. Information architecture

The current public pages remain. The following specialist-network routes are new.

| Route | Access | Purpose |
|---|---|---|
| `/specialists` | Public | Approved specialist directory and filters. |
| `/specialists/[handle]` | Public | Specialist profile, portfolio, and request-to-hire CTA. |
| `/apply` | Public | Freelancer application entry and onboarding. |
| `/sign-in` | Public | Shared sign-in for companies and freelancers. |
| `/company/setup` | Signed-in company | Finish company profile after sign-up. |
| `/hire/[specialist-handle]` | Signed-in company | Send a private request to work with a selected specialist. |
| `/projects/new` | Signed-in company | Post a project for matching specialists. |
| `/projects` | Approved freelancer | Browse projects that match the freelancer’s services. |
| `/workspace/company` | Company members | Saved specialists, projects, applicants, active engagements. |
| `/workspace/freelancer` | Approved freelancer | Profile, invitations, applications, active engagements. |
| `/workspace/admin` | Internal team only | Review, moderation, matching, and operations. |

### Account rule

One person can have both a company role and a freelancer profile under one account. Do not create separate account systems for each role.

---

## 4. Design and UX contract

All new public and signed-in UI must extend the current website rather than replace it.

### Reuse

- Current dark background, grain, glow, gradients, and glass panels
- Current typography, spacing scale, button styles, input styling, and mobile breakpoints
- Existing ten-service colours and visual hierarchy
- Current navigation, footer, accessibility conventions, and reduced-motion support

### Do not introduce

- A generic white SaaS dashboard
- A copied marketplace card layout
- Dense tables as the primary mobile UI
- New unrelated fonts, colour systems, or component libraries
- More than one dominant CTA in a section

### Directory UX

The directory must be useful without overwhelming a first-time visitor.

Visible by default:

- Search
- Service
- Specialty
- Availability

Inside **More filters**:

- Skills
- Tools and technology stack
- Experience
- Location / timezone
- Languages
- Budget range
- Remote / onsite / hybrid
- Verification status

Each result card shows only the decision-making information:

- Photo, name, and professional headline
- Main service and specialty
- Up to five key tags
- Experience and availability
- Starting rate or preferred engagement style
- Compact portfolio preview
- Save and View profile actions

The profile page exposes the full skills, tools, stack, portfolio, and experience details.

---

## 5. Service taxonomy model

Every specialist profile is composed from a structured taxonomy:

```text
Service
→ Specialty
→ Skills
→ Tools / software
→ Technology stack, when applicable
→ Portfolio evidence
→ Availability and engagement preference
```

A freelancer selects one **primary service** and may add up to two secondary services. Every selected service has its own specialties, skills, tools, and portfolio evidence.

### Controlled tags plus reviewed custom input

Use controlled options for filtering quality, with a safe custom-input path:

1. Show suggested skills and tools first.
2. Allow the freelancer to add a custom skill or tool.
3. Mark custom values as pending normalization.
4. Admin merges duplicates and spelling variations before they become public filters.

For example, `TypeScript`, `typescript`, and `TS` must resolve to one public tag: `TypeScript`.

### 5.1 Service-specific fields

| Service | Specialties | Essential skills / tools |
|---|---|---|
| Tech Pack | Womenswear, menswear, kidswear, activewear, denim, knitwear, accessories | Flats, BOM, measurements, construction, grading notes, Adobe Illustrator, CLO3D, PLM |
| 3D Virtual Sampling | Garment simulation, fit review, colourways, render production, animation, digital avatars | CLO3D, Browzwear, Marvelous Designer, Blender, fabric simulation, rendering |
| Seamless Pattern | Apparel prints, repeat patterns, textile prints, home textiles, print-ready files | Repeat design, colour separation, print production, Illustrator, Photoshop, Procreate |
| Pattern CAD | Base patterns, grading, marker making, digitising, fit corrections | Gerber, Lectra, Optitex, Tukatech, DXF, grading, marker planning |
| Dobby & Jacquard | Dobby structures, jacquard artwork, weave simulation, loom-ready files | Weave construction, yarn planning, textile CAD, loom-ready production files |
| Website Development | Frontend, backend, full-stack, e-commerce, Shopify, UI implementation, integrations | Frameworks, languages, databases, APIs, deployment, version control |
| AI Agent | Customer support, lead generation, sales assistance, knowledge-base agent, automation | Prompt design, workflows, API work, Python, TypeScript, automation tools |
| AI Video & Photography | Product imagery, lifestyle imagery, campaigns, short video, retouching | Art direction, image generation, retouching, motion, product consistency |
| E-Commerce Listing | Shopify, Amazon, Myntra, Flipkart, catalog upload, SEO content, product attributes | Product data, SEO, marketplace requirements, bulk upload, catalog tools |
| Graphic Design | Brand identity, packaging, social media, campaign assets, lookbooks, print design | Figma, Illustrator, Photoshop, InDesign, typography, production files |

### 5.2 Website Development stack logic

Website Development requires a more detailed conditional form.

#### Role

- Frontend Developer
- Backend Developer
- Full-stack Developer
- E-commerce Developer
- Shopify Developer
- UI Implementation Specialist
- API / Integration Developer

#### Frontend Developer fields

- Languages: JavaScript, TypeScript
- Frameworks: React, Next.js, Astro, Vue, Angular, Svelte
- Styling: Tailwind CSS, CSS, Sass
- Capabilities: responsive design, accessibility, performance optimization, component systems

#### Backend Developer fields

- Languages: Python, TypeScript, Java, PHP, and custom values
- Frameworks: FastAPI, Django, Node.js, Express, NestJS, Laravel, and custom values
- Databases: PostgreSQL, MySQL, MongoDB, and custom values
- Capabilities: API development, authentication, payments, admin systems, cloud deployment

#### Full-stack Developer fields

Show both the frontend and backend field groups. Do not force the freelancer to write duplicate information.

#### Public display example

```text
Full-stack E-commerce Developer
TypeScript · React · Next.js · Python · FastAPI · PostgreSQL · Shopify
```

### 5.3 Search and display rule

The directory search must match structured fields, not only a biography.

Supported searches include:

- `Tech Pack specialist for activewear`
- `Pattern CAD Gerber`
- `frontend TypeScript`
- `Shopify developer`
- `AI photography for e-commerce`
- `jacquard loom-ready files`

---

## 6. Company hiring journey

### 6.1 Browse first, sign up at the point of value

A company can browse directory cards and profile pages without an account.

Only when they click **Request to hire**, **Save specialist**, or **Post a project** should sign-in be required.

If a visitor signs in during a request, preserve:

- The specialist they selected
- Current filters and directory state
- Any saved project-request draft

### 6.2 Company account setup

Collect only the information needed to begin:

- Name
- Work email
- Password or approved social sign-in
- Company / brand name
- Role in the company
- Website, optional
- Country and timezone
- Acceptance of terms and privacy policy

### 6.3 Specialist profile and request-to-hire

The public profile shows:

- Professional headline and introduction
- Services, specialties, skills, tools, and stack
- Experience, languages, timezone, and availability
- Engagement preferences and starting rate
- Portfolio evidence
- Save specialist action
- Primary action: **Request to hire**

Private contact details are never public.

### 6.4 Hire request form

The selected service and specialist are pre-filled. The company provides:

1. Project title
2. Service and specialty
3. Brief and desired deliverables
4. Timeline, start date, and deadline
5. Fixed, hourly, or monthly engagement type
6. Budget range and currency
7. Attachments: tech packs, references, moodboards, files
8. NDA requirement
9. Work location: remote, onsite, or hybrid
10. Visibility: private to this specialist, selected invitations, or matched specialists

The specialist can:

- Accept
- Decline
- Ask a question
- Send a proposal

Once both parties agree, the request becomes an active engagement.

---

## 7. Company project-posting journey

This route is for companies that know what work they need but do not yet know whom to hire.

```text
Post a project
→ Choose service
→ Choose service-specific specialties, skills, tools, and stack requirements
→ Define scope, deliverables, budget, dates, files, and NDA
→ Select project visibility
→ Publish
→ Matching approved freelancers receive invitations or see the project
→ Company reviews applications, shortlists, messages, and hires
```

Projects must not be visible to search engines or unapproved users. Confidential projects are private by default.

---

## 8. Freelancer application journey

Use a progressive wizard with a visible step count, autosave, validation, and a save-and-return option.

### Step 1 — Account

- Name
- Email
- Password or approved social sign-in
- Country and timezone
- Phone verification
- Freelancer terms acceptance

### Step 2 — Services and specialties

- Select primary service
- Select up to two secondary services
- Select relevant specialties for each service

Only show relevant questions. A Pattern CAD applicant must not see Website Development stack questions.

### Step 3 — Skills, tools, and technology stack

- Structured skill tags
- Structured tool / software tags
- Conditional technology-stack fields
- Custom skill and tool input pending admin normalization

### Step 4 — Professional profile

- Professional headline
- Biography
- Years of experience
- Languages
- Location and timezone
- Work preference: project, hourly, or monthly support
- Availability, capacity, and turnaround time

### Step 5 — Portfolio

Require at least two meaningful work examples before submission.

Each portfolio item includes:

- Project title
- Relevant service and specialty
- Description of the freelancer’s contribution
- Image, video, PDF, Figma file, or external URL
- Client name only with permission
- Confirmation that the freelancer has permission to show the work

### Step 6 — Rates and work preferences

- Starting price or rate range
- Fixed project, hourly, day rate, or retainer
- Preferred project size
- Remote, onsite, or hybrid preference
- Supported regions and timezones

### Step 7 — Submit for review

```text
Draft → Submitted → Needs changes → Approved → Paused
```

Only approved specialists appear in the directory and receive projects.

Do not collect bank details or tax documents during this first application. Sensitive payout details belong in a separate, secure payout setup after approval and before a paid engagement.

---

## 9. Matching and engagement lifecycle

### Initial matching rules

Start with explainable matching rather than hidden automated scoring.

Match specialists by:

1. Service
2. Specialty
3. Required skills and tools
4. Technology stack, where relevant
5. Availability
6. Budget compatibility
7. Language and timezone
8. Experience and portfolio relevance

Show a transparent reason when a profile is recommended:

> Recommended because this specialist offers Website Development, Shopify, TypeScript, and is available this month.

### Engagement states

```text
Project:
Draft → Submitted → Published → Receiving responses
→ Shortlisted → Hired → In progress → Delivered → Completed

Hire request:
Draft → Sent → Viewed → Questions / Proposal
→ Accepted → Active engagement → Completed / Closed
```

The later active-engagement workspace needs:

- Private messaging
- Attachments and version history
- Deliverable tracking
- Revision requests
- Contract and invoice status
- Payment and payout status
- Completion confirmation and review

---

## 10. Admin and operations

The new admin area is built fresh. Do not reuse the legacy marketplace admin UI.

Required internal tools:

- Review freelancer applications
- Request profile corrections
- Approve, reject, feature, or pause specialist profiles
- Normalize custom skills and tools
- Review and moderate projects
- Manually recommend specialists to a company
- Moderate portfolio content and file uploads
- Manage reports, disputes, and suspicious activity
- View project, request, engagement, and payment status
- Maintain audit history for significant actions

---

## 11. Technical foundation

The legacy browser-only local-storage marketplace is not suitable for this feature.

Build a real application foundation:

- Static-first current services website
- Secure server-side application API
- Real relational database
- Real authentication and email verification
- Secure object storage for portfolios and project attachments
- Role-based authorization
- Email and in-product notifications
- Search indexes for services, specialties, skills, tools, and stacks
- File-type validation, malware scanning, and upload limits
- Audit logs for sensitive actions

### Core data areas

```text
users
companies
company_members
specialist_profiles
specialist_service_offerings
service_categories
service_specialties
skills
tools
technology_stacks
portfolio_items
availability
projects
project_requirements
project_invites
applications
hire_requests
engagements
messages
attachments
saved_specialists
verification_reviews
payments
audit_logs
```

### Permission rules

- Public users see only approved, active profiles and approved public portfolio items.
- Company members can access only their own company’s projects, requests, and engagements.
- Freelancers see only their own profile, applications, invitations, and assigned engagements.
- Freelancers may see a project only when it is published to their matched service group or specifically invited.
- Only admins can approve profiles, normalize taxonomy, moderate content, or access operational records.

---

## 12. Full legacy marketplace removal

This is a deletion and migration task, not a hide-with-comments task.

### 12.1 Preserve

- `public-html/index.html` and the current service-oriented homepage
- The ten current service pages
- About, Help, legal, 404, and 500 pages
- Current visual assets, navigation, footer, service data, and quote bot styling
- The current direct-service quote journey while it is migrated off browser local storage

### 12.2 Replace before removal

The live services site currently stores quote/contact submissions in browser local storage under `ff_service_leads`. The public pages no longer load legacy shared scripts; that separation and the deletion work below are complete.

Before adding the specialist network, complete the remaining direct-service hardening:

1. Move direct-service lead submission to a dedicated server-side lead endpoint.
2. Move the quote bot to that same lead endpoint.
3. Verify every current service-page contact form still works.

### 12.3 Remove

After the above replacement is verified, remove all code exclusively belonging to the old freelance marketplace:

- Marketplace listing, profile, gig/package, hire, brief, job, login, sign-up, onboarding, and password-reset pages
- Legacy freelancer, brand, dashboard, and marketplace-admin Astro routes
- Legacy marketplace layouts, sidebars, mock data, schema, API, local-storage store, and UI modules
- Old marketplace chat widget and intake renderer
- Commented `HIDDEN FOR LAUNCH` marketplace and auth blocks
- Legacy sitemap entries, documentation, archived marketplace pages, and obsolete backups
- Generated legacy copies under `fashion-os/public` by regenerating rather than editing generated files by hand

### 12.4 Migration safety sequence

1. Create a local Git checkpoint before deletion.
2. Map every legacy import, script tag, link, and route.
3. Decouple current quote/contact functionality from the legacy scripts.
4. Delete source files and hidden comment blocks.
5. Add redirects for old public URLs.
6. Regenerate `fashion-os/public` from source.
7. Run a production build and route smoke test.
8. Confirm no old marketplace page, UI string, browser-storage key, or commented launch block remains.

### 12.5 Redirect policy

| Old route type | Destination after removal |
|---|---|
| Marketplace, profile, gig, and hire URLs | `/specialists` once the new directory exists |
| Old sign-in, dashboard, and workspace URLs | New shared sign-in or `/` |
| Old project/brief URLs with no new equivalent | `/` |
| Unknown URLs | Current 404 page |

`fashion-os/public` is generated by `fashion-os/scripts/sync-public.mjs`; source directories are the only places to edit.

---

## 13. Non-functional requirements

### Security and privacy

- Passwords and authentication handled only by the authentication system, never by browser local storage
- Private briefs and attachments protected by authorization checks
- No public contact details for freelancers or companies
- Portfolio permission confirmation required
- File upload restrictions, scanning, and signed download URLs
- Rate limiting and spam protection on sign-up, inquiry, and messaging routes
- Audit history for account, moderation, and payment actions

### Accessibility

- Keyboard navigation for all filters, forms, menus, modals, and dialogs
- Proper labels, validation messages, and focus handling
- Sufficient contrast within the existing visual system
- Reduced-motion support consistent with the current website
- Mobile controls with usable touch targets

### Performance

- Service marketing pages remain lightweight and fast
- Directory cards load paginated results, not every profile at once
- Portfolio media uses responsive sizes and lazy loading
- Search and filter queries use indexed structured fields
- Signed-in app code does not block current homepage rendering

---

## 14. Delivery sequence

### Phase 0 — Product and taxonomy

- [ ] Finalize every service’s specialties, skills, tools, and conditional fields.
- [ ] Decide the maximum number of secondary services and custom tags.
- [ ] Write company, freelancer, privacy, portfolio, payment, and dispute policies.
- [ ] Define approval standards for every service.
- [ ] Create final page content and screen-level UI specification.

### Phase 1 — Legacy removal and direct-services safety

- [ ] Move existing lead capture and quote bot off local storage. **Deferred by decision — still the one open Phase 1 item.**
- [x] Remove legacy public-marketplace dependencies from the current services website.
- [x] Remove legacy marketplace code and hidden comment blocks.
- [x] Add redirects and verify current pages remain intact.
- [x] Build and smoke-test production output.

### Phase 2 — Shared foundation

- [x] Implement authentication, email verification, roles, and permissions.
- [x] Implement the relational data model and file storage.
- [x] Create the canonical service taxonomy module.
- [x] Build notification and audit foundations.

### Phase 3 — Freelancer network supply

- [x] Build the freelancer application wizard.
- [x] Build service-specific fields, including Website Development stack logic.
- [x] Build portfolio upload and profile preview.
- [x] Build admin review and approval.

### Phase 4 — Company discovery and hiring

- [x] Add the homepage and service-page network entry points.
- [x] Build the directory, search, filters, profiles, and saved specialists.
- [x] Build company setup and request-to-hire flow.
- [x] Preserve drafts through sign-in.

### Phase 5 — Projects and collaboration

- [x] Build project posting, matching, invitations, applications, and shortlists.
- [ ] Build messages, attachments, project status, deliveries, and revisions.
- [x] Build company and freelancer workspaces.

### Phase 6 — Payments, operations, and launch

- [ ] Add contracts, invoices, payment status, payouts, and dispute handling.
- [ ] Add operational reporting and moderation tooling.
- [ ] Run security, accessibility, mobile, and end-to-end test passes.
- [ ] Launch only with enough approved specialists per visible service or a manual-match fallback.

---

## 15. Acceptance criteria

The first public release is ready only when all of the following are true:

### Current business is protected

- The homepage, ten service pages, and direct quote flow look and work as they do today.
- A client can still start a direct-service project without creating an account.
- No old marketplace UI or legacy account experience is visible or reachable.

### Company journey works end to end

- An anonymous visitor can filter specialists by service, specialty, skills, tools, and stack.
- The visitor can view an approved profile and request to hire without losing data during sign-up.
- A company can post a project, receive applications, shortlist, message, and hire.

### Freelancer journey works end to end

- A freelancer sees only relevant service-specific questions.
- A Website Development freelancer can show frontend, backend, or full-stack technology details.
- A submitted application reaches admin review.
- An approved freelancer becomes searchable and can receive matching work.

### Quality and safety work

- No unauthorized user can see private projects, contact data, attachments, or workspaces.
- All mobile forms, filters, uploads, and sign-in returns work.
- Keyboard, screen-reader, error, loading, empty, and offline states are covered.
- No visible page depends on the deleted legacy marketplace scripts or browser-local-storage data.

---

## 16. Immediate next implementation work

Phases 1–4 are built, plus project posting, matching and both workspaces from
Phase 5. What remains, in order:

1. **Move lead capture off local storage.** The homepage form, the ten service-page
   forms and the quote bot still write to `ff_leads`. This is the last open Phase 1
   item and the only remaining browser-storage dependency on the public site.
2. **Provision the live bindings.** Create the D1 database and R2 bucket, put the real
   `database_id` in `wrangler.toml`, and set `RESEND_API_KEY` + `MAIL_FROM` so
   verification email sends instead of queueing in `outbound_email`.
3. **Messaging and deliverables** (rest of Phase 5): the thread on an active
   engagement, attachments with version history, revision requests, delivery
   confirmation.
4. **Malware scanning on upload.** `src/server/storage.ts` validates type, magic
   bytes and size; `attachments.scan_status` is in place but nothing sets it to
   `clean` yet.
5. **Phase 6**: contracts, invoices, payouts, disputes, reporting, and the
   security / accessibility / mobile / end-to-end test passes.

### What was built

| Area | Where |
|---|---|
| Canonical taxonomy | `fashion-os/src/data/taxonomy.ts` (seed SQL is generated from it) |
| Schema | `fashion-os/migrations/0001_init.sql` |
| Auth, sessions, guards, storage, audit, matching | `fashion-os/src/server/` |
| Directory, profiles, apply, hire, projects, workspaces | `fashion-os/src/pages/` |
| Shared dark design system | `public-html/assets/night.css` + `network.css` |
| Legacy retirement map | `fashion-os/public/_redirects` |
