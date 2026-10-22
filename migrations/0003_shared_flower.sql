-- One shared plant; no visitor identities or individual activity records.
CREATE TABLE site_flower (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  rain INTEGER NOT NULL DEFAULT 0 CHECK (rain BETWEEN 0 AND 3),
  sun INTEGER NOT NULL DEFAULT 0 CHECK (sun BETWEEN 0 AND 3),
  love INTEGER NOT NULL DEFAULT 0 CHECK (love BETWEEN 0 AND 3),
  food INTEGER NOT NULL DEFAULT 0 CHECK (food BETWEEN 0 AND 3),
  updated_at INTEGER NOT NULL DEFAULT 0,
  bloomed_at INTEGER,
  generation INTEGER NOT NULL DEFAULT 1,
  log TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO site_flower (id) VALUES (1);
