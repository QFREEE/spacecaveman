import { getPlatformProxy, unstable_dev } from 'wrangler';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Entirely local workerd/D1 test. Never reads a real credential or encryption key.
const storage = await mkdtemp(join(tmpdir(), 'spacecaveman-location-smoke-'));
const configPath = resolve('wrangler.location.jsonc');
const id = 'e'.repeat(32), secret = 'f'.repeat(43);
const key = randomBytes(32).toString('base64url');
let worker;
let proxy;
try {
  proxy = await getPlatformProxy({ configPath, persist: { path: join(storage, 'v3') }, remoteBindings: false });
  const migration = async path => (await readFile(path, 'utf8')).replace(/^--.*$/gm, '').replace(/\n/g, ' ');
  await proxy.env.LOCATION_DB.exec(await migration('migrations/location-private/0001_location.sql'));
  await proxy.env.PUBLIC_PRESENCE_DB.exec(await migration('migrations/0006_location_projection.sql'));
  const expires = Date.now() + 86400_000;
  await proxy.env.LOCATION_DB.prepare('INSERT INTO location_credentials(id,digest,scope,expires_at) VALUES(?,?,?,?)')
    .bind(id, createHash('sha256').update(secret).digest('hex'), 'location:write', expires).run();
  await proxy.env.LOCATION_DB.prepare('INSERT INTO location_credentials(id,digest,scope,expires_at) VALUES(?,?,?,?)')
    .bind('a'.repeat(32), createHash('sha256').update('b'.repeat(43)).digest('hex'), 'location:read', expires).run();
  await proxy.dispose();
  proxy = null;
  worker = await unstable_dev('src/location-worker.js', {
    config: configPath, local: true, ip: '127.0.0.1', port: 0, persistTo: storage,
    vars: { LOCATION_KEYS: JSON.stringify({ v1: key }) }, logLevel: 'none',
    experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false },
  });
  const observed = new Date().toISOString();
  const result = await worker.fetch('/api/location', { method: 'POST', headers: { Authorization: `Bearer ${id}.${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude: 40.75, longitude: -73.99, observed_at: observed }) });
  assert.equal(result.status, 200, 'Local coordinate ingestion should succeed');
  assert.deepEqual(await result.json(), { accepted: true });
  const current = await worker.fetch('/api/location/current', { headers: { Authorization: `Bearer ${'a'.repeat(32)}.${'b'.repeat(43)}` } });
  assert.equal(current.status, 200);
  assert.equal((await current.json()).location.latitude, 40.75);
  await worker.stop();
  worker = null;
  proxy = await getPlatformProxy({ configPath, persist: { path: join(storage, 'v3') }, remoteBindings: false });
  const stored = await proxy.env.LOCATION_DB.prepare('SELECT * FROM location_history').first();
  assert.ok(stored.ciphertext && !JSON.stringify(stored).includes('40.75'));
  const publicRow = await proxy.env.PUBLIC_PRESENCE_DB.prepare('SELECT * FROM location_public').first();
  assert.equal(publicRow.borough, 'manhattan');
  console.log('Local workerd smoke passed: Access simulation, encrypted D1 ingestion/read and sanitized public publication.');
} finally {
  if (worker) await worker.stop();
  if (proxy) await proxy.dispose();
  // Verify the absolute generated target before recursively deleting local test state.
  if (dirname(resolve(storage)) !== resolve(tmpdir()) || !basename(storage).startsWith('spacecaveman-location-smoke-')) throw new Error('Unexpected temporary directory');
  await rm(storage, { recursive: true, force: true });
}
