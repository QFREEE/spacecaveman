import { timingSafeEqual } from 'node:crypto';

const LEASE = 6 * 60 * 60 * 1000;
const RETENTION = 30 * 24 * 60 * 60 * 1000;
const FRESHNESS = 5 * 60 * 1000;
const MIN_INTERVAL = 10 * 1000;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const reply = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });

function reportResponse(row, now) {
  if (!row?.status || row.observed_at <= now - RETENTION) {
    return reply({ status: 'unknown', observed_at: null, expires_at: null });
  }
  return reply({
    status: row.expires_at > now ? row.status : 'unknown',
    observed_at: new Date(row.observed_at).toISOString(),
    expires_at: new Date(row.expires_at).toISOString(),
  });
}

export async function cleanupPresence(env, now = Date.now()) {
  // Keep the singleton row so subsequent conditional updates can still succeed.
  await env.PRESENCE_DB.batch([
    env.PRESENCE_DB.prepare(`UPDATE presence SET status = NULL, observed_at = 0,
      expires_at = 0, received_at = 0, credential_id = NULL
      WHERE id = 1 AND observed_at <= ?`).bind(now - RETENTION),
    env.PRESENCE_DB.prepare('DELETE FROM presence_events WHERE expires_at <= ?').bind(now),
  ]);
}

export async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

// Explicitly enabled on the main site for the owner's public status badge.
export async function handlePublicPresence(request, env, now = Date.now()) {
  if (env?.PRESENCE_PUBLIC_READ !== 'true') return reply({ error: 'Not found' }, 404);
  if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
  if (!env.PRESENCE_DB) return reply({ error: 'Presence is not configured' }, 503);
  try {
    const row = await env.PRESENCE_DB.prepare(`SELECT p.status, p.observed_at, p.expires_at FROM presence p
      JOIN presence_credentials writer ON writer.id = p.credential_id
      WHERE p.id = 1 AND writer.revoked = 0 AND writer.expires_at > ?
      AND writer.scope = 'presence:write'`).bind(now).first();
    return reportResponse(row, now);
  } catch {
    return reply({ error: 'Presence temporarily unavailable' }, 503);
  }
}

async function authenticate(request, db, scope, now) {
  const match = /^Bearer ([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization') || '');
  if (!match) return null;
  const credential = await db.prepare('SELECT * FROM presence_credentials WHERE id = ?').bind(match[1]).first();
  const actual = new TextEncoder().encode(await digest(match[2]));
  const expected = new TextEncoder().encode(credential?.digest || '0'.repeat(64));
  if (expected.length !== 64 || !timingSafeEqual(actual, expected)) return null;
  if (!credential || credential.scope !== scope || credential.revoked || credential.expires_at <= now) return null;
  return credential;
}

async function readBody(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: reply({ error: 'Expected application/json' }, 415) };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: reply({ error: 'Expected JSON body' }, 400) };
  let size = 0;
  const chunks = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) {
        await reader.cancel();
        return { error: reply({ error: 'Body too large' }, 413) };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { error: reply({ error: 'Invalid JSON' }, 400) };
  } finally { reader.releaseLock(); }
}

export async function handlePresence(request, env, now = Date.now()) {
  if (!['POST', 'GET'].includes(request.method)) {
    return reply({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  }
  if (!env?.PRESENCE_DB) return reply({ error: 'Presence is not configured' }, 503);
  try {
    // Direct binding queries target the primary; no replica/session cache for auth.
    const db = env.PRESENCE_DB;
    const scope = request.method === 'POST' ? 'presence:write' : 'presence:read';
    const credential = await authenticate(request, db, scope, now);
    if (!credential) return reply({ error: 'Unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
    if (request.method === 'GET') {
      const row = await db.prepare(`SELECT p.* FROM presence p
        JOIN presence_credentials writer ON writer.id = p.credential_id
        WHERE p.id = 1 AND writer.revoked = 0 AND writer.expires_at > ?
        AND writer.scope = 'presence:write'
        AND EXISTS (SELECT 1 FROM presence_credentials WHERE id = ?
          AND revoked = 0 AND expires_at > ? AND scope = 'presence:read')`)
        .bind(now, credential.id, now).first();
      if (!row?.status || row.expires_at <= now) return reply({ status: 'unknown', observed_at: null, expires_at: null });
      return reply({ status: row.status, observed_at: new Date(row.observed_at).toISOString(), expires_at: new Date(row.expires_at).toISOString() });
    }
    const body = await readBody(request);
    if (body.error) return body.error;
    const event = body.value;
    if (!event || Array.isArray(event) || typeof event !== 'object' ||
        Object.keys(event).sort().join(',') !== 'event_id,observed_at,status' ||
        !['in_nyc', 'not_in_nyc', 'unknown'].includes(event.status) ||
        typeof event.event_id !== 'string' || !/^[A-Za-z0-9_.:+-]{1,128}$/.test(event.event_id) ||
        typeof event.observed_at !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(event.observed_at)) {
      return reply({ error: 'Expected only status, observed_at and event_id' }, 400);
    }
    const observed = Date.parse(event.observed_at);
    if (!Number.isFinite(observed) || observed < now - FRESHNESS || observed > now + 60_000) {
      return reply({ error: 'Observation must be fresh and include its time zone' }, 400);
    }
    const eventDigest = await digest(event.event_id);
    const expires = Math.min(observed + LEASE, credential.expires_at);
    const results = await db.batch([
      db.prepare('DELETE FROM presence_events WHERE expires_at <= ?').bind(now),
      db.prepare(`UPDATE presence SET status = ?, observed_at = ?, expires_at = ?, received_at = ?, credential_id = ?
        WHERE id = 1 AND observed_at < ? AND received_at <= ?
        AND NOT EXISTS (SELECT 1 FROM presence_events WHERE digest = ?)
        AND EXISTS (SELECT 1 FROM presence_credentials WHERE id = ? AND digest = ?
          AND scope = 'presence:write' AND revoked = 0 AND expires_at > ?)`)
        // Clearing visibility retains the observation watermark: a delayed arrival
        // must not restore a status that the owner has just cleared.
        .bind(event.status === 'unknown' ? null : event.status, observed, expires, now, credential.id, observed, now - MIN_INTERVAL,
          eventDigest, credential.id, credential.digest, now),
      db.prepare('INSERT INTO presence_events (digest, expires_at) SELECT ?, ? WHERE changes() = 1')
        .bind(eventDigest, now + FRESHNESS + 60_000),
    ]);
    if (results[1].meta.changes !== 1) {
      return reply({ error: 'Duplicate, older, revoked, or too frequent update; wait 10 seconds and make a fresh observation' }, 409);
    }
    return reply({ accepted: true });
  } catch {
    // Never log requests, credentials, IP metadata, or database error details.
    return reply({ error: 'Presence temporarily unavailable' }, 503);
  }
}
