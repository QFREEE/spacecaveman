-- Keep the existing aggregate as the historical page-view baseline.
-- Raw IP addresses and User-Agent strings are never stored.
CREATE TABLE site_visitor_days (
  day_key TEXT PRIMARY KEY,
  salt TEXT NOT NULL
);

CREATE TABLE site_daily_visitors (
  day_key TEXT NOT NULL REFERENCES site_visitor_days(day_key) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  PRIMARY KEY (day_key, visitor_hash)
);

-- A duplicate insert cannot increment the total, even across concurrent requests.
CREATE TRIGGER site_count_new_daily_visitor
AFTER INSERT ON site_daily_visitors
BEGIN
  UPDATE site_counter SET views = views + 1 WHERE id = 1;
END;
