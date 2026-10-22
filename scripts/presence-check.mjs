import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Read-only diagnostic. Do not replace this with the synthetic-write smoke test
// after the owner starts using the phone. Never print credentials or HTTP errors.
const credentialsPath = process.argv.slice(2).filter(value => value !== '--')[0] || '.presence-private/credentials.json';
const endpoint = 'https://spacecaveman-presence-trial.spacecaveman.workers.dev/api/presence';
try {
  const credentials = JSON.parse(await readFile(resolve(credentialsPath), 'utf8'));
  if (!/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(credentials.read || '')) {
    throw new Error('Invalid credential bundle');
  }
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${credentials.read}` },
    redirect: 'error', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.log(JSON.stringify({ endpoint, http: response.status, result: 'Read failed; check credential expiry or revocation.' }));
    process.exitCode = 1;
  } else {
    const state = await response.json();
    const valid = ['in_nyc', 'not_in_nyc', 'unknown'].includes(state.status);
    const active = state.status !== 'unknown';
    const observed = Date.parse(state.observed_at);
    const expires = Date.parse(state.expires_at);
    if (!valid || (active && (!Number.isFinite(observed) || !Number.isFinite(expires) || expires <= Date.now() || expires <= observed || expires - observed > 6 * 3600_000)) ||
        (!active && (state.observed_at !== null || state.expires_at !== null)) || response.headers.get('Cache-Control') !== 'no-store') {
      throw new Error('Unexpected response');
    }
    // Print only validated status metadata, never raw server content.
    console.log(JSON.stringify({ endpoint, http: response.status, status: state.status,
      observed_at: active ? new Date(observed).toISOString() : null,
      expires_at: active ? new Date(expires).toISOString() : null,
      writes: 0 }, null, 2));
  }
} catch {
  console.error('Presence check failed. Check the private bundle path and connectivity; no status was written.');
  process.exitCode = 1;
}
