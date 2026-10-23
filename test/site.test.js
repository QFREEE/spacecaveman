import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import {
  handleFlower,
  handleVisitorCount,
  cleanupVisitorIdentifiers,
} from "../src/site.js";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const name of [
    "0002_site_counter",
    "0003_shared_flower",
    "0004_daily_flower",
    "0005_daily_visitors",
  ]) {
    sqlite.exec(
      readFileSync(
        new URL(`../migrations/${name}.sql`, import.meta.url),
        "utf8",
      ),
    );
  }
  const env = {
    PRESENCE_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              first: async () => sqlite.prepare(sql).get(...values) ?? null,
              run: async () => sqlite.prepare(sql).run(...values),
            };
          },
        };
      },
    },
  };
  const request = (path, method = "GET", origin = "https://example.com") =>
    new Request(`https://example.com/api/${path}`, {
      method,
      headers: {
        Origin: origin,
        "CF-Connecting-IP": "192.0.2.1",
        "User-Agent": "Test browser",
      },
    });
  return {
    env,
    sqlite,
    request,
    fetch: (path, method, origin) =>
      worker.fetch(request(path, method, origin), env),
  };
}

test("daily-flower migration preserves the old row while widening care bounds", () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../migrations/0003_shared_flower.sql", import.meta.url),
      "utf8",
    ),
  );
  sqlite.exec(
    "UPDATE site_flower SET rain = 3, generation = 4, log = '[\"rain\"]'",
  );
  sqlite.exec(
    readFileSync(
      new URL("../migrations/0004_daily_flower.sql", import.meta.url),
      "utf8",
    ),
  );
  const migrated = sqlite.prepare("SELECT * FROM site_flower").get();
  assert.equal(migrated.rain, 3);
  assert.equal(migrated.generation, 4);
  assert.equal(migrated.log, '["rain"]');
  assert.equal(migrated.day_key, "");
  sqlite.exec("UPDATE site_flower SET rain = 50");
  assert.throws(() => sqlite.exec("UPDATE site_flower SET sun = 51"), /CHECK/);
  sqlite.close();
});

test("counter starts at zero and increments atomically, reads do not increment", async () => {
  const f = fixture();
  assert.deepEqual(await (await f.fetch("visitors")).json(), { views: 0 });
  const counts = await Promise.all(
    Array.from({ length: 30 }, async (_, index) => {
      const request = f.request("visitors", "POST");
      request.headers.set("CF-Connecting-IP", `192.0.2.${index + 1}`);
      return (await (await worker.fetch(request, f.env)).json()).views;
    }),
  );
  assert.deepEqual(
    counts.every((count) => count >= 1 && count <= 30),
    true,
  );
  const read = await f.fetch("visitors");
  assert.equal(read.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await read.json(), { views: 30 });
  assert.equal(
    (await f.fetch("visitors", "POST", "https://other.com")).status,
    403,
  );
  assert.equal((await f.fetch("visitors", "DELETE")).status, 405);
  assert.equal((await f.fetch("visitors", "POST", "null")).status, 403);
  assert.deepEqual(await (await f.fetch("visitors")).json(), { views: 30 });
  f.sqlite.close();
});

test("refreshes and simultaneous loads from the same IP and browser count once per New York day", async () => {
  const f = fixture();
  const now = Date.parse("2026-10-23T23:59:59-04:00");
  const visit = (at = now) =>
    handleVisitorCount(f.request("visitors", "POST"), f.env, at);
  const counts = await Promise.all(
    Array.from(
      { length: 20 },
      async () => (await (await visit()).json()).views,
    ),
  );
  assert.deepEqual(counts, Array(20).fill(1));
  assert.deepEqual(await (await visit()).json(), { views: 1 });
  assert.deepEqual(await (await visit(now + 1000)).json(), { views: 2 });
  const otherBrowser = f.request("visitors", "POST");
  otherBrowser.headers.set("User-Agent", "Another browser");
  assert.deepEqual(
    await (await handleVisitorCount(otherBrowser, f.env, now + 1000)).json(),
    { views: 3 },
  );
  f.sqlite.close();
});

test("missing identity headers and spoofed forwarding lists do not increment the counter", async () => {
  const f = fixture();
  for (const header of ["CF-Connecting-IP", "User-Agent"]) {
    const request = f.request("visitors", "POST");
    request.headers.delete(header);
    request.headers.set("X-Forwarded-For", "198.51.100.9");
    assert.deepEqual(await (await worker.fetch(request, f.env)).json(), {
      views: 0,
    });
  }
  assert.equal(
    f.sqlite.prepare("SELECT COUNT(*) AS count FROM site_visitor_days").get()
      .count,
    0,
  );
  f.sqlite.close();
});

