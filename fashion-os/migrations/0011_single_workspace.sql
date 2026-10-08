-- One workspace for the live site.
--
-- 0004 gave every browser a private sandbox, and that mode ran in production:
-- an account existed only in the browser that made it, a real freelancer was
-- invisible to every company, and admins (who live in 'public') never saw the
-- leads, people or applications they are there to moderate. The worker now
-- runs as a single workspace — every new row is stamped 'public' — unless
-- DEMO_SANDBOX=1 (src/server/tenant.ts).
--
-- This moves what the sandboxes already hold into 'public', so every existing
-- `tenant IN (?, 'public')` query sees it without a single query changing.
--
-- Only the five root tables carry the column (0004, 0006); profiles, projects,
-- hire requests, applications and the rest hang off a user or a company and
-- follow them. The only unique index involving `tenant` is
-- idx_users_email_tenant (0005), so `users` is the one table that needs care.
--
-- Safe to re-run: every statement only touches rows not yet in 'public'.

-- ---------- users ----------
-- The same address can exist in many sandboxes, but only once in 'public'.
-- Promote the most recently created account per address, and only when
-- 'public' does not already hold that address. The NOT EXISTS guard is what
-- makes this unable to fail on the unique index whichever order SQLite visits
-- the rows in: once one account for an address has moved, every other one
-- fails it. It compares `email` exactly as the index does (case-sensitive), so
-- the two can never disagree about what counts as a duplicate.
--
-- The accounts that lose stay in their sandbox. Sign-in, the directory and the
-- admin pages all read `tenant IN ('public', 'public')`, so they become
-- invisible and unreachable — nothing is deleted, and an admin can still merge
-- or remove them by hand.
UPDATE users
   SET tenant = 'public'
 WHERE tenant <> 'public'
   AND NOT EXISTS (
         SELECT 1 FROM users AS kept
          WHERE kept.tenant = 'public' AND kept.email = users.email
       )
   AND id = (
         SELECT newest.id FROM users AS newest
          WHERE newest.email = users.email AND newest.tenant <> 'public'
          ORDER BY newest.created_at DESC, newest.id DESC
          LIMIT 1
       );

-- A stranded account may still hold a live session from its old browser. Sign
-- it out, so the next sign-in lands on the account that survived instead of a
-- half-visible one whose profile no listing will show.
DELETE FROM sessions
 WHERE user_id IN (SELECT id FROM users WHERE tenant <> 'public');

-- ---------- everything else ----------
-- No uniqueness to respect: these just change hands.
UPDATE companies      SET tenant = 'public' WHERE tenant <> 'public';
UPDATE leads          SET tenant = 'public' WHERE tenant <> 'public';
UPDATE audit_logs     SET tenant = 'public' WHERE tenant <> 'public';
UPDATE outbound_email SET tenant = 'public' WHERE tenant <> 'public';
