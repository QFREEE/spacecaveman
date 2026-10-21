import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handlePresence, digest } from '../src/presence.js';

// Execute real schema, conditional SQL and triggers in SQLite, using D1's API shape.
async function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_presence.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      return { bind(...values) {
        return {
          first: async () => sqlite.prepare(sql).get(...values) || null,
          run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }),
        };
      } };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const now = Date.parse('2026-10-20T19:00:00-04:00');
  const tokens = {};
  for (const [scope, id, secret] of [['write', 'a'.repeat(32), 'b'.repeat(43)], ['read', 'c'.repeat(32), 'd'.repeat(43)]]) {
    tokens[scope] = `${id}.${secret}`;
    sqlite.prepare('INSERT INTO presence_credentials (id,digest,scope,expires_at) VALUES (?,?,?,?)')
      .run(id, await digest(secret), `presence:${scope}`, now + 90 * 86400_000);
  }
  const env = { PRESENCE_DB: db };
  const event = (overrides = {}) => ({ status: 'in_nyc', observed_at: new Date(now).toISOString(), event_id: 'arrival-1', ...overrides });
  const request = (method, token, body, at = now, contentType = 'application/json') => handlePresence(new Request('https://example.com/api/presence', {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': contentType },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }), env, at);
  return { sqlite, db, now, tokens, env, event, request };
}

test('presence fails closed and separates read/write credentials', async () => {
  const f = await fixture();
  assert.equal((await handlePresence(new Request('https://example.com/api/presence'), {})).status, 503);
  for (const token of [null, 'invalid', f.tokens.read.replace(/d/g, 'e'), f.tokens.write]) {
    assert.equal((await f.request('GET', token)).status, 401);
  }
  assert.equal((await f.request('POST', f.tokens.read, f.event())).status, 401);
  assert.equal((await f.request('DELETE', f.tokens.write)).status, 405);
  f.sqlite.prepare('UPDATE presence_credentials SET expires_at = ?').run(f.now);
  assert.equal((await f.request('POST', f.tokens.write, f.event())).status, 401);
});

test('stores normalized status privately, acknowledges only, expires at lease edge', async () => {
  const f = await fixture();
  assert.equal((await f.request('GET', f.tokens.read)).headers.get('Cache-Control'), 'no-store');
  assert.equal((await (await f.request('GET', f.tokens.read)).json()).status, 'unknown');
  const response = await f.request('POST', f.tokens.write, f.event({ observed_at: '2026-10-20T19:00:00-04:00' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accepted: true });
  const state = await (await f.request('GET', f.tokens.read)).json();
  assert.deepEqual(state, { status: 'in_nyc', observed_at: '2026-10-20T23:00:00.000Z', expires_at: '2026-10-21T05:00:00.000Z' });
  assert.equal((await (await f.request('GET', f.tokens.read, null, f.now + 6 * 3600_000)).json()).status, 'unknown');
});

test('rejects bad bodies, GPS fields, stale/future observations and oversized streams', async () => {
  const f = await fixture();
  for (const body of [null, [], {}, '{', f.event({ latitude: 1 }), f.event({ status: 'home' }), f.event({ event_id: '' }),
    f.event({ observed_at: '2026-10-20T19:00:00' }), f.event({ observed_at: new Date(f.now - 300001).toISOString() }),
    f.event({ observed_at: new Date(f.now + 60001).toISOString() })]) {
    assert.equal((await f.request('POST', f.tokens.write, body)).status, 400);
  }
  assert.equal((await f.request('POST', f.tokens.write, 'x'.repeat(1025))).status, 413);
  assert.equal((await f.request('POST', f.tokens.write, f.event(), f.now, 'text/plain')).status, 415);
});

test('duplicates, reused IDs, rate bursts, equal/conflicting and old events never renew or reorder status', async () => {
  const f = await fixture();
  assert.equal((await f.request('POST', f.tokens.write, f.event())).status, 200);
  const before = f.sqlite.prepare('SELECT * FROM presence').get();
  for (const body of [f.event(), f.event({ status: 'not_in_nyc' }), f.event({ event_id: 'burst', observed_at: new Date(f.now + 1).toISOString() })]) {
    assert.equal((await f.request('POST', f.tokens.write, body)).status, 409);
  }
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM presence').get(), before);
  const later = f.now + 10_000;
  assert.equal((await f.request('POST', f.tokens.write, f.event({ observed_at: new Date(later).toISOString() }), later)).status, 409);
  const departure = f.event({ status: 'not_in_nyc', event_id: 'departure', observed_at: new Date(later).toISOString() });
  assert.equal((await f.request('POST', f.tokens.write, departure, later)).status, 200);
  assert.equal((await f.request('POST', f.tokens.write, f.event({ event_id: 'old' }), later + 10_000)).status, 409);
  assert.equal((await (await f.request('GET', f.tokens.read, null, later)).json()).status, 'not_in_nyc');
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM presence_events').get().total, 2);
});

test('revocation clears status and a revocation between auth and write prevents commit', async () => {
  const f = await fixture();
  await f.request('POST', f.tokens.write, f.event());
  f.sqlite.prepare("UPDATE presence_credentials SET revoked = 1 WHERE scope = 'presence:write'").run();
  assert.equal((await (await f.request('GET', f.tokens.read)).json()).status, 'unknown');
  assert.equal((await f.request('POST', f.tokens.write, f.event())).status, 401);
  const g = await fixture();
  const batch = g.db.batch.bind(g.db);
  g.db.batch = async statements => {
    g.sqlite.prepare("UPDATE presence_credentials SET revoked = 1 WHERE scope = 'presence:write'").run();
    return batch(statements);
  };
  assert.equal((await g.request('POST', g.tokens.write, g.event())).status, 409);
  assert.equal(g.sqlite.prepare('SELECT status FROM presence').get().status, null);
});

test('writer expiry bounds lease and deletion invalidates stored presence', async () => {
  const f = await fixture();
  f.sqlite.prepare("UPDATE presence_credentials SET expires_at = ? WHERE scope = 'presence:write'").run(f.now + 1000);
  await f.request('POST', f.tokens.write, f.event());
  assert.equal((await (await f.request('GET', f.tokens.read, null, f.now + 1000)).json()).status, 'unknown');
  f.sqlite.prepare("DELETE FROM presence_credentials WHERE scope = 'presence:write'").run();
  assert.equal(f.sqlite.prepare('SELECT status FROM presence').get().status, null);
});
