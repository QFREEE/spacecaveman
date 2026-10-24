import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Official NYC DCP boundaries INCLUDING water (ferry/river samples are still NYC).
// No phone locations are sent to this service.
// wh2p-dxnf is the source dataset linked by the official 53n2-m85m map.
const source = 'https://data.cityofnewyork.us/resource/wh2p-dxnf.geojson';
const response = await fetch(source, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error('Boundary download failed');
const raw = await response.text();
const collection = JSON.parse(raw);
const names = { 'Manhattan': 'manhattan', 'Brooklyn': 'brooklyn', 'Queens': 'queens', 'Bronx': 'bronx', 'Staten Island': 'staten_island' };
if (collection.features?.length !== 5) throw new Error('Unexpected boundary dataset');
const features = collection.features.map(feature => {
  const borough = names[feature.properties.boroname];
  if (!borough || feature.geometry.type !== 'MultiPolygon') throw new Error('Invalid borough geometry');
  return { borough, coordinates: feature.geometry.coordinates };
});
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/nyc-boroughs.json', import.meta.url), JSON.stringify({ source, downloaded: new Date().toISOString().slice(0, 10), sha256: createHash('sha256').update(raw).digest('hex'), features }) + '\n');
console.log('Updated five official borough boundaries. Review geometry tests before committing.');
