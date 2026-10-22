-- Widen care bounds and track the plant's New York calendar day.
CREATE TABLE site_flower_daily (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  rain INTEGER NOT NULL DEFAULT 0 CHECK (rain BETWEEN 0 AND 50),
  sun INTEGER NOT NULL DEFAULT 0 CHECK (sun BETWEEN 0 AND 50),
  love INTEGER NOT NULL DEFAULT 0 CHECK (love BETWEEN 0 AND 50),
  food INTEGER NOT NULL DEFAULT 0 CHECK (food BETWEEN 0 AND 50),
  updated_at INTEGER NOT NULL DEFAULT 0,
  bloomed_at INTEGER,
  generation INTEGER NOT NULL DEFAULT 1,
  log TEXT NOT NULL DEFAULT '[]',
  day_key TEXT NOT NULL DEFAULT ''
);
INSERT INTO site_flower_daily
  (id, rain, sun, love, food, updated_at, bloomed_at, generation, log)
SELECT id, rain, sun, love, food, updated_at, bloomed_at, generation, log
FROM site_flower;
DROP TABLE site_flower;
ALTER TABLE site_flower_daily RENAME TO site_flower;
