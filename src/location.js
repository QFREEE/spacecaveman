import { timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { classifyBorough } from './borough.js';

const LEASE = 6 * 3600_000;
const DAY = 86400_000;
const jsonHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
export const locationReply = (value, status = 200, extra = {}) => Response.json(value, { status, headers: { ...jsonHeaders, ...extra } });
const unavailable = () => locationReply({ error: 'Location temporarily unavailable' }, 503);

export async function hashLocationSecret(value) {
  return Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('hex');
}

async function authenticate(request, db, scope, now) {
  const match = /^Bearer ([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization') ?? '');
  if (!match) return null;
  const row = await db.prepare('SELECT * FROM location_credentials WHERE id = ?').bind(match[1]).first();
  const actual = Buffer.from(await hashLocationSecret(match[2]));
  const expected = Buffer.from(row?.digest ?? '0'.repeat(64));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return row && row.scope === scope && !row.revoked && row.expires_at > now ? row : null;
}

const activeCredential = `EXISTS (SELECT 1 FROM location_credentials WHERE id = ? AND digest = ?
  AND scope = ? AND revoked = 0 AND expires_at > ?)`;
const authValues = (credential, now) => [credential.id, credential.digest, credential.scope, now];

async function bodyJson(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: locationReply({ error: 'Expected application/json' }, 415) };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: locationReply({ error: 'Expected JSON body' }, 400) };
  const parts = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1024) {
        await reader.cancel();
        return { error: locationReply({ error: 'Body too large' }, 413) };
      }
      parts.push(value);
    }
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(parts))) };
  } catch {
    return { error: locationReply({ error: 'Invalid JSON' }, 400) };
  } finally { reader.releaseLock(); }
}

function timestamp(value) {
  if (typeof value !== 'string') return NaN;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  const rfc = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} [+-](?:[01]\d|2[0-3])[0-5]\d$/;
  return iso.test(value) || rfc.test(value) ? Date.parse(value) : NaN;
}

function sampleInput(value, now) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value).sort().join(',');
  if (!['latitude,longitude,observed_at', 'accuracy_m,latitude,longitude,observed_at'].includes(keys)) return null;
  const { latitude, longitude } = value;
  const accuracy = value.accuracy_m ?? null;
  const observed = timestamp(value.observed_at);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
    (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100_000)) ||
    !Number.isFinite(observed) || observed < now - 300_000 || observed > now + 60_000) return null;
  return { latitude, longitude, accuracy_m: accuracy, observed_at: new Date(observed).toISOString() };
}

function keySettings(env) {
  const keys = JSON.parse(env.LOCATION_KEYS ?? 'null');
  const active = env.LOCATION_ACTIVE_KEY;
  if (!keys || Array.isArray(keys) || typeof keys !== 'object' || !/^[A-Za-z0-9_-]{1,32}$/.test(active ?? '') || !Object.hasOwn(keys, active)) {
    throw new Error('Invalid key configuration');
  }
  return { keys, active };
}

async function encryptionKey(settings, id) {
  const encoded = Object.hasOwn(settings.keys, id) ? settings.keys[id] : null;
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(encoded)) throw new Error('Missing encryption key');
  const raw = Buffer.from(encoded, 'base64url');
  if (raw.length !== 32) throw new Error('Invalid encryption key');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function aad(row) {
  return new TextEncoder().encode(JSON.stringify({ v: 1, id: row.id, observed_at: row.observed_at, received_at: row.received_at, credential_id: row.credential_id, key_id: row.key_id }));
}

async function encryptSample(sample, row, settings) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(settings, row.key_id);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(row), tagLength: 128 }, key, new TextEncoder().encode(JSON.stringify(sample)));
  return { iv: Buffer.from(iv).toString('base64url'), ciphertext: Buffer.from(ciphertext).toString('base64url') };
}

async function decryptSample(row, settings) {
  const key = await encryptionKey(settings, row.key_id);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(row.iv, 'base64url'), additionalData: aad(row), tagLength: 128 }, key, Buffer.from(row.ciphertext, 'base64url'));
  const sample = JSON.parse(new TextDecoder().decode(plaintext));
  // Reuse validation at the recorded instant, including range/type checks.
  const validated = sampleInput(sample, row.observed_at);
  if (!validated || timestamp(validated.observed_at) !== row.observed_at) throw new Error('Invalid encrypted observation');
  return validated;
}

