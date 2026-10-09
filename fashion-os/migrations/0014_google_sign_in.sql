-- Google sign-in (src/pages/sign-in/google/*, src/server/google.ts).
--
-- `google_sub` is Google's own id for the account. The email on a Google
-- account can change; the sub never does, so it is what a returning Google
-- sign-in is matched on. NULL for everyone who has never used Google — the
-- partial unique index lets any number of those coexist while no two accounts
-- can ever claim the same Google identity.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
