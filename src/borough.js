import boundaries from './data/nyc-boroughs.json' with { type: 'json' };

const polygons = boundaries.features.flatMap(({ borough, coordinates }) => coordinates.map(rings => {
  const outer = rings[0];
  return { borough, rings, bbox: [Math.min(...outer.map(p => p[0])), Math.min(...outer.map(p => p[1])), Math.max(...outer.map(p => p[0])), Math.max(...outer.map(p => p[1]))] };
}));

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function nearRing(x, y, ring, meters) {
  const sx = 111_320 * Math.cos(y * Math.PI / 180), sy = 111_320;
  for (let i = 1; i < ring.length; i++) {
    const ax = (ring[i - 1][0] - x) * sx, ay = (ring[i - 1][1] - y) * sy;
    const bx = (ring[i][0] - x) * sx, by = (ring[i][1] - y) * sy;
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    if ((ax + t * dx) ** 2 + (ay + t * dy) ** 2 <= meters ** 2) return true;
  }
  return false;
}

export function classifyBorough(latitude, longitude, accuracy = null) {
  // A policy margin, not a fabricated device accuracy measurement.
  const margin = Math.max(100, accuracy ?? 0);
  if (margin > 5_000) return { status: 'unknown', borough: null };
  const dx = margin / (111_320 * Math.max(0.01, Math.cos(latitude * Math.PI / 180)));
  const dy = margin / 111_320;
  let borough = null;
  for (const polygon of polygons) {
    const [minX, minY, maxX, maxY] = polygon.bbox;
    if (longitude < minX - dx || longitude > maxX + dx || latitude < minY - dy || latitude > maxY + dy) continue;
    if (polygon.rings.some(ring => nearRing(longitude, latitude, ring, margin))) return { status: 'unknown', borough: null };
    if (inRing(longitude, latitude, polygon.rings[0]) && !polygon.rings.slice(1).some(ring => inRing(longitude, latitude, ring))) {
      if (borough && borough !== polygon.borough) return { status: 'unknown', borough: null };
      borough = polygon.borough;
    }
  }
  return { status: borough ? 'in_nyc' : 'not_in_nyc', borough };
}
