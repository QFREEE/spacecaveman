import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { handleFlower } from "../src/site.js";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  for (const name of [
    "0002_site_counter",
    "0003_shared_flower",
    "0004_daily_flower",
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
            };
          },
        };
      },
    },
  };
  const request = (path, method = "GET", origin = "https://example.com") =>
    new Request(`https://example.com/api/${path}`, {
      method,
      headers: { Origin: origin },
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
    Array.from(
      { length: 30 },
      async () => (await (await f.fetch("visitors", "POST")).json()).views,
    ),
  );
  assert.deepEqual(
    counts.sort((a, b) => a - b),
    Array.from({ length: 30 }, (_, i) => i + 1),
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
