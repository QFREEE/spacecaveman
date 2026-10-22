-- Page loads since this feature launched. No sample baseline or visitor records.
CREATE TABLE site_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0)
);
INSERT INTO site_counter (id) VALUES (1);
