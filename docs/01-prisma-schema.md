# Fashion Freelancing — Prisma / PostgreSQL Schema

Production-ready schema for migrating from the current localStorage demo
(`shared/store.js`) to a real database. Designed for Postgres with Prisma,
but the SQL maps cleanly to MySQL or SQLite if needed.

Covers the three product axes Dinesh called out:

1. Users (Clients / Freelancers / Agency Admin / Factory)
2. Freelancer profiles spanning **traditional textile** (Dobby, Jacquard,
   Screen Color Separation) **and modern tech** (UI/UX, AI prompt
   engineering, app dev, marketplace integrations)
3. Project modules — both **hourly tracked contracts** and **multi-stage
   production milestones** (Tech Pack → 3D Fitting → Quality Inspection →
   Logistics)

Indexed for fast filter queries; portfolio supports multimedia (image,
video, code repo, embedded 3D model URL).

---

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
//  Identity & access
// ============================================================

enum UserRole {
  BRAND_OR_STARTUP   // small / DTC fashion brand or startup founder
  EXPORTER_FACTORY   // garment exporter or industrial textile factory
  FREELANCER         // creative or technical freelancer
  AGENCY_ADMIN       // internal platform staff
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id              String       @id @default(cuid())
  email           String       @unique
  passwordHash    String?       // null for OAuth-only accounts
  name            String
  handle          String       @unique          // @yunaaoki — public id
  avatar          String?
  role            UserRole
  status          UserStatus   @default(ACTIVE)
  emailVerified   Boolean      @default(false)
  phoneVerified   Boolean      @default(false)
  twoFactorEnabled Boolean     @default(false)
  locale          String       @default("en-US")
  timezone        String       @default("UTC")
  plan            String       @default("free")   // free | pro | studio | enterprise
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  lastSignInAt    DateTime?

  // Relations
  freelancer      Freelancer?
  brandProfile    BrandProfile?
  factoryProfile  FactoryProfile?
  ordersAsBuyer   Order[]      @relation("OrderBuyer")
  ordersAsSeller  Order[]      @relation("OrderSeller")
  briefs          Brief[]      @relation("BriefBrand")
  applications    Application[] @relation("ApplicationFreelancer")
  reviewsWritten  Review[]     @relation("ReviewAuthor")
  reviewsReceived Review[]     @relation("ReviewSubject")
  savedFreelancerIds SavedFreelancer[]
  notifications   Notification[]
  conversations   ConversationParticipant[]
  messages        Message[]    @relation("MessageSender")
  paymentMethods  PaymentMethod[]
  transactions    Transaction[]

  @@index([role, status])
}

// ============================================================
//  Profiles — three flavours
// ============================================================

