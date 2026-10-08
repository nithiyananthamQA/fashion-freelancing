-- Mail that can be tried again, and enquiries that can be worked as a team.
--
-- outbound_email: a message that failed used to stay 'failed' forever, and one
-- written while no provider was configured stayed 'queued' forever — the only
-- way out was somebody copying it into their own mail client. `attempts` lets
-- the operations page send them again without hammering an address that keeps
-- bouncing (src/server/mail.ts gives up after a fixed number). `reply_to` is
-- kept per message because some have a natural one: an enquiry forwarded to
-- the team should be answered straight back to the person who wrote it.
--
-- leads: the contact forms never asked for a phone number, so "reply on
-- WhatsApp" had nothing to dial. The column is optional and filled only when a
-- form sends one. Internal notes get a table of their own rather than a text
-- column, so a second person picking the enquiry up reads who said what, and
-- when, instead of one paragraph that has been overwritten.

ALTER TABLE outbound_email ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE outbound_email ADD COLUMN reply_to TEXT;

ALTER TABLE leads ADD COLUMN phone TEXT;

CREATE TABLE lead_notes (
  id         TEXT PRIMARY KEY,
  lead_id    TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id, created_at);
