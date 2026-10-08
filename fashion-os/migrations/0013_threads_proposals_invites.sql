-- Conversations on a reply, a price on a request to hire, and invitations to a
-- company account.
--
-- 1. A reply to a project gets its own thread (plan §15: "a company can post a
--    project, receive applications, shortlist, message, and hire"). 0001 lets a
--    message hang off a project, but a project has many repliers and the row
--    names only the sender — a company's answer to one specialist would have
--    been read by every other one. The thread is the reply itself, so the
--    message carries the application it belongs to. `project_id` is still
--    written alongside, so the existing project index keeps working.
--
-- 2. A specialist can answer a request to hire with a price (§6.4, "Send a
--    proposal"). The figure has to survive as a figure — the company accepts
--    it, and the work page shows what was agreed — so it lives on the request
--    rather than only inside a message.
--
-- 3. A company owner can invite a colleague by email before that person has an
--    account. The invitation waits here until they sign up with that address,
--    and is picked up the first time they open the company workspace.

-- ---------- 1. reply threads ----------
ALTER TABLE messages ADD COLUMN application_id TEXT REFERENCES applications(id) ON DELETE CASCADE;
CREATE INDEX idx_messages_application ON messages(application_id, created_at);

-- Delivered files hang off the work and the hand-over message; both are read
-- by those columns, and 0001 indexed only the project and request ones.
CREATE INDEX idx_attachments_engagement ON attachments(engagement_id);
CREATE INDEX idx_attachments_message ON attachments(message_id);

-- ---------- 2. a price on a request ----------
ALTER TABLE hire_requests ADD COLUMN proposal_amount   INTEGER;
ALTER TABLE hire_requests ADD COLUMN proposal_currency TEXT;
ALTER TABLE hire_requests ADD COLUMN proposal_timeline TEXT;
ALTER TABLE hire_requests ADD COLUMN proposed_at       TEXT;

-- ---------- 3. invitations to a company ----------
-- One open invitation per address per company: inviting the same person again
-- refreshes the row (and re-sends the email) instead of stacking duplicates.
-- The emailed link carries a token, stored hashed like every other token: the
-- click proves the person owns the invited address, so they join on arrival
-- without first waiting on a separate confirmation email.
CREATE TABLE company_invites (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,            -- lower-cased, as users.email is
  invited_by  TEXT NOT NULL REFERENCES users(id),
  token_hash  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  accepted_at TEXT,
  UNIQUE (company_id, email)
);
CREATE INDEX idx_company_invites_email ON company_invites(email, accepted_at);
