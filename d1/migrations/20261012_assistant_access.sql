-- Apply once to an existing installation, before deploying the assistant routes.
-- Legacy assistant permissions were never safely consented; fresh approval is required.
-- Member accounts, sessions, profiles, and encrypted data are untouched.
-- Opt-in assistant identities. These never replace Pattern sessions or data keys.
CREATE TABLE IF NOT EXISTS identity_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  linked_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (issuer, subject)
);
ALTER TABLE identity_links ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
DROP TABLE IF EXISTS assistant_grants;
CREATE TABLE IF NOT EXISTS assistant_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL REFERENCES identity_links(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_name TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  authorization_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  UNIQUE (user_id, client_id)
);
CREATE TRIGGER IF NOT EXISTS assistant_unlink AFTER DELETE ON identity_links
BEGIN DELETE FROM assistant_grants WHERE user_id = OLD.user_id; END;
CREATE TRIGGER IF NOT EXISTS assistant_revoke_insert AFTER INSERT ON assistant_grants WHEN NEW.status = 'revoked'
BEGIN UPDATE identity_links SET revision = revision + 1 WHERE id = NEW.link_id; END;
CREATE TRIGGER IF NOT EXISTS assistant_revoke_update AFTER UPDATE OF status ON assistant_grants WHEN NEW.status = 'revoked'
BEGIN UPDATE identity_links SET revision = revision + 1 WHERE id = NEW.link_id; END;
