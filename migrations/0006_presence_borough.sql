-- Keep only the latest coarse borough. Existing reports have no borough.
ALTER TABLE presence ADD COLUMN borough TEXT
  CHECK (borough IN ('manhattan', 'brooklyn', 'queens', 'bronx', 'staten_island', 'outside_nyc'));

DROP TRIGGER revoke_presence;
CREATE TRIGGER revoke_presence AFTER UPDATE OF revoked ON presence_credentials
WHEN NEW.revoked = 1
BEGIN
  UPDATE presence SET status = NULL, borough = NULL, expires_at = 0 WHERE credential_id = NEW.id;
END;

DROP TRIGGER delete_presence_credential;
CREATE TRIGGER delete_presence_credential AFTER DELETE ON presence_credentials
BEGIN
  UPDATE presence SET status = NULL, borough = NULL, expires_at = 0 WHERE credential_id = OLD.id;
END;
