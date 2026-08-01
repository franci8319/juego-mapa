import { describe, expect, it } from 'vitest';
import { hasMapGeometry, worldAtlasTopology } from './worldAtlas.js';

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

describe('hasMapGeometry', () => {
  it('returns true for a country present in the 110m atlas (Spain)', () => {
    expect(hasMapGeometry('es')).toBe(true);
  });

  it('returns false for Cabo Verde, which the 110m atlas drops', () => {
    expect(hasMapGeometry('cv')).toBe(false);
  });

  it('returns false for Curazao, which the 110m atlas drops', () => {
    expect(hasMapGeometry('cw')).toBe(false);
  });
});
