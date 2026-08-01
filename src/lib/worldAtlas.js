import worldAtlasTopology from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import { toNumericId } from './isoMap.js';

export { worldAtlasTopology };

const atlasNumericIds = new Set(
  worldAtlasTopology.objects.countries.geometries.map((g) => String(Number(g.id)))
);

export function hasMapGeometry(flagCode) {
  const numeric = toNumericId(flagCode);
  return numeric !== null && atlasNumericIds.has(numeric);
}

const countriesFeatureCollection = feature(worldAtlasTopology, worldAtlasTopology.objects.countries);
const centroidByNumericId = new Map(
  countriesFeatureCollection.features.map((f) => [String(Number(f.id)), geoCentroid(f)])
);

export function getCentroid(flagCode) {
  const numeric = toNumericId(flagCode);
  if (numeric === null) return null;
  return centroidByNumericId.get(numeric) ?? null;
}
