-- Per-visitor sandboxes.
--
-- Everyone who opens the site gets their own private workspace, so a reviewer
-- can sign up as a freelancer, approve themselves as admin and hire themselves
-- as a company without ever seeing — or being seen by — anyone else.
--
-- 'public' is the shared demo content that everybody sees, so the directory is
-- never empty on a first visit. Anything a visitor creates carries their own
-- workspace id and is invisible to every other visitor.
--
-- Only root rows need the column: everything else (profiles, offerings,
-- projects, hire requests, applications) hangs off a user or a company by
-- foreign key, so filtering the roots filters the whole graph.

ALTER TABLE users     ADD COLUMN tenant TEXT NOT NULL DEFAULT 'public';
ALTER TABLE companies ADD COLUMN tenant TEXT NOT NULL DEFAULT 'public';
ALTER TABLE leads     ADD COLUMN tenant TEXT NOT NULL DEFAULT 'public';

CREATE INDEX idx_users_tenant     ON users(tenant);
CREATE INDEX idx_companies_tenant ON companies(tenant);
CREATE INDEX idx_leads_tenant     ON leads(tenant, status);
