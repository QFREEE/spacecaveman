import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = process.argv[2] || 'http://127.0.0.1:8791';
if (!['http://127.0.0.1:8791', 'https://spacecaveman-presence-trial.spacecaveman.workers.dev'].includes(origin)) {
  throw new Error('Smoke tests are limited to the local or isolated trial Worker.');
}
const credentials = JSON.parse(await readFile(new URL('../.presence-private/credentials.json', import.meta.url), 'utf8'));
const endpoint = `${origin}/api/presence`;
const get = token => fetch(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
const post = (token, body) => fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
assert.equal((await get()).status, 401);
assert.equal((await get(credentials.write)).status, 401);
const body = { borough: 'outside_nyc', observed_at: new Date().toISOString() };
assert.equal((await post(credentials.read, body)).status, 401);
assert.equal((await post(credentials.write, { ...body, latitude: 0 })).status, 400);
const result = await post(credentials.write, body);
assert.equal(result.status, 200, 'Synthetic test report must be accepted');
assert.deepEqual(await result.json(), { accepted: true });
assert.equal((await post(credentials.write, body)).status, 409);
const read = await get(credentials.read);
assert.equal(read.status, 200);
assert.equal(read.headers.get('Cache-Control'), 'no-store');
const state = await read.json();
assert.equal(state.status, 'not_in_nyc');
assert.equal(state.borough, 'outside_nyc');
assert.equal(state.observed_at, body.observed_at);
assert.ok(Date.parse(state.expires_at) <= Date.parse(body.observed_at) + 6 * 3600_000);
for (const value of Object.values(credentials)) assert.ok(!JSON.stringify(state).includes(value));
const page = await fetch(`${origin}/presence.html`);
assert.equal(page.status, 200);
assert.ok(page.headers.get('Content-Security-Policy')?.includes("connect-src 'self'"));
assert.ok((await page.text()).includes('Read credential'));
console.log('Trial smoke checks passed: private reads, scoped writes, strict body, duplicate rejection, expiry, viewer headers.');
