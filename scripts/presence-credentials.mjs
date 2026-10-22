import { randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

// Private files are outside public/ and ignored by Git. Never print token values.
const directory = new URL('../.presence-private/', import.meta.url);
await mkdir(directory, { recursive: true });
const expires = Date.now() + 90 * 24 * 60 * 60 * 1000;
const credentials = {};
const statements = [];
const revoke = [];
for (const scope of ['write', 'read']) {
  const id = randomBytes(16).toString('hex');
  const secret = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(secret).digest('hex');
  credentials[scope] = `${id}.${secret}`;
  statements.push(`INSERT INTO presence_credentials (id, digest, scope, expires_at) VALUES ('${id}', '${hash}', 'presence:${scope}', ${expires});`);
  revoke.push(`UPDATE presence_credentials SET revoked = 1 WHERE id = '${id}';`);
}
// Fail if an existing credential bundle would be replaced.
await writeFile(new URL('credentials.json', directory), JSON.stringify({ ...credentials, expires_at: new Date(expires).toISOString() }, null, 2), { flag: 'wx', mode: 0o600 });
await writeFile(new URL('provision.sql', directory), statements.join('\n') + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(new URL('revoke.sql', directory), revoke.join('\n') + '\n', { flag: 'wx', mode: 0o600 });
await writeFile(new URL('iphone-setup.txt', directory), [
  'PRIVATE: enter only the write credential in your iPhone shortcut.',
  'Endpoint: https://spacecaveman-presence-trial.spacecaveman.workers.dev/api/presence',
  'Method: POST; Request Body: JSON',
  `Authorization: Bearer ${credentials.write}`,
  'JSON fields: status (in_nyc, not_in_nyc, or unknown to clear), observed_at (fresh ISO 8601 with timezone), event_id (fresh unique text).',
  'Phone action guide: https://spacecaveman-presence-trial.spacecaveman.workers.dev/shortcuts.html',
  'Never share the populated shortcut. Read credential is for the private status viewer only.',
  `Private viewer credential: ${credentials.read}`,
  `Credentials expire: ${new Date(expires).toISOString()}`,
].join('\n'), { flag: 'wx', mode: 0o600 });
console.log('Created private credential bundle in .presence-private/. No token values printed.');
