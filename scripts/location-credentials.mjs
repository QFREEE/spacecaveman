import { randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Creates a NEW bundle only. Never reads, overwrites or prints existing secrets.
const parent = new URL('../.presence-private/', import.meta.url);
const directory = new URL('location/', parent);
await mkdir(parent, { recursive: true });
await mkdir(directory, { mode: 0o700 });
const expires = Date.now() + 90 * 86400_000;
const credentials = { endpoint: 'https://location.spacecaveman.com', expires_at: new Date(expires).toISOString() };
const sql = [];
for (const scope of ['write', 'read', 'history', 'delete']) {
  const id = randomBytes(16).toString('hex');
  const secret = randomBytes(32).toString('base64url');
  credentials[scope] = `${id}.${secret}`;
  const digest = createHash('sha256').update(secret).digest('hex');
  sql.push(`INSERT INTO location_credentials(id,digest,scope,expires_at) VALUES('${id}','${digest}','location:${scope}',${expires});`);
}
await writeFile(new URL('credentials.json', directory), JSON.stringify(credentials, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(new URL('provision.sql', directory), sql.join('\n') + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(new URL('keys.json', directory), JSON.stringify({ v1: randomBytes(32).toString('base64url') }) + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(new URL('iphone-setup.txt', directory), [
  'PRIVATE. Configure only after Cloudflare Access and the location Worker are deployed.',
  'Endpoint: https://location.spacecaveman.com/api/location',
  `Authorization: Bearer ${credentials.write}`,
  'Also add the phone-specific CF-Access-Client-Id and CF-Access-Client-Secret from Access.',
  'POST JSON fields: latitude (Number), longitude (Number), observed_at (ISO 8601 or RFC 2822 with timezone).',
  'Optional accuracy_m: actual measured Number or null. Do not invent accuracy from the precision picker.',
  'Capture the location once, then select Latitude and Longitude from that same variable.',
  'Do not share this file, keys.json, populated Shortcuts, or token screenshots.',
].join('\n') + '\n', { flag: 'wx', mode: 0o600 });
console.log('Created private location bundle; no secrets printed. See docs/private-location.md.');
