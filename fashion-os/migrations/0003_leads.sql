-- Direct-service leads: the homepage form, the ten service-page forms and the
-- quote bot (plan §12.2, the last open Phase 1 item).
--
-- These were written to `localStorage` under 'ff_leads', which meant they never
-- left the visitor's own browser and nobody ever received them.

CREATE TABLE leads (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  company     TEXT,
  service     TEXT,                     -- service slug, or 'multiple'
  message     TEXT NOT NULL,
  timeline    TEXT,
  source      TEXT NOT NULL,            -- 'contact-form' | 'quote-bot'
  page        TEXT,                     -- where it was submitted from
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','contacted','quoted','won','lost')),
  ip          TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_leads_status ON leads(status, created_at);
