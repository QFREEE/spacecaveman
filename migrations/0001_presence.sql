CREATE TABLE presence_credentials (
  id TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('presence:write', 'presence:read')),
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1))
);
CREATE TABLE presence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT CHECK (status IN ('in_nyc', 'not_in_nyc')),
  observed_at INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL DEFAULT 0,
  received_at INTEGER NOT NULL DEFAULT 0,
  credential_id TEXT
);
INSERT INTO presence (id) VALUES (1);
-- Short-lived deduplication hashes, not a travel history.
CREATE TABLE presence_events (digest TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX presence_events_expiry ON presence_events (expires_at);
-- Preserve the ordering watermark while invalidating this token's status.
CREATE TRIGGER revoke_presence AFTER UPDATE OF revoked ON presence_credentials
WHEN NEW.revoked = 1
BEGIN
  UPDATE presence SET status = NULL, expires_at = 0 WHERE credential_id = NEW.id;
END;
CREATE TRIGGER delete_presence_credential AFTER DELETE ON presence_credentials
BEGIN
  UPDATE presence SET status = NULL, expires_at = 0 WHERE credential_id = OLD.id;
END;
