import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = new URL(process.argv[2] || 'http://127.0.0.1:8798');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search) {
  throw new Error('Supply an HTTP origin without credentials or query parameters.');
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const requests = [];
  const errors = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(new URL('/shortcuts.html', base).href);
  assert.equal(response.status(), 200);
  assert.ok(response.headers()['content-security-policy']?.includes("connect-src 'self'"));
  assert.equal(await page.locator('h1').innerText(), 'Publish NYC Status');
  assert.equal(await page.locator('input, script, form').count(), 0);
  assert.ok((await page.locator('body').innerText()).includes('Unknown / clear report'));
  assert.ok((await page.locator('body').innerText()).includes('Private trial.'));
  assert.ok(!(await page.content()).match(/[a-f0-9]{32}\.[A-Za-z0-9_-]{43}/));
  await mkdir('outputs/iphone-shortcuts', { recursive: true });
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    await page.screenshot({ path: `outputs/iphone-shortcuts/guide-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => {
    const sheet = document.styleSheets[0];
    sheet.insertRule('body { font-size: 200%; }', sheet.cssRules.length);
    sheet.insertRule('table { font-size: inherit; }', sheet.cssRules.length);
  });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Enlarged text overflow');
  assert.deepEqual(errors, []);
  assert.ok(requests.every(request => request.method === 'GET' && new URL(request.url).origin === base.origin && !new URL(request.url).pathname.startsWith('/api/')));
  console.log(JSON.stringify({ base: base.origin, guide: 200, widths: [320, 390, 430, 1440], enlargedText: 'passed', apiRequests: 0, errors }));
} finally {
  await browser.close();
}
