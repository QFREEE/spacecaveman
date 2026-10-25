import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { handleLocation, hashLocationSecret, publishLocation, rotateLocationKeys } from '../src/location.js';
import locationWorker from '../src/location-worker.js';
import publicWorker from '../src/worker.js';
import { classifyBorough } from '../src/borough.js';
import boundaries from '../src/data/nyc-boroughs.json' with { type: 'json' };

function database(sql) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(sql);
  const db = {
    prepare(query) {
      return { bind(...values) { return {
        first: async () => sqlite.prepare(query).get(...values) ?? null,
        all: async () => ({ results: sqlite.prepare(query).all(...values) }),
        run: async () => ({ meta: { changes: Number(sqlite.prepare(query).run(...values).changes) } }),
      }; },
      first: async () => sqlite.prepare(query).get() ?? null,
      all: async () => ({ results: sqlite.prepare(query).all() }),
      run: async () => ({ meta: { changes: Number(sqlite.prepare(query).run().changes) } }),
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, sqlite };
}

async function fixture(t) {
  const privateDb = database(readFileSync(new URL('../migrations/location-private/0001_location.sql', import.meta.url), 'utf8'));
  const publicDb = database(readFileSync(new URL('../migrations/0006_location_projection.sql', import.meta.url), 'utf8'));
  t.after(() => { privateDb.sqlite.close(); publicDb.sqlite.close(); });
  const now = Date.parse('2026-10-24T12:00:00Z');
  const keys = { v1: randomBytes(32).toString('base64url') };
  const tokens = {};
  for (const [i, scope] of ['write','read','history','delete'].entries()) {
    const id = (i + 1).toString().repeat(32), secret = String.fromCharCode(97 + i).repeat(43);
    tokens[scope] = `${id}.${secret}`;
    privateDb.sqlite.prepare('INSERT INTO location_credentials(id,digest,scope,expires_at) VALUES(?,?,?,?)')
      .run(id, await hashLocationSecret(secret), `location:${scope}`, now + 90 * 86400_000);
  }
  const env = { LOCATION_DB: privateDb.db, PUBLIC_PRESENCE_DB: publicDb.db, LOCATION_KEYS: JSON.stringify(keys), LOCATION_ACTIVE_KEY: 'v1', LOCATION_ACCESS_AUD: 'synthetic-audience' };
  const sample = (at = now, extra = {}) => ({ latitude: 40.75, longitude: -73.99, observed_at: new Date(at).toISOString(), ...extra });
  const request = (method, path, scope, body, at = now) => handleLocation(new Request(`https://private.example${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(tokens[scope] ? { Authorization: `Bearer ${tokens[scope]}` } : {}) },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }), env, at);
  return { ...privateDb, publicDb, now, keys, tokens, env, sample, request };
}

test('Access runtime context and application scopes are both required', async t => {
  const f = await fixture(t);
  const request = () => new Request('https://private.example/api/location', { method: 'POST', body: JSON.stringify(f.sample()), headers: { 'Content-Type': 'application/json', 'Cf-Access-Jwt-Assertion': 'untrusted', Authorization: `Bearer ${f.tokens.write}` } });
  for (const ctx of [undefined, {}, { access: { aud: 'wrong' } }]) assert.equal((await locationWorker.fetch(request(), f.env, ctx)).status, 403);
  assert.equal((await f.request('POST', '/api/location', 'read', f.sample())).status, 401);
  assert.equal((await f.request('GET', '/api/location/current', 'write')).status, 401);
  assert.equal((await f.request('GET', '/api/location/history', 'read')).status, 401);
  assert.equal((await f.request('DELETE', '/api/location/history', 'history', { before: new Date(f.now).toISOString() })).status, 401);
  const expired = f.now - 1;
  f.sqlite.prepare('UPDATE location_credentials SET expires_at=?').run(expired);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample())).status, 401);
});

test('coordinates are encrypted at SQL layer; current reads decrypt; public sees only derived status', async t => {
  const f = await fixture(t);
  assert.deepEqual(await (await f.request('POST', '/api/location', 'write', f.sample())).json(), { accepted: true });
  const stored = f.sqlite.prepare('SELECT * FROM location_history').get();
  assert.equal(stored.key_id, 'v1');
  assert.equal(Buffer.from(stored.iv, 'base64url').length, 12);
  assert.ok(!JSON.stringify(stored).includes('40.75'));
  assert.ok(!JSON.stringify(stored).includes('-73.99'));
  const current = await f.request('GET', '/api/location/current', 'read');
  assert.equal(current.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual((await current.json()).location, { ...f.sample(), accuracy_m: null });
  const publicEnv = { PRESENCE_DB: f.publicDb.db, PRESENCE_PUBLIC_READ: 'true', LOCATION_PUBLIC_READ: 'true' };
  t.mock.method(Date, 'now', () => f.now);
  const pub = await publicWorker.fetch(new Request('https://example.com/api/presence/public'), publicEnv);
  const body = await pub.json();
  assert.equal(body.status, 'in_nyc');
  assert.equal(body.borough, 'manhattan');
  assert.deepEqual(Object.keys(body).sort(), ['borough','expires_at','observed_at','status']);
  assert.equal((await publicWorker.fetch(new Request('https://example.com/api/presence'), publicEnv)).status, 410);
});

test('strict numeric input rejects location objects, extra fields and stale/future observations', async t => {
  const f = await fixture(t);
  const invalid = [null, [], {}, '{', f.sample(f.now, { latitude: '40.75' }), f.sample(f.now, { longitude: 181 }),
    f.sample(f.now, { latitude: -91 }), f.sample(f.now, { accuracy_m: -1 }), f.sample(f.now, { accuracy_m: '100' }),
    f.sample(f.now, { status: 'in_nyc' }), f.sample(f.now, { cord: 'address' }),
    f.sample(f.now, { observed_at: '2026-10-24T12:00:00' }), f.sample(f.now - 300001), f.sample(f.now + 60001)];
  for (const body of invalid) assert.equal((await f.request('POST', '/api/location', 'write', body)).status, 400);
  assert.equal((await f.request('POST', '/api/location', 'write', 'x'.repeat(1025))).status, 413);
  const rfc = f.sample(f.now, { observed_at: 'Sat, 24 Oct 2026 08:00:00 -0400', accuracy_m: 50 });
  assert.equal((await f.request('POST', '/api/location', 'write', rfc)).status, 200);
});

test('history retains accepted samples, rejects replays/rate bursts and encrypts repeated locations differently', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample())).status, 200);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(), f.now + 10_000)).status, 409);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(f.now + 1))).status, 409);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(f.now - 1), f.now + 10_000)).status, 409);
  const later = f.now + 10_000;
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(later), later)).status, 200);
  const rows = f.sqlite.prepare('SELECT * FROM location_history ORDER BY observed_at').all();
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].iv, rows[1].iv);
  assert.notEqual(rows[0].ciphertext, rows[1].ciphertext);
  const page1 = await (await f.request('GET', '/api/location/history?limit=1', 'history', undefined, later)).json();
  assert.equal(page1.locations.length, 1);
  assert.equal(page1.next_after, f.now);
  const page2 = await (await f.request('GET', `/api/location/export?after=${f.now}`, 'history', undefined, later)).json();
  assert.equal(page2.locations.length, 1);
  assert.equal(page2.locations[0].observed_at, new Date(later).toISOString());
  assert.equal(page2.next_after, null);
  assert.equal((await f.request('GET', '/api/location/history?limit=1000', 'history')).status, 400);
  assert.equal((await f.request('GET', '/api/location/history?from=2026-01-01T00:00:00Z', 'history')).status, 400);
});

test('tampered ciphertext, nonce and authenticated metadata fail closed without echoing private input', async t => {
  const f = await fixture(t);
  await f.request('POST', '/api/location', 'write', f.sample());
  const original = f.sqlite.prepare('SELECT * FROM location_history').get();
  for (const [column, value] of [['ciphertext', 'AAAA'], ['iv', 'AAAAAAAAAAAAAAAA'], ['received_at', f.now + 1], ['key_id', 'unknown']]) {
    f.sqlite.prepare(`UPDATE location_history SET ${column}=?`).run(value);
    const result = await f.request('GET', '/api/location/current', 'read');
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { error: 'Location temporarily unavailable' });
    f.sqlite.prepare(`UPDATE location_history SET ${column}=?`).run(original[column]);
  }
  f.env.LOCATION_KEYS = JSON.stringify({ v1: randomBytes(32).toString('base64url') });
  assert.equal((await f.request('GET', '/api/location/current', 'read')).status, 503);
});

test('missing encryption key prevents persistence and publication', async t => {
  const f = await fixture(t);
  delete f.env.LOCATION_KEYS;
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample())).status, 503);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM location_history').get().n, 0);
  assert.equal(f.publicDb.sqlite.prepare('SELECT count(*) AS n FROM location_public').get().n, 0);
});

test('durable publication retries without renewing lease and cannot overwrite a newer observation', async t => {
  const f = await fixture(t);
  const logs = [];
  t.mock.method(console, 'log', value => logs.push(value));
  const prepare = f.publicDb.db.prepare;
  f.publicDb.db.prepare = () => { throw new Error('synthetic database outage'); };
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample())).status, 200);
  assert.equal(f.sqlite.prepare('SELECT pending FROM location_latest').get().pending, 1);
  assert.deepEqual(logs, ['{"event":"location_publication_pending"}']);
  f.publicDb.db.prepare = prepare;
  await publishLocation(f.env);
  const first = { ...f.publicDb.sqlite.prepare('SELECT * FROM location_public').get() };
  assert.equal(first.expires_at, f.now + 6 * 3600_000);
  const later = f.now + 10_000;
  await f.request('POST', '/api/location', 'write', f.sample(later, { latitude: 42, longitude: -75 }), later);
  f.sqlite.prepare('UPDATE location_latest SET observed_at=?, revision=?, pending=1').run(first.observed_at, first.revision);
  await publishLocation(f.env);
  assert.equal(f.publicDb.sqlite.prepare('SELECT observed_at FROM location_public').get().observed_at, later);
});

test('expiry hides public borough but preserves private history; revocation clears current publication', async t => {
  const f = await fixture(t);
  await f.request('POST', '/api/location', 'write', f.sample());
  const at = f.now + 6 * 3600_000;
  const current = await (await f.request('GET', '/api/location/current', 'read', undefined, at)).json();
  assert.equal(current.stale, true);
  assert.equal(current.location.latitude, 40.75);
  t.mock.method(Date, 'now', () => at);
  const publicEnv = { PRESENCE_DB: f.publicDb.db, PRESENCE_PUBLIC_READ: 'true', LOCATION_PUBLIC_READ: 'true' };
  const expired = await (await publicWorker.fetch(new Request('https://example.com/api/presence/public'), publicEnv)).json();
  assert.equal(expired.status, 'unknown');
  assert.equal(expired.borough, null);
  f.sqlite.prepare("UPDATE location_credentials SET revoked=1 WHERE scope='location:write'").run();
  await publishLocation(f.env);
  assert.equal(f.publicDb.sqlite.prepare('SELECT status FROM location_public').get().status, 'unknown');
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(at), at)).status, 401);
  assert.deepEqual(await (await f.request('GET', '/api/location/current', 'read', undefined, at)).json(), { location: null });
  assert.equal((await (await f.request('GET', '/api/location/history', 'history', undefined, at)).json()).locations.length, 1);
});

test('private deletion preserves watermark, clears public status, and cannot be performed by a reader', async t => {
  const f = await fixture(t);
  await f.request('POST', '/api/location', 'write', f.sample());
  const body = { before: new Date(f.now).toISOString() };
  assert.equal((await f.request('DELETE', '/api/location/history', 'read', body)).status, 401);
  assert.deepEqual(await (await f.request('DELETE', '/api/location/history', 'delete', body)).json(), { deleted: 1 });
  assert.equal(f.publicDb.sqlite.prepare('SELECT status FROM location_public').get().status, 'unknown');
  assert.equal(f.sqlite.prepare('SELECT observed_at FROM location_latest').get().observed_at, f.now);
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample(), f.now + 10_000)).status, 409);
});

test('rotation re-encrypts retained history and decryption still works after removing the old key', async t => {
  const f = await fixture(t);
  await f.request('POST', '/api/location', 'write', f.sample());
  f.env.LOCATION_KEYS = JSON.stringify({ ...f.keys, v2: randomBytes(32).toString('base64url') });
  f.env.LOCATION_ACTIVE_KEY = 'v2';
  await rotateLocationKeys(f.env);
  assert.equal(f.sqlite.prepare('SELECT key_id FROM location_history').get().key_id, 'v2');
  const rotated = JSON.parse(f.env.LOCATION_KEYS);
  delete rotated.v1;
  f.env.LOCATION_KEYS = JSON.stringify(rotated);
  assert.equal((await (await f.request('GET', '/api/location/current', 'read')).json()).location.longitude, -73.99);
});

test('conditional credential recheck prevents a revocation between authentication and persistence', async t => {
  const f = await fixture(t);
  const batch = f.db.batch;
  f.db.batch = async statements => {
    f.sqlite.prepare("UPDATE location_credentials SET revoked=1 WHERE scope='location:write'").run();
    return batch(statements);
  };
  assert.equal((await f.request('POST', '/api/location', 'write', f.sample())).status, 409);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM location_history').get().n, 0);
});

test('official borough polygons classify all boroughs, outside points, and uncertainty near edges', () => {
  for (const [lat, lon, borough] of [[40.75,-73.99,'manhattan'],[40.67,-73.95,'brooklyn'],[40.73,-73.82,'queens'],[40.85,-73.86,'bronx'],[40.58,-74.15,'staten_island']]) {
    assert.deepEqual(classifyBorough(lat, lon, 10), { status: 'in_nyc', borough });
  }
  assert.deepEqual(classifyBorough(42,-75), { status: 'not_in_nyc', borough: null });
  assert.deepEqual(classifyBorough(40.75,-73.99,6000), { status: 'unknown', borough: null });
  const [lon, lat] = boundaries.features[0].coordinates[0][0][0];
  assert.equal(classifyBorough(lat,lon).status, 'unknown');
});

test('public configuration has no private database/key binding and private Worker has no public assets', () => {
  const site = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url)));
  const location = JSON.parse(readFileSync(new URL('../wrangler.location.jsonc', import.meta.url)));
  assert.ok(site.d1_databases.every(binding => binding.binding !== 'LOCATION_DB' && binding.database_name !== 'spacecaveman-location-private'));
  assert.equal(site.vars.LOCATION_KEYS, undefined);
  assert.equal(location.assets, undefined);
  assert.equal(location.workers_dev, false);
  assert.equal(location.preview_urls, false);
});
