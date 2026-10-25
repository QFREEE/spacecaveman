import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Never print coordinates, raw server content, credentials or error messages.
const [command = 'current', from, to] = process.argv.slice(2);
const directory = resolve('.presence-private/location');
try {
  const config = JSON.parse(await readFile(join(directory, 'credentials.json'), 'utf8'));
  const origin = new URL(config.endpoint);
  if (origin.origin !== 'https://location.spacecaveman.com') throw new Error('Unexpected endpoint');
  if (!config.access_client_id || !config.access_client_secret) throw new Error('Configure Access credentials');
  const scope = command === 'current' ? 'read' : command === 'export' ? 'history' : command === 'delete' ? 'delete' : null;
  if (!scope || !/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(config[scope] ?? '')) throw new Error('Invalid operation or credential');
  const headers = { Authorization: `Bearer ${config[scope]}`, 'CF-Access-Client-Id': config.access_client_id, 'CF-Access-Client-Secret': config.access_client_secret };
  async function request(path, options = {}) {
    const response = await fetch(new URL(path, origin), { ...options, headers: { ...headers, ...options.headers }, redirect: 'error', signal: AbortSignal.timeout(15_000), cache: 'no-store' });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  }
  if (command === 'current') {
    const result = await request('/api/location/current');
    console.log(JSON.stringify({ available: !!result.location, stale: result.stale ?? null, observed_at: result.location?.observed_at ?? null }));
  } else if (command === 'delete') {
    if (!from || !Number.isFinite(Date.parse(from))) throw new Error('Supply before timestamp');
    const result = await request('/api/location/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ before: from }) });
    console.log(JSON.stringify({ deleted: result.deleted }));
  } else {
    if (!from || !to) throw new Error('Supply from and to timestamps, at most 31 days apart');
    const locations = [];
    const query = new URLSearchParams({ from, to });
    let after = null;
    do {
      if (after !== null) query.set('after', String(after));
      const result = await request(`/api/location/export?${query}`);
      locations.push(...result.locations);
      if (result.next_after !== null && result.next_after <= (after ?? -Infinity)) throw new Error('Invalid cursor');
      after = result.next_after;
    } while (after !== null);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = join(directory, `export-${Date.now()}.json`);
    await writeFile(file, JSON.stringify({ locations }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(`Saved ${locations.length} observations to a private export file. No locations printed.`);
  }
} catch {
  console.error('Location operation failed. Check the private bundle, Access setup, date range and endpoint. No private server data printed.');
  process.exitCode = 1;
}