model BrandProfile {
  id           String  @id @default(cuid())
  userId       String  @unique
  brandName    String
  brandWebsite String?
  category     String?  // ready-to-wear, streetwear, couture, etc.
  founded      Int?
  country      String
  countryCode  String   @db.VarChar(2)
  marketplaces String[] // ['amazon', 'flipkart', 'myntra', 'tata-cliq', 'shopify']
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FactoryProfile {
  id            String  @id @default(cuid())
  userId        String  @unique
  companyName   String
  gstin         String?  // India GSTIN (where applicable)
  factoryType   String   // 'garment-export' | 'fabric-mill' | 'knitwear' | 'denim' | 'jacquard' | ...
  monthlyCapacity Int?   // units / pieces per month
  certifications String[] // ['GOTS', 'OEKO-TEX', 'SA8000', 'WRAP']
  primaryMarkets String[] // ['EU','US','UK','JP','AU']
  machineStack  String[] // ['Optitex', 'Tukatech', 'Lectra', 'Gerber', 'Stoll', 'Shima Seiki']
  country       String
  countryCode   String   @db.VarChar(2)
  user          User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Freelancer {
  id                  String   @id @default(cuid())
  userId              String   @unique
  headline            String   // "Tech pack designer · Lagos · 24h delivery"
  bio                 String   @db.Text
  primaryServiceSlug  String
  serviceSlugs        String[] // all services this person offers
  // Skill axes — separate fields so we can filter cleanly
  traditionalSkills   String[] // ['dobby','jacquard','screen-color-separation','cad-pattern','grading','optitex']
  modernSkills        String[] // ['react','prompt-engineering','shopify','figma','clo3d','three.js']
  industrySoftware    String[] // CLO3D, Browzwear, Optitex, Tukatech, Lectra, Stoll, AccuMark…
  languages           String[]
  city                String
  country             String
  countryCode         String   @db.VarChar(2)
  currency            String   @default("USD")
  hourlyRate          Int?     // cents
  fromPrice           Int      // cents, lowest package price
  // Performance signals
  rating              Float    @default(0)
  reviewCount         Int      @default(0)
  completedOrders     Int      @default(0)
  onTimePercent       Int      @default(100)
  completionPercent   Int      @default(100)
  responseTimeMinutes Int      @default(240)
  isAvailable         Boolean  @default(true)
  // Approval gate
  approvalStatus      ApprovalStatus @default(PENDING)
  approvalReason      String?
  approvedAt          DateTime?
  // Verification level — derived, not user-editable
  verificationLevel   String   @default("unverified")
  // Badges & vanity counters
  badges              String[]
  profileViews30d     Int      @default(0)
  followerCount       Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolio           PortfolioWork[]
  packages            Package[]
  applications        Application[]
  experience          Experience[]
  socialLinks         SocialLink[]

  // Filter indexes — these are the columns the marketplace queries most.
  @@index([approvalStatus, isAvailable])
  @@index([primaryServiceSlug, approvalStatus])
  @@index([countryCode, approvalStatus])
  @@index([rating(sort: Desc), reviewCount(sort: Desc)])
}

model Experience {
  id           String     @id @default(cuid())
  freelancerId String
  company      String
  title        String
  startedAt    DateTime
  endedAt      DateTime?
  description  String?    @db.Text
  freelancer   Freelancer @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  @@index([freelancerId])
}

model SocialLink {
  id           String     @id @default(cuid())
  freelancerId String
  kind         String     // 'instagram' | 'behance' | 'github' | 'linkedin' | 'website'
  url          String
  freelancer   Freelancer @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  @@index([freelancerId])
}

// ============================================================
//  Portfolio — multimedia + process-flow ("Sketch → Tech pack → Final")
// ============================================================

enum PortfolioKind {
  IMAGE          // photo / digital art
  VIDEO          // reel / video
  PDF            // tech-pack / spec sheet PDF
  CODE_REPO      // github / gitlab link
  EMBED_3D       // CLO3D / Browzwear / Sketchfab URL
}

model PortfolioWork {
  id            String        @id @default(cuid())
  freelancerId  String
  title         String
  description   String?       @db.Text
  coverImageUrl String        // the thumbnail
  // If stages is non-empty, this is a process-flow piece (Sketch → Tech pack → Final)
  stages        PortfolioStage[]
  // Top-level kind for filter — the dominant medium of the project
  kind          PortfolioKind @default(IMAGE)
  // For interactive embeds: spinnable 3D model URL (Sketchfab/CLO3D export)
  embedUrl      String?
  // For code repos:
  repoUrl       String?
  tags          String[]       // ['streetwear','denim','sustainable']
  createdAt     DateTime       @default(now())

  freelancer    Freelancer     @relation(fields: [freelancerId], references: [id], onDelete: Cascade)

  @@index([freelancerId])
  @@index([kind])
}

model PortfolioStage {
  id              String        @id @default(cuid())
  portfolioWorkId String
  // Order matters — index 0 first
  position        Int
  kind            String        // 'sketch' | 'tech-pack' | 'sample' | 'final' | 'other'
  label           String        // human label — "Initial sketch"
  imageUrl        String
  portfolioWork   PortfolioWork @relation(fields: [portfolioWorkId], references: [id], onDelete: Cascade)
  @@index([portfolioWorkId, position])
}

// ============================================================
//  Service catalog
// ============================================================

model Service {
  slug          String  @id           // 'tech-pack-designer'
  name          String                // "Tech pack designer"
  group         String                // 'Concept' | 'Technical' | '3D & Sampling' | 'Production' | 'Visual' | 'Web & Marketing'
  audience      String[]              // ['brand','factory'] — which dual-entry-point shows this
  icon          String?
  description   String?  @db.Text
  freelancerCount Int    @default(0)
  fromPrice     Int     @default(0)   // cents
  isActive      Boolean @default(true)

  packages      Package[]
  briefs        Brief[]

  @@index([group, isActive])
}

// ============================================================
//  Packages — Fixed-price productized services
// ============================================================

enum PackageTier {
  BASIC
  STANDARD
  PREMIUM
}

model Package {
  id              String      @id @default(cuid())
  freelancerId    String
  serviceSlug     String
  tier            PackageTier
  title           String
  description     String      @db.Text
  priceCents      Int
  currency        String      @default("USD")
  deliveryDays    Int
  revisionsIncluded Int        @default(2)
  bullets         String[]    // ['Front+back+side flats','BOM included']
  isActive        Boolean     @default(true)

  freelancer      Freelancer  @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  service         Service     @relation(fields: [serviceSlug], references: [slug])
  orders          Order[]

  @@index([freelancerId, isActive])
  @@index([serviceSlug, isActive])
}

// ============================================================
//  Engagement model — hourly OR fixed milestones
//  (Dinesh: "toggle between Hourly Rate and Fixed Milestone Project")
// ============================================================

enum EngagementType {
  FIXED_PACKAGE     // off-the-shelf package
  FIXED_MILESTONES  // custom project, paid by stage
  HOURLY            // tracked timesheet, billed weekly
  RETAINER          // monthly retainer
}

enum OrderStatus {
  ORDERED
  IN_PROGRESS
  DELIVERED
  REVIEWED
  CLOSED
  CANCELLED
  DISPUTED
}

model Order {
  id              String         @id @default(cuid())
  buyerId         String
  sellerId        String
  packageId       String?         // null for non-package engagements
  briefId         String?         // null for marketplace direct hires
  engagementType  EngagementType
  title           String
  description     String         @db.Text
  amountCents     Int             // total agreed amount (for fixed); approved budget cap (for hourly)
  currency        String         @default("USD")
  // Commission breakdown — captured at order time so audits stay consistent
  buyerFeeCents       Int        // amount the buyer paid ON TOP of `amountCents`
  freelancerFeeCents  Int        // amount taken from the seller's payout
  freelancerNetCents  Int        // what the seller actually receives
  status          OrderStatus    @default(ORDERED)
  orderedAt       DateTime       @default(now())
  dueAt           DateTime?
  deliveredAt     DateTime?
  reviewedAt      DateTime?
  cancelledAt     DateTime?
  metadata        Json?           // arbitrary platform info

  buyer           User           @relation("OrderBuyer", fields: [buyerId], references: [id])
  seller          User           @relation("OrderSeller", fields: [sellerId], references: [id])
  package         Package?       @relation(fields: [packageId], references: [id])
  brief           Brief?         @relation(fields: [briefId], references: [id])
  milestones      Milestone[]
  timesheets      Timesheet[]    // for HOURLY engagements
  transactions    Transaction[]
  reviews         Review[]
  conversation    Conversation?

  @@index([buyerId, status])
  @@index([sellerId, status])
  @@index([status, orderedAt(sort: Desc)])
}

// Milestones — for fixed multi-stage projects (Tech Pack → 3D → QC → Logistics)
enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  SUBMITTED
  APPROVED
  REJECTED
  PAID
}

model Milestone {
  id          String          @id @default(cuid())
  orderId     String
  position    Int             // 1..n
  title       String          // "Tech pack approval", "3D fitting sign-off"
  description String?         @db.Text
  amountCents Int             // portion of the total
  status      MilestoneStatus @default(PENDING)
  dueAt       DateTime?
  submittedAt DateTime?
  approvedAt  DateTime?
  paidAt      DateTime?
  attachments String[]        // URLs to deliverables

  order       Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@index([orderId, position])
}

// Timesheets — for HOURLY engagements
model Timesheet {
  id          String   @id @default(cuid())
  orderId     String
  weekStart   DateTime
  weekEnd     DateTime
  // Detailed log
  entries     TimesheetEntry[]
  hoursTotal  Float
  amountCents Int
  status      String   @default("draft") // draft | submitted | approved | rejected | paid
  submittedAt DateTime?
  approvedAt  DateTime?
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@unique([orderId, weekStart])
}

model TimesheetEntry {
  id          String    @id @default(cuid())
  timesheetId String
  loggedAt    DateTime
  durationMin Int
  note        String?
  // Optional proof — screenshot / activity capture URL
  proofUrl    String?
  timesheet   Timesheet @relation(fields: [timesheetId], references: [id], onDelete: Cascade)
  @@index([timesheetId])
}

// ============================================================
//  Briefs / Jobs — brands post, freelancers apply
// ============================================================

enum BriefStatus {
  OPEN
  CLOSED
  AWARDED
  EXPIRED
}

model Brief {
  id              String      @id @default(cuid())
  brandId         String       // User.id
  serviceSlug     String
  title           String
  description     String      @db.Text
  // Budget range for FIXED briefs; for HOURLY, treat min/max as rate range
  budgetMinCents  Int
  budgetMaxCents  Int
  currency        String      @default("USD")
  engagementType  EngagementType  @default(FIXED_PACKAGE)
  durationWeeks   Int          @default(4)
  location        String      @default("remote")
  countries       String[]
  skillsRequired  String[]
  attachmentUrls  String[]
  isUrgent        Boolean     @default(false)
  status          BriefStatus @default(OPEN)
  postedAt        DateTime    @default(now())
  closesAt        DateTime
  applicantCount  Int         @default(0)

  brand           User        @relation("BriefBrand", fields: [brandId], references: [id])
  service         Service     @relation(fields: [serviceSlug], references: [slug])
  applications    Application[]
  orders          Order[]

  @@index([status, postedAt(sort: Desc)])
  @@index([serviceSlug, status])
  @@index([brandId])
}

enum ApplicationStatus {
  SENT
  SHORTLISTED
  REJECTED
  ACCEPTED
  WITHDRAWN
}

model Application {
  id                    String            @id @default(cuid())
  briefId               String
  freelancerId          String             // User.id (not Freelancer.id) for consistency
  pitch                 String            @db.Text
  proposedAmountCents   Int
  proposedDurationDays  Int
  status                ApplicationStatus @default(SENT)
  sentAt                DateTime          @default(now())
  attachmentUrls        String[]

  brief                 Brief             @relation(fields: [briefId], references: [id], onDelete: Cascade)
  freelancer            User              @relation("ApplicationFreelancer", fields: [freelancerId], references: [id])

  @@unique([briefId, freelancerId])
  @@index([briefId, status])
  @@index([freelancerId, status])
}

// ============================================================
//  Reviews, saves, conversations, notifications
// ============================================================

model Review {
  id          String   @id @default(cuid())
  orderId     String
  authorId    String    // who wrote it
  subjectId   String    // who it's about (freelancer or brand)
  rating      Int       // 1..5
  body        String   @db.Text
  // Multi-axis scoring — the trust signal Dinesh asked for
  rAccuracy   Int?      // 1..5 — were files factory-clean?
  rDeadline   Int?      // 1..5 — did they hit dates?
  rComms      Int?      // 1..5 — communication with factory & team
  rValue      Int?      // 1..5 — value for money
  createdAt   DateTime @default(now())

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  author      User     @relation("ReviewAuthor", fields: [authorId], references: [id])
  subject     User     @relation("ReviewSubject", fields: [subjectId], references: [id])

  @@unique([orderId, authorId])
  @@index([subjectId])
}

model SavedFreelancer {
  userId       String
  freelancerId String
  savedAt      DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([userId, freelancerId])
  @@index([userId])
}

model Conversation {
  id          String   @id @default(cuid())
  orderId     String?  @unique // 1:1 with an order, if any
  briefId     String?
  createdAt   DateTime @default(now())
  lastMessageAt DateTime?
  lastSenderId String?
  lastMessagePreview String?

  order       Order?   @relation(fields: [orderId], references: [id])
  participants ConversationParticipant[]
  messages    Message[]

  @@index([lastMessageAt(sort: Desc)])
}

model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String
  userId          String
  unreadCount     Int          @default(0)
  joinedAt        DateTime     @default(now())
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([conversationId, userId])
  @@index([userId])
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  senderId        String
  body            String   @db.Text
  type            String   @default("text") // text | image | file | system
  attachmentUrls  String[]
  sentAt          DateTime @default(now())
  delivered       Boolean  @default(true)
  readBy          String[] // user ids

  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender          User         @relation("MessageSender", fields: [senderId], references: [id])
  @@index([conversationId, sentAt(sort: Desc)])
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  kind        String   // 'order_placed' | 'message_received' | 'payment_released' | ...
  title       String
  body        String?
  icon        String?
  actorId     String?
  actionUrl   String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, read, createdAt(sort: Desc)])
}

