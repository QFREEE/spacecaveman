CREATE TABLE location_credentials (
  id TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  scope TEXT NOT NULL CHECK(scope IN ('location:write','location:read','location:history','location:delete')),
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1))
);
CREATE TABLE location_history (
  id TEXT PRIMARY KEY,
  observed_at INTEGER NOT NULL UNIQUE,
  received_at INTEGER NOT NULL,
  credential_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL
);
CREATE INDEX location_history_time ON location_history(observed_at);
CREATE TABLE location_latest (
  id INTEGER PRIMARY KEY CHECK(id=1),
  observed_at INTEGER NOT NULL DEFAULT 0,
  received_at INTEGER NOT NULL DEFAULT 0,
  history_id TEXT,
  credential_id TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN ('in_nyc','not_in_nyc','unknown')),
  borough TEXT CHECK(borough IN ('manhattan','brooklyn','queens','bronx','staten_island')),
  expires_at INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0 CHECK(pending IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 0
);
INSERT INTO location_latest(id) VALUES(1);
CREATE TRIGGER revoke_location AFTER UPDATE OF revoked ON location_credentials WHEN NEW.revoked=1
BEGIN
  UPDATE location_latest SET history_id=NULL, status='unknown', borough=NULL, expires_at=0, pending=1, revision=revision+1 WHERE credential_id=NEW.id;
END;
CREATE TRIGGER delete_location_credential AFTER DELETE ON location_credentials
BEGIN
  UPDATE location_latest SET history_id=NULL, status='unknown', borough=NULL, expires_at=0, pending=1, revision=revision+1 WHERE credential_id=OLD.id;
END;