test("daily identifiers rotate and scheduled cleanup removes salts and hashes without losing the total", async () => {
  const f = fixture();
  // The migration must preserve a nonzero historical page-view baseline.
  f.sqlite.exec("UPDATE site_counter SET views = 42");
  const before = Date.parse("2026-11-01T00:30:00-04:00");
  const visit = (at) =>
    handleVisitorCount(f.request("visitors", "POST"), f.env, at);
  assert.deepEqual(await (await visit(before)).json(), { views: 43 });
  const first = f.sqlite.prepare("SELECT * FROM site_daily_visitors").get();
  const salt = f.sqlite
    .prepare("SELECT salt FROM site_visitor_days")
    .get().salt;
  // Both sides of the repeated DST hour belong to the same local day.
  assert.deepEqual(
    await (await visit(Date.parse("2026-11-01T01:30:00-05:00"))).json(),
    { views: 43 },
  );
  const next = Date.parse("2026-11-02T00:00:00-05:00");
  assert.deepEqual(await (await visit(next)).json(), { views: 44 });
  const identities = f.sqlite
    .prepare("SELECT * FROM site_daily_visitors ORDER BY day_key")
    .all();
  assert.equal(identities.length, 2);
  assert.match(first.visitor_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(identities[1].visitor_hash, first.visitor_hash);
  assert.notEqual(
    f.sqlite
      .prepare(
        "SELECT salt FROM site_visitor_days WHERE day_key = '2026-11-02'",
      )
      .get().salt,
    salt,
  );
  assert.deepEqual(Object.keys(first).sort(), ["day_key", "visitor_hash"]);
  await cleanupVisitorIdentifiers(f.env, next);
  assert.equal(
    f.sqlite.prepare("SELECT COUNT(*) AS count FROM site_daily_visitors").get()
      .count,
    1,
  );
  assert.equal(
    f.sqlite.prepare("SELECT COUNT(*) AS count FROM site_visitor_days").get()
      .count,
    1,
  );
  assert.deepEqual(await (await visit(next)).json(), { views: 44 });
  await cleanupVisitorIdentifiers(f.env, next + 86400_000);
  assert.equal(
    f.sqlite.prepare("SELECT COUNT(*) AS count FROM site_daily_visitors").get()
      .count,
    0,
  );
  assert.deepEqual(await (await f.fetch("visitors")).json(), { views: 44 });
  f.sqlite.close();
});

test("shared flower accepts rapid care while enforcing fifty-point bounds and bloom in real SQL", async () => {
  const f = fixture();
  let now = Date.parse("2026-10-22T12:00:00Z");
  const get = () => handleFlower(f.request("flower"), f.env, now);
  const care = (action) =>
    handleFlower(f.request(`flower?care=${action}`, "POST"), f.env, now);
  assert.equal((await get()).status, 200);
  assert.equal((await care("invalid")).status, 400);
  assert.equal(
    (
      await handleFlower(
        f.request("flower?care=rain", "POST", "https://other.com"),
        f.env,
        now,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleFlower(f.request("flower", "DELETE"), f.env, now)).status,
    405,
  );
  const first = await care("rain");
  assert.equal((await first.json()).stats.rain, 5);
  const rapid = await care("rain");
  assert.equal(rapid.status, 200);
  assert.equal((await rapid.json()).stats.rain, 10);
  for (const action of ["rain", "sun", "love", "food"].flatMap((id) =>
    Array(id === "rain" ? 8 : 10).fill(id),
  )) {
    assert.equal((await care(action)).status, 200);
  }
  const bloom = await (await get()).json();
  assert.deepEqual(bloom.stats, { rain: 50, sun: 50, love: 50, food: 50 });
  assert.equal(bloom.log.length, 12);
  assert.equal(bloom.bloomed_at, new Date(now).toISOString());
  assert.equal(bloom.generation, 1);
  now += 2000;
  assert.equal((await care("rain")).status, 409);
  assert.throws(
    () => f.sqlite.exec("UPDATE site_flower SET rain = 51"),
    /CHECK/,
  );
  now = Date.parse("2026-10-23T04:00:00Z");
  const replanted = await (await care("sun")).json();
  assert.deepEqual(replanted.stats, { rain: 0, sun: 5, love: 0, food: 0 });
  assert.equal(replanted.generation, 2);
  assert.equal(replanted.bloomed_at, null);
  assert.deepEqual(replanted.log, ["sun"]);
  assert.equal((await (await get()).json()).generation, 2);
  f.sqlite.close();
});

test("daily reset follows New York midnight including DST and resets unbloomed plants on reads", async () => {
  for (const midnight of [
    "2026-03-08T05:00:00Z",
    "2026-03-09T04:00:00Z",
    "2026-11-01T04:00:00Z",
    "2026-11-02T05:00:00Z",
  ]) {
    const f = fixture();
    const now = Date.parse(midnight);
    const get = (time) => handleFlower(f.request("flower"), f.env, time);
    await get(now - 3000);
    await handleFlower(
      f.request("flower?care=rain", "POST"),
      f.env,
      now - 2000,
    );
    assert.equal((await (await get(now - 1)).json()).stats.rain, 5);
    const reads = await Promise.all(Array.from({ length: 5 }, () => get(now)));
    for (const response of reads) {
      const plant = await response.json();
      assert.deepEqual(plant.stats, { rain: 0, sun: 0, love: 0, food: 0 });
      assert.equal(plant.generation, 2);
      assert.deepEqual(plant.log, []);
      assert.equal(plant.bloomed_at, null);
    }
    const requests = await Promise.all(
      ["rain", "sun"].map((care) =>
        handleFlower(f.request(`flower?care=${care}`, "POST"), f.env, now),
      ),
    );
    assert.deepEqual(
      requests.map((response) => response.status).sort(),
      [200, 200],
    );
    // A late previous-day request cannot undo the new day's care.
    assert.equal(
      (
        await handleFlower(
          f.request("flower?care=food", "POST"),
          f.env,
          now - 1,
        )
      ).status,
      409,
    );
    const current = await (await get(now + 1)).json();
    assert.equal(
      Object.values(current.stats).reduce((sum, value) => sum + value, 0),
      10,
    );
    assert.equal(current.generation, 2);
    f.sqlite.close();
  }
});

test("concurrent care fills a bar without losing increments or exceeding its cap", async () => {
  const f = fixture();
  const now = Date.parse("2026-10-22T12:00:00Z");
  const responses = await Promise.all(
    Array.from({ length: 60 }, () =>
      handleFlower(f.request("flower?care=rain", "POST"), f.env, now),
    ),
  );
  assert.equal(
    responses.filter((response) => response.status === 200).length,
    10,
  );
  assert.equal(
    responses.filter((response) => response.status === 409).length,
    50,
  );
  const plant = await (
    await handleFlower(f.request("flower"), f.env, now)
  ).json();
  assert.equal(plant.stats.rain, 50);
  assert.equal(plant.log.length, 10);
  f.sqlite.close();
});

test("a larger care step caps existing partial progress and records the bloom", async () => {
  const f = fixture();
  const now = Date.parse("2026-10-22T12:00:00Z");
  await handleFlower(f.request("flower"), f.env, now);
  f.sqlite.exec(
    "UPDATE site_flower SET rain = 48, sun = 50, love = 50, food = 50",
  );
  const response = await handleFlower(
    f.request("flower?care=rain", "POST"),
    f.env,
    now,
  );
  assert.equal(response.status, 200);
  const plant = await response.json();
  assert.equal(plant.stats.rain, 50);
  assert.equal(plant.bloomed_at, new Date(now).toISOString());
  assert.equal(
    (await handleFlower(f.request("flower?care=rain", "POST"), f.env, now))
      .status,
    409,
  );
  f.sqlite.close();
});

test("unconfigured and failed storage return unavailable rather than fake counts or progress", async () => {
  const f = fixture();
  for (const path of ["visitors", "flower"]) {
    for (const env of [
      {},
      {
        PRESENCE_DB: {
          prepare() {
            throw new Error("database offline");
          },
        },
      },
    ]) {
      const response = await worker.fetch(f.request(path), env);
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.equal((await response.json()).views, undefined);
    }
  }
  const body = new Request("https://example.com/api/flower?care=rain", {
    method: "POST",
    headers: { Origin: "https://example.com" },
    body: "unwanted",
  });
  assert.equal((await worker.fetch(body, f.env)).status, 400);
  f.sqlite.close();
});