export async function publishLocation(env) {
  const row = await env.LOCATION_DB.prepare('SELECT * FROM location_latest WHERE id = 1 AND pending = 1').first();
  if (!row) return;
  // A durable latest-only outbox. Cross-database publication is retryable, not atomic.
  await env.PUBLIC_PRESENCE_DB.prepare(`INSERT INTO location_public (id,status,borough,observed_at,expires_at,revision)
    VALUES(1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status, borough=excluded.borough,
    observed_at=excluded.observed_at, expires_at=excluded.expires_at, revision=excluded.revision
    WHERE excluded.observed_at > location_public.observed_at OR
      (excluded.observed_at = location_public.observed_at AND excluded.revision > location_public.revision)`)
    .bind(row.status, row.borough, row.observed_at, row.expires_at, row.revision).run();
  await env.LOCATION_DB.prepare('UPDATE location_latest SET pending=0 WHERE id=1 AND revision=?').bind(row.revision).run();
}

async function tryPublish(env) {
  try { await publishLocation(env); }
  catch { console.log(JSON.stringify({ event: 'location_publication_pending' })); }
}

async function ingest(request, env, credential, now) {
  const body = await bodyJson(request);
  if (body.error) return body.error;
  const sample = sampleInput(body.value, now);
  if (!sample) return locationReply({ error: 'Expected numeric latitude/longitude, observed_at with timezone, and optional nonnegative accuracy_m; observation must be fresh' }, 400);
  const settings = keySettings(env);
  const observed = timestamp(sample.observed_at);
  const row = { id: crypto.randomUUID(), observed_at: observed, received_at: now, credential_id: credential.id, key_id: settings.active };
  const encrypted = await encryptSample(sample, row, settings);
  const projection = classifyBorough(sample.latitude, sample.longitude, sample.accuracy_m);
  const expires = Math.min(observed + LEASE, credential.expires_at);
  const results = await env.LOCATION_DB.batch([
    env.LOCATION_DB.prepare(`UPDATE location_latest SET observed_at=?, received_at=?, history_id=?, credential_id=?,
      status=?, borough=?, expires_at=?, pending=1, revision=revision+1
      WHERE id=1 AND observed_at < ? AND received_at <= ? AND ${activeCredential}`)
      .bind(observed, now, row.id, credential.id, projection.status, projection.borough, expires, observed, now - 10_000, ...authValues(credential, now)),
    env.LOCATION_DB.prepare(`INSERT INTO location_history (id,observed_at,received_at,credential_id,key_id,iv,ciphertext)
      SELECT ?,?,?,?,?,?,? WHERE changes()=1`)
      .bind(row.id, observed, now, credential.id, row.key_id, encrypted.iv, encrypted.ciphertext),
  ]);
  if (results[0].meta.changes !== 1) return locationReply({ error: 'Duplicate, older, revoked or too frequent observation' }, 409);
  await tryPublish(env);
  return locationReply({ accepted: true });
}

async function current(env, credential, now) {
  const row = await env.LOCATION_DB.prepare(`SELECT h.*, l.expires_at FROM location_history h
    JOIN location_latest l ON l.history_id=h.id WHERE l.id=1 AND ${activeCredential}`)
    .bind(...authValues(credential, now)).first();
  if (!row) return locationReply({ location: null });
  return locationReply({ location: await decryptSample(row, keySettings(env)), stale: row.expires_at <= now, expires_at: new Date(row.expires_at).toISOString() });
}

function historyRange(url, now) {
  if ([...url.searchParams.keys()].some(key => !['from','to','after','limit'].includes(key))) return null;
  const to = url.searchParams.has('to') ? timestamp(url.searchParams.get('to')) : now;
  const from = url.searchParams.has('from') ? timestamp(url.searchParams.get('from')) : to - 31 * DAY;
  const after = url.searchParams.has('after') ? Number(url.searchParams.get('after')) : from - 1;
  const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 100;
  return Number.isFinite(from) && Number.isFinite(to) && from <= to && to - from <= 31 * DAY &&
    Number.isSafeInteger(after) && after >= from - 1 && after <= to && Number.isInteger(limit) && limit >= 1 && limit <= 100
    ? { from, to, after, limit } : null;
}

