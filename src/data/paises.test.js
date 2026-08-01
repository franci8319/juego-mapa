import { describe, expect, it } from 'vitest';
import { paises } from './paises.js';
import { continents } from './continents.js';

describe('paises dataset', () => {
  it('has exactly 49 countries', () => {
    expect(paises).toHaveLength(49);
  });

  it('has a unique id for every country', () => {
    const ids = paises.map((p) => p.id);
    expect(new Set(ids).size).toBe(49);
  });

  it('gives every country a non-empty name and flagCode', () => {
    for (const pais of paises) {
      expect(pais.name.length).toBeGreaterThan(0);
      expect(pais.flagCode.length).toBeGreaterThan(0);
    }
  });

  it('includes Italy and both UK home nations', () => {
    const ids = paises.map((p) => p.id);
    expect(ids).toContain('it');
    expect(ids).toContain('gb-eng');
    expect(ids).toContain('gb-sct');
  });

  it('gives every country a continent from the known continent list', () => {
    const validIds = new Set(continents.map((c) => c.id));
    for (const pais of paises) {
      expect(validIds.has(pais.continent)).toBe(true);
    }
  });

  it('groups countries into continents matching the expected confederation counts', () => {
    const counts = {};
    for (const pais of paises) {
      counts[pais.continent] = (counts[pais.continent] ?? 0) + 1;
    }
    expect(counts).toEqual({ america: 12, europa: 17, africa: 10, asia: 8, oceania: 2 });
  });
});
