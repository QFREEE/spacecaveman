import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import { existsSync } from 'node:fs';

test('retired setup URLs are gone and setup assets stay outside public/', async () => {
  for (const path of ['/shortcuts', '/shortcuts/', '/shortcuts.html', '/shortcuts.css']) {
    for (const method of ['GET', 'HEAD', 'POST']) {
      const response = await worker.fetch(new Request(`https://example.com${path}`, { method }));
      assert.equal(response.status, 410);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal(await response.text(), method === 'HEAD' ? '' : 'Gone');
    }
  }
  for (const name of ['shortcuts.html', 'shortcuts.css']) {
    assert.equal(existsSync(new URL(`../public/${name}`, import.meta.url)), false);
  }
});

test("visit endpoint explicitly identifies sample data and prevents caching", async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-21T12:00:00Z') });
  const response = await worker.fetch(new Request("https://example.com/api/visits"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const data = await response.json();
  assert.equal(data.demo, true);
  assert.equal(data.timeZone, "America/New_York");
  assert.ok(data.visits.length > 0);
  for (const visit of data.visits) {
    assert.ok(Date.parse(visit.end) > Date.parse(visit.start));
    assert.ok(["confirmed", "tentative"].includes(visit.status));
  }
});

test("expired sample visits disappear without breaking the endpoint", async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-01T12:00:00Z') });
  const response = await worker.fetch(new Request('https://example.com/api/visits'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).visits, []);
});

test("the demo never accepts meetup writes", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/visits", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("unknown API paths return JSON 404s", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/missing"));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});