// ============================================================
//  Payments / escrow / commission
// ============================================================

model PaymentMethod {
  id              String   @id @default(cuid())
  userId          String
  kind            String   // 'card' | 'bank' | 'paypal' | 'stripe-link'
  label           String
  last4           String?
  brand           String?
  isDefault       Boolean  @default(false)
  externalRef     String?   // tokenized id from PSP
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isDefault])
}

enum TransactionKind {
  CHARGE         // buyer paid us
  RELEASE        // we paid the freelancer
  REFUND
  PLATFORM_FEE
  DISPUTE_HOLD
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
}

model Transaction {
  id              String              @id @default(cuid())
  userId          String
  orderId         String?
  kind            TransactionKind
  amountCents     Int
  currency        String              @default("USD")
  feeCents        Int?
  description     String?
  status          TransactionStatus   @default(PENDING)
  externalRef     String?              // PSP id
  createdAt       DateTime            @default(now())
  completedAt     DateTime?

  user            User                @relation(fields: [userId], references: [id])
  order           Order?              @relation(fields: [orderId], references: [id])
  @@index([userId, createdAt(sort: Desc)])
  @@index([orderId])
}

// ============================================================
//  Marketplace integrations — Amazon / Flipkart / Myntra / Tata CLiQ
//  (per Dinesh: real-time sync of products, tech packs, AI imagery, stock)
// ============================================================

