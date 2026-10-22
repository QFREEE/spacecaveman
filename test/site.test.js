import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";
import { handleFlower } from "../src/site.js";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  for (const name of ["0002_site_counter", "0003_shared_flower"]) {
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

test("shared flower validates care, cooldown, bounds, bloom and next-day replant in real SQL", async () => {
  const f = fixture();
  let now = 2_000_000;
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
  assert.equal((await first.json()).stats.rain, 1);
  const blocked = await care("rain");
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "2");
  assert.equal((await blocked.json()).stats.rain, 1);
  for (const action of [
    "rain",
    "rain",
    "sun",
    "sun",
    "sun",
    "love",
    "love",
    "love",
    "food",
    "food",
    "food",
  ]) {
    now += 2000;
    assert.equal((await care(action)).status, 200);
  }
  const bloom = await (await get()).json();
  assert.deepEqual(bloom.stats, { rain: 3, sun: 3, love: 3, food: 3 });
  assert.equal(bloom.log.length, 12);
  assert.equal(bloom.bloomed_at, new Date(now).toISOString());
  assert.equal(bloom.generation, 1);
  now += 86400_000 - 1;
  assert.equal((await care("rain")).status, 409);
  now++;
  const replanted = await (await care("sun")).json();
  assert.deepEqual(replanted.stats, { rain: 0, sun: 1, love: 0, food: 0 });
  assert.equal(replanted.generation, 2);
  assert.equal(replanted.bloomed_at, null);
  assert.deepEqual(replanted.log, ["sun"]);
  assert.equal((await (await get()).json()).generation, 2);
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
