import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import {
  handlePublicPresence,
  cleanupPresence,
} from "../src/public-presence.js";
import worker from "../src/worker.js";

function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../migrations/0001_presence.sql", import.meta.url),
      "utf8",
    ),
  );
  const now = Date.parse("2026-10-22T12:00:00Z");
  sqlite
    .prepare(
      "INSERT INTO presence_credentials (id,digest,scope,expires_at) VALUES (?,?,?,?)",
    )
    .run("writer", "synthetic-digest", "presence:write", now + 90 * 86400_000);
  sqlite
    .prepare(
      "UPDATE presence SET status=?, observed_at=?, expires_at=?, credential_id=? WHERE id=1",
    )
    .run("in_nyc", now, now + 6 * 3600_000, "writer");
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            first: async () => sqlite.prepare(sql).get(...values) || null,
            run: async () => ({
              meta: {
                changes: Number(sqlite.prepare(sql).run(...values).changes),
              },
            }),
          };
        },
      };
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  };
  return {
    sqlite,
    now,
    env: { PRESENCE_DB: db, PRESENCE_PUBLIC_READ: "true" },
  };
}

test("public presence restores only coarse status, fails closed, and rejects writes", async (t) => {
  const f = fixture();
  t.after(() => f.sqlite.close());
  t.mock.method(Date, "now", () => f.now);
  const get = (env = f.env) =>
    worker.fetch(new Request("https://example.com/api/presence/public"), env);
  assert.equal((await get({})).status, 404);
  assert.equal((await get({ PRESENCE_PUBLIC_READ: "true" })).status, 503);
  const response = await get();
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), {
    status: "in_nyc",
    observed_at: new Date(f.now).toISOString(),
    expires_at: new Date(f.now + 6 * 3600_000).toISOString(),
  });
  assert.equal(
    (
      await worker.fetch(
        new Request("https://example.com/api/presence/public", {
          method: "POST",
        }),
        f.env,
      )
    ).status,
    405,
  );
  assert.equal(
    (await worker.fetch(new Request("https://example.com/api/presence"), f.env))
      .status,
    401,
  );
  f.sqlite.exec("UPDATE presence_credentials SET revoked=1");
  assert.equal((await (await get()).json()).status, "unknown");
  f.sqlite.exec("UPDATE presence_credentials SET revoked=0");
  assert.equal(
    (
      await (
        await handlePublicPresence(
          new Request("https://example.com"),
          f.env,
          f.now + 6 * 3600_000,
        )
      ).json()
    ).status,
    "unknown",
  );
  f.sqlite.prepare("UPDATE presence_credentials SET expires_at=?").run(f.now);
  assert.equal((await (await get()).json()).status, "unknown");
});

test("public reports expire and cleanup keeps the singleton without exposing old observations", async (t) => {
  const f = fixture();
  t.after(() => f.sqlite.close());
  const later = f.now + 30 * 86400_000;
  const response = await handlePublicPresence(
    new Request("https://example.com"),
    f.env,
    later,
  );
  assert.deepEqual(await response.json(), {
    status: "unknown",
    observed_at: null,
    expires_at: null,
  });
  await cleanupPresence(f.env, later);
  const row = f.sqlite
    .prepare("SELECT status, observed_at FROM presence WHERE id=1")
    .get();
  assert.equal(row.status, null);
  assert.equal(row.observed_at, 0);
});
