// Read-only checks; never send credentials or mutate presence in deployment smoke tests.
const base = 'https://spacecaveman.com';
for (const path of ['/', '/api/visits']) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15_000), redirect: 'error' });
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
      if (path === '/api/visits') {
        const body = await response.json();
        if (body.demo !== true || !Array.isArray(body.visits)) throw new Error('Unexpected sample API contract');
        if (response.headers.get('cache-control') !== 'no-store') throw new Error('API caching is unsafe');
      } else if (!(response.headers.get('content-type') || '').includes('text/html')) {
        throw new Error('Expected HTML');
      }
      failure = undefined;
      break;
    } catch (error) {
      failure = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  if (failure) throw new Error(`${path} verification failed`, { cause: failure });
  console.log(`Verified ${base}${path}`);
}
