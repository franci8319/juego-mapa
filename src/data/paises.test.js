import { describe, expect, it } from 'vitest';
import { paises } from './paises.js';

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
});