enum MarketplaceProvider {
  AMAZON
  FLIPKART
  MYNTRA
  TATA_CLIQ
  SHOPIFY
}

model MarketplaceConnection {
  id              String              @id @default(cuid())
  ownerId         String               // User.id (brand or factory)
  provider        MarketplaceProvider
  externalSellerId String
  // Encrypted credentials — store ciphertext only.
  accessToken     String              @db.Text
  refreshToken    String?             @db.Text
  expiresAt       DateTime?
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())

  syncJobs        MarketplaceSyncJob[]

  @@unique([ownerId, provider, externalSellerId])
  @@index([provider, isActive])
}

model MarketplaceSyncJob {
  id              String              @id @default(cuid())
  connectionId    String
  kind            String              // 'product-push' | 'stock-pull' | 'image-compliance' | 'order-pull'
  status          String              @default("queued") // queued | running | succeeded | failed
  attempts        Int                 @default(0)
  payload         Json?
  result          Json?
  error           String?             @db.Text
  scheduledAt     DateTime            @default(now())
  startedAt       DateTime?
  finishedAt      DateTime?

  connection      MarketplaceConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  @@index([connectionId, status])
  @@index([scheduledAt])
}
```

---

## Migration notes

1. **Run order:** Users → Services → BrandProfile/FactoryProfile/Freelancer →
   Packages → Briefs → Orders/Applications → Conversations → Transactions.
2. **Soft-delete:** prefer `status = DELETED` over physical delete on `User`,
   `Order`, `Brief` so audit / payment history stays intact.
3. **Money:** all amounts stored as `Int` cents. Never `Float`.
4. **Search:** for full-text on briefs/freelancer headlines, layer a
   `pg_trgm` GIN index on the relevant text columns at migration time.
5. **Approval gate:** matches what `shared/store.js` already enforces in
   the demo — `Freelancer.approvalStatus = PENDING` until admin reviews.
6. **Commission:** `Order.buyerFeeCents` + `Order.freelancerFeeCents` are
   computed at order time using the same constants as `api.fees`. Storing
   them on the row keeps history consistent if the rate changes.

## What this replaces

| Today (`shared/store.js`) | Tomorrow (Prisma) |
|---|---|
| `Store.getState().users[]` (localStorage) | `User` table |
| `Store.getState().freelancers[]` | `Freelancer` + `BrandProfile` + `FactoryProfile` |
| ad-hoc `payload` JSON | typed columns + JSON only for genuinely free-form fields |
| no real auth | `passwordHash` + session table (add when adopting NextAuth/Lucia) |

## What the client-side code needs to change

Almost nothing user-facing. `shared/api.js` is structured so each method
already looks like a future `fetch()` call. To swap, replace the body of
each `api.x.y()` with a `fetch('/api/x/y', …)` — the surface stays
identical and every page keeps working.
