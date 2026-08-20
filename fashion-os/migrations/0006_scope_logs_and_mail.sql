-- Give the audit log and the outbound email queue a workspace of their own.
--
-- Both were scoped indirectly by the admin page: audit rows by joining
-- `users` on actor_id, queued email by joining `users` on the address. Neither
-- holds. An audit row written with actor_id NULL (an anonymous enquiry) matched
-- every workspace, and because an email address is only unique per workspace,
-- the mail join matched every visitor who had used the same address — so one
-- reviewer could read another's verification and password-reset links.
--
-- Stamping the workspace at write time removes the reconstruction entirely.

ALTER TABLE audit_logs     ADD COLUMN tenant TEXT NOT NULL DEFAULT 'public';
ALTER TABLE outbound_email ADD COLUMN tenant TEXT NOT NULL DEFAULT 'public';

CREATE INDEX idx_audit_tenant ON audit_logs(tenant, created_at);
CREATE INDEX idx_mail_tenant  ON outbound_email(tenant, created_at);
