-- Only this sanitized projection is available to the public website.
CREATE TABLE location_public (
  id INTEGER PRIMARY KEY CHECK(id=1),
  status TEXT NOT NULL CHECK(status IN ('in_nyc','not_in_nyc','unknown')),
  borough TEXT CHECK(borough IN ('manhattan','brooklyn','queens','bronx','staten_island')),
  observed_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revision INTEGER NOT NULL
);
