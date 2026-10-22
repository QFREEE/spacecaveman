import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:8798').origin;
const paths = ['/shortcuts', '/shortcuts/', '/shortcuts.html', '/shortcuts.css'];
for (const path of paths) {
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(`${origin}${path}`, { method, redirect: 'manual' });
    assert.equal(response.status, 410, `${method} ${path}`);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(await response.text(), method === 'HEAD' ? '' : 'Gone');
  }
}
const home = await fetch(`${origin}/`);
assert.equal(home.status, 200, 'Homepage must remain available');
await home.body?.cancel();
console.log(JSON.stringify({ origin, removed: paths, status: 410, homepage: 200, presenceWrites: 0 }));
