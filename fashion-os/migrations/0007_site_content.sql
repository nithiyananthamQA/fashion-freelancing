-- Content editors.
--
-- The owner wants to change what the marketing pages say — headings, copy,
-- images — from the dashboard, and to hand that job to someone who can do
-- nothing else there. That is a role, not admin: `is_admin` stays the switch
-- for moderation, enquiries and people, and `role = 'editor'` opens only
-- /workspace/content.
--
-- The pages themselves stay the source of their default text: a row here is
-- an override for one keyed element on one page, and deleting the row puts
-- the original back. History keeps every change so any of them can be undone.

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'editor'));

CREATE TABLE site_content (
  page        TEXT NOT NULL,            -- '/', '/pages/services/tech-pack', …
  key         TEXT NOT NULL,            -- the element's data-cms key
  kind        TEXT NOT NULL             -- what the value is
              CHECK (kind IN ('text', 'html', 'image', 'attr')),
  value       TEXT NOT NULL,
  updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (page, key)
);

CREATE TABLE site_content_history (
  id          TEXT PRIMARY KEY,
  page        TEXT NOT NULL,
  key         TEXT NOT NULL,
  old_value   TEXT,                     -- NULL: it was the page's own text
  new_value   TEXT,                     -- NULL: reset to the page's own text
  changed_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TEXT NOT NULL
);
CREATE INDEX idx_site_history ON site_content_history(page, key, changed_at);
