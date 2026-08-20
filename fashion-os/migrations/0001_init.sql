-- ============================================================
-- Fashion Freelancing — specialist network schema
-- Covers every core data area in the plan, §11.
--
-- Conventions:
--   * ids are ULID-ish text (time-sortable) generated in the worker
--   * timestamps are ISO-8601 UTC text
--   * every status column is constrained to the lifecycle in §8 / §9
--   * one account can hold BOTH a company role and a freelancer profile (§3)
-- ============================================================

-- ---------- identity ----------
CREATE TABLE users (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  email_verified_at TEXT,
  password_hash     TEXT NOT NULL,
  name              TEXT NOT NULL,
  country           TEXT,
  timezone          TEXT,
  phone             TEXT,
  phone_verified_at TEXT,
  is_admin          INTEGER NOT NULL DEFAULT 0,
  terms_accepted_at TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','closed')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,          -- opaque, hashed before storage
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

-- Email verification and password reset share one table; `purpose` separates them.
CREATE TABLE auth_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_auth_tokens_lookup ON auth_tokens(token_hash);

-- ---------- companies ----------
CREATE TABLE companies (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  website    TEXT,
  country    TEXT,
  timezone   TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE company_members (
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  job_title  TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (company_id, user_id)
);
CREATE INDEX idx_company_members_user ON company_members(user_id);

-- ---------- taxonomy (§5) ----------
-- Seeded from src/data/taxonomy.ts by migration 0002 so the canonical list
-- lives in ONE place in code and is mirrored here for indexed querying.
CREATE TABLE service_categories (
  id       TEXT PRIMARY KEY,           -- slug, matches the ten service pages
  name     TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE service_specialties (
  id         TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL
);
CREATE INDEX idx_specialties_service ON service_specialties(service_id);

-- Skills and tools are controlled vocabularies with a reviewed custom path
-- (§5): a freelancer may add a value, it lands as status='pending' and only
-- becomes a public filter once an admin approves or merges it.
CREATE TABLE skills (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  service_id   TEXT REFERENCES service_categories(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'approved'
               CHECK (status IN ('approved','pending','merged','rejected')),
  merged_into  TEXT REFERENCES skills(id),
  created_by   TEXT REFERENCES users(id),
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_skills_service ON skills(service_id, status);
CREATE UNIQUE INDEX idx_skills_name ON skills(service_id, name);

CREATE TABLE tools (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  service_id   TEXT REFERENCES service_categories(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'approved'
               CHECK (status IN ('approved','pending','merged','rejected')),
  merged_into  TEXT REFERENCES tools(id),
  created_by   TEXT REFERENCES users(id),
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_tools_service ON tools(service_id, status);
CREATE UNIQUE INDEX idx_tools_name ON tools(service_id, name);

-- Website Development's conditional stack fields (§5.2). Kept generic so any
-- future service can declare a stack group without a schema change.
CREATE TABLE technology_stacks (
  id         TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  group_key  TEXT NOT NULL,             -- languages | frameworks | styling | databases | capabilities
  name       TEXT NOT NULL,
  applies_to TEXT,                      -- comma-separated role ids, NULL = all roles
  status     TEXT NOT NULL DEFAULT 'approved'
             CHECK (status IN ('approved','pending','merged','rejected')),
  merged_into TEXT REFERENCES technology_stacks(id),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_stacks_service ON technology_stacks(service_id, group_key, status);

-- ---------- specialist profiles (§8) ----------
CREATE TABLE specialist_profiles (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  handle            TEXT UNIQUE,        -- assigned at approval, public URL segment
  headline          TEXT,
  bio               TEXT,
  years_experience  INTEGER,
  languages         TEXT,               -- JSON array
  location          TEXT,
  timezone          TEXT,
  work_preference   TEXT,               -- JSON array: project | hourly | monthly
  availability      TEXT,               -- e.g. 'available_now' | 'in_2_weeks' | 'booked'
  capacity          TEXT,
  turnaround        TEXT,
  rate_min          INTEGER,
  rate_max          INTEGER,
  rate_currency     TEXT DEFAULT 'USD',
  rate_model        TEXT,               -- JSON array: fixed | hourly | day | retainer
  preferred_size    TEXT,
  work_location     TEXT,               -- remote | onsite | hybrid
  regions           TEXT,               -- JSON array
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','submitted','needs_changes','approved','paused')),
  wizard_step       INTEGER NOT NULL DEFAULT 1,
  submitted_at      TEXT,
  approved_at       TEXT,
  featured          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_profiles_status ON specialist_profiles(status);
CREATE INDEX idx_profiles_handle ON specialist_profiles(handle);

-- One row per service the specialist offers: one primary, up to two secondary.
CREATE TABLE specialist_service_offerings (
  id           TEXT PRIMARY KEY,
  profile_id   TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  service_id   TEXT NOT NULL REFERENCES service_categories(id),
  is_primary   INTEGER NOT NULL DEFAULT 0,
  role_key     TEXT,                    -- Website Development role (§5.2)
  specialties  TEXT NOT NULL DEFAULT '[]',  -- JSON array of specialty ids
  skill_ids    TEXT NOT NULL DEFAULT '[]',  -- JSON array of skill ids
  tool_ids     TEXT NOT NULL DEFAULT '[]',  -- JSON array of tool ids
  stack_ids    TEXT NOT NULL DEFAULT '[]',  -- JSON array of technology_stack ids
  created_at   TEXT NOT NULL,
  UNIQUE (profile_id, service_id)
);
CREATE INDEX idx_offerings_service ON specialist_service_offerings(service_id);

-- Denormalised search text, rebuilt on every profile save. §5.3 requires the
-- directory search to match structured fields, not just the biography.
CREATE TABLE specialist_search (
  profile_id  TEXT PRIMARY KEY REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  haystack    TEXT NOT NULL,
  services    TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL
);

CREATE TABLE portfolio_items (
  id            TEXT PRIMARY KEY,
  profile_id    TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  service_id    TEXT REFERENCES service_categories(id),
  specialty_id  TEXT REFERENCES service_specialties(id),
  contribution  TEXT NOT NULL,
  media_key     TEXT,                   -- R2 object key
  media_type    TEXT,
  external_url  TEXT,
  client_name   TEXT,                   -- only stored when permission is given
  has_permission INTEGER NOT NULL DEFAULT 0,
  moderation    TEXT NOT NULL DEFAULT 'pending'
                CHECK (moderation IN ('pending','approved','rejected')),
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_portfolio_profile ON portfolio_items(profile_id, position);

CREATE TABLE verification_reviews (
  id          TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  reviewer_id TEXT REFERENCES users(id),
  decision    TEXT NOT NULL CHECK (decision IN ('approved','needs_changes','rejected','paused')),
  notes       TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_reviews_profile ON verification_reviews(profile_id, created_at);

-- ---------- projects (§7) ----------
CREATE TABLE projects (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by     TEXT NOT NULL REFERENCES users(id),
  title          TEXT NOT NULL,
  service_id     TEXT NOT NULL REFERENCES service_categories(id),
  brief          TEXT NOT NULL,
  deliverables   TEXT,
  start_date     TEXT,
  deadline       TEXT,
  engagement     TEXT CHECK (engagement IN ('fixed','hourly','monthly')),
  budget_min     INTEGER,
  budget_max     INTEGER,
  currency       TEXT DEFAULT 'USD',
  nda_required   INTEGER NOT NULL DEFAULT 0,
  work_location  TEXT CHECK (work_location IN ('remote','onsite','hybrid')),
  visibility     TEXT NOT NULL DEFAULT 'matched'
                 CHECK (visibility IN ('private','invited','matched')),
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','submitted','published','responding',
                                   'shortlisted','hired','in_progress','delivered','completed','closed')),
  published_at   TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX idx_projects_company ON projects(company_id, status);
CREATE INDEX idx_projects_service ON projects(service_id, status, visibility);

CREATE TABLE project_requirements (
  project_id   TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  specialties  TEXT NOT NULL DEFAULT '[]',
  skill_ids    TEXT NOT NULL DEFAULT '[]',
  tool_ids     TEXT NOT NULL DEFAULT '[]',
  stack_ids    TEXT NOT NULL DEFAULT '[]',
  languages    TEXT NOT NULL DEFAULT '[]',
  min_experience INTEGER
);

CREATE TABLE project_invites (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  reason     TEXT,                      -- the explainable match reason (§9)
  status     TEXT NOT NULL DEFAULT 'sent'
             CHECK (status IN ('sent','viewed','declined','applied')),
  created_at TEXT NOT NULL,
  UNIQUE (project_id, profile_id)
);
CREATE INDEX idx_invites_profile ON project_invites(profile_id, status);

CREATE TABLE applications (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  pitch      TEXT NOT NULL,
  price      INTEGER,
  currency   TEXT DEFAULT 'USD',
  timeline   TEXT,
  status     TEXT NOT NULL DEFAULT 'submitted'
             CHECK (status IN ('submitted','shortlisted','declined','hired','withdrawn')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (project_id, profile_id)
);
CREATE INDEX idx_applications_project ON applications(project_id, status);
CREATE INDEX idx_applications_profile ON applications(profile_id, status);

-- ---------- direct hire requests (§6) ----------
CREATE TABLE hire_requests (
  id            TEXT PRIMARY KEY,
  company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by    TEXT NOT NULL REFERENCES users(id),
  profile_id    TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  service_id    TEXT NOT NULL REFERENCES service_categories(id),
  specialty_id  TEXT,
  brief         TEXT NOT NULL,
  deliverables  TEXT,
  start_date    TEXT,
  deadline      TEXT,
  engagement    TEXT CHECK (engagement IN ('fixed','hourly','monthly')),
  budget_min    INTEGER,
  budget_max    INTEGER,
  currency      TEXT DEFAULT 'USD',
  nda_required  INTEGER NOT NULL DEFAULT 0,
  work_location TEXT CHECK (work_location IN ('remote','onsite','hybrid')),
  visibility    TEXT NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private','invited','matched')),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','viewed','question','proposal',
                                  'accepted','declined','active','completed','closed')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_hire_company ON hire_requests(company_id, status);
CREATE INDEX idx_hire_profile ON hire_requests(profile_id, status);

CREATE TABLE engagements (
  id              TEXT PRIMARY KEY,
  company_id      TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id      TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
  hire_request_id TEXT REFERENCES hire_requests(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','delivered','revision','completed','closed','disputed')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX idx_engagements_company ON engagements(company_id, status);
CREATE INDEX idx_engagements_profile ON engagements(profile_id, status);

-- ---------- collaboration ----------
-- A thread hangs off exactly one of project / hire_request / engagement.
CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  hire_request_id TEXT REFERENCES hire_requests(id) ON DELETE CASCADE,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  engagement_id   TEXT REFERENCES engagements(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES users(id),
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_messages_hire ON messages(hire_request_id, created_at);
CREATE INDEX idx_messages_project ON messages(project_id, created_at);
CREATE INDEX idx_messages_engagement ON messages(engagement_id, created_at);

CREATE TABLE attachments (
  id              TEXT PRIMARY KEY,
  owner_id        TEXT NOT NULL REFERENCES users(id),
  hire_request_id TEXT REFERENCES hire_requests(id) ON DELETE CASCADE,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  engagement_id   TEXT REFERENCES engagements(id) ON DELETE CASCADE,
  message_id      TEXT REFERENCES messages(id) ON DELETE CASCADE,
  media_key       TEXT NOT NULL,        -- R2 object key, never a public URL
  filename        TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  scan_status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (scan_status IN ('pending','clean','blocked')),
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_attachments_project ON attachments(project_id);
CREATE INDEX idx_attachments_hire ON attachments(hire_request_id);

CREATE TABLE saved_specialists (
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  saved_by   TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (company_id, profile_id)
);

-- ---------- payments (§6 phase, kept minimal until Phase 6) ----------
CREATE TABLE payments (
  id            TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('invoice','payout')),
  amount        INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','due','paid','failed','refunded')),
  reference     TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_payments_engagement ON payments(engagement_id, kind);

-- ---------- operations ----------
CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  detail      TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at);

-- Fixed-window counters for sign-up, sign-in, inquiry and messaging routes (§13).
CREATE TABLE rate_limits (
  bucket      TEXT PRIMARY KEY,         -- '<route>:<identifier>:<window-start>'
  hits        INTEGER NOT NULL DEFAULT 0,
  expires_at  TEXT NOT NULL
);
CREATE INDEX idx_rate_limits_expiry ON rate_limits(expires_at);

-- Outbound mail is recorded whether or not a provider is configured, so
-- verification links are never lost in a local or unconfigured environment.
CREATE TABLE outbound_email (
  id         TEXT PRIMARY KEY,
  to_email   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'queued'
             CHECK (status IN ('queued','sent','failed')),
  error      TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_outbound_status ON outbound_email(status, created_at);

CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read_at     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at);
