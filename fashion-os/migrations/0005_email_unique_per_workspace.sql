-- Email must be unique per workspace, not globally.
--
-- Each visitor gets a private sandbox (see 0004), so two people reviewing the
-- site must both be able to sign up as "test@test.com" in their own. The
-- original table declared `email TEXT NOT NULL UNIQUE`, which is a global
-- constraint, so the second visitor got a 500 on sign-up.
--
-- SQLite cannot drop an inline column constraint, so the table is rebuilt.

PRAGMA defer_foreign_keys = true;

CREATE TABLE users_new (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL,
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
  updated_at        TEXT NOT NULL,
  tenant            TEXT NOT NULL DEFAULT 'public'
);

INSERT INTO users_new
  SELECT id, email, email_verified_at, password_hash, name, country, timezone, phone,
         phone_verified_at, is_admin, terms_accepted_at, status, created_at, updated_at, tenant
    FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- One account per email WITHIN a workspace; the same address may exist in many.
CREATE UNIQUE INDEX idx_users_email_tenant ON users(tenant, email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant);
