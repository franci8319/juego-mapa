import { describe, expect, it } from 'vitest';
import { worldAtlasTopology } from './worldAtlas.js';

describe('worldAtlasTopology', () => {
  it('is a topojson topology with a countries object', () => {
    expect(worldAtlasTopology.type).toBe('Topology');
    expect(worldAtlasTopology.objects.countries).toBeDefined();
  });

  it('includes an entry for the United Kingdom (numeric id 826)', () => {
    const geometries = worldAtlasTopology.objects.countries.geometries;
    const uk = geometries.find((g) => String(Number(g.id)) === '826');
    expect(uk).toBeDefined();
  });
});
