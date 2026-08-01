import { describe, expect, it } from 'vitest';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from './worldAtlas.js';

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

describe('getCentroid', () => {
  it('returns a real [longitude, latitude] centroid for a country with map geometry', () => {
    const centroid = getCentroid('es');
    expect(centroid).not.toBeNull();
    const [lon, lat] = centroid;
    expect(lon).toBeGreaterThan(-10);
    expect(lon).toBeLessThan(5);
    expect(lat).toBeGreaterThan(35);
    expect(lat).toBeLessThan(45);
  });

  it('returns null for a country with no map geometry', () => {
    expect(getCentroid('cv')).toBeNull();
    expect(getCentroid('cw')).toBeNull();
  });
});