async function history(url, env, credential, now) {
  const range = historyRange(url, now);
  if (!range) return locationReply({ error: 'Use a date range of at most 31 days, an optional after cursor, and limit 1-100' }, 400);
  const result = await env.LOCATION_DB.prepare(`SELECT * FROM location_history WHERE observed_at >= ? AND observed_at <= ?
    AND observed_at > ? AND ${activeCredential} ORDER BY observed_at LIMIT ?`)
    .bind(range.from, range.to, range.after, ...authValues(credential, now), range.limit + 1).all();
  const rows = result.results.slice(0, range.limit);
  const settings = keySettings(env);
  const locations = await Promise.all(rows.map(row => decryptSample(row, settings)));
  return locationReply({ locations, next_after: result.results.length > range.limit ? rows.at(-1).observed_at : null });
}

async function removeHistory(request, env, credential, now) {
  const body = await bodyJson(request);
  if (body.error) return body.error;
  const value = body.value;
  const before = timestamp(value?.before);
  if (!value || Array.isArray(value) || Object.keys(value).join(',') !== 'before' || !Number.isFinite(before) || before > now + 60_000) {
    return locationReply({ error: 'Expected before with an explicit timezone, at or before now' }, 400);
  }
  const results = await env.LOCATION_DB.batch([
    env.LOCATION_DB.prepare(`DELETE FROM location_history WHERE observed_at <= ? AND ${activeCredential}`)
      .bind(before, ...authValues(credential, now)),
    env.LOCATION_DB.prepare(`UPDATE location_latest SET history_id=NULL, status='unknown', borough=NULL,
      expires_at=0, pending=1, revision=revision+1 WHERE id=1 AND observed_at <= ? AND ${activeCredential}`)
      .bind(before, ...authValues(credential, now)),
  ]);
  await tryPublish(env);
  return locationReply({ deleted: results[0].meta.changes });
}

export async function rotateLocationKeys(env, limit = 100) {
  const settings = keySettings(env);
  const { results } = await env.LOCATION_DB.prepare('SELECT * FROM location_history WHERE key_id != ? ORDER BY observed_at LIMIT ?').bind(settings.active, limit).all();
  for (const row of results) {
    const sample = await decryptSample(row, settings);
    const updated = { ...row, key_id: settings.active };
    const encrypted = await encryptSample(sample, updated, settings);
    await env.LOCATION_DB.prepare('UPDATE location_history SET key_id=?, iv=?, ciphertext=? WHERE id=? AND key_id=? AND ciphertext=?')
      .bind(settings.active, encrypted.iv, encrypted.ciphertext, row.id, row.key_id, row.ciphertext).run();
  }
}

export async function handleLocation(request, env, now = Date.now()) {
  const url = new URL(request.url);
  const route = {
    'POST /api/location': ['location:write', ingest],
    'GET /api/location/current': ['location:read', current],
    'GET /api/location/history': ['location:history', history],
    'GET /api/location/export': ['location:history', history],
    'DELETE /api/location/history': ['location:delete', removeHistory],
  }[`${request.method} ${url.pathname}`];
  if (!route) return locationReply({ error: 'Not found' }, 404);
  if (!env.LOCATION_DB || !env.PUBLIC_PRESENCE_DB) return unavailable();
  try {
    const credential = await authenticate(request, env.LOCATION_DB, route[0], now);
    if (!credential) return locationReply({ error: 'Unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
    if (route[1] === ingest) return await ingest(request, env, credential, now);
    if (route[1] === current) return await current(env, credential, now);
    if (route[1] === history) return await history(url, env, credential, now);
    return await removeHistory(request, env, credential, now);
  } catch {
    // Never include request bodies, URLs, auth headers, keys or exception messages.
    return unavailable();
  }
}
