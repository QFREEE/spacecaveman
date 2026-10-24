// Do not echo configuration values or exception messages: keys are secret.
try {
  const { readFileSync } = await import('node:fs');
  const config = JSON.parse(readFileSync(new URL('../wrangler.location.jsonc', import.meta.url), 'utf8'));
  const keys = JSON.parse(process.env.LOCATION_KEYS ?? 'null');
  const active = config.vars.LOCATION_ACTIVE_KEY;
  if (!keys || typeof keys[active] !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(keys[active]) ||
    !/^[a-f0-9]{64}$/.test(process.env.LOCATION_ACCESS_AUD ?? '')) throw new Error();
  console.log('Private location deployment prerequisites are present.');
} catch {
  console.error('Configure production LOCATION_KEYS and the LOCATION_ACCESS_AUD repository variable before enabling private deployment.');
  process.exitCode = 1;
}
