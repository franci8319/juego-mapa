import worldAtlasTopology from 'world-atlas/countries-110m.json';
import { toNumericId } from './isoMap.js';

export { worldAtlasTopology };

const atlasNumericIds = new Set(
  worldAtlasTopology.objects.countries.geometries.map((g) => String(Number(g.id)))
);

export function hasMapGeometry(flagCode) {
  const numeric = toNumericId(flagCode);
  return numeric !== null && atlasNumericIds.has(numeric);
}
