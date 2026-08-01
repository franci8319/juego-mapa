import { describe, expect, it } from 'vitest';
import { continents } from './continents.js';

describe('continents', () => {
  it('has exactly 5 continents with unique ids', () => {
    expect(continents).toHaveLength(5);
    const ids = continents.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids.sort()).toEqual(['africa', 'america', 'asia', 'europa', 'oceania']);
  });

  it('gives every continent a label and a valid center/zoom', () => {
    for (const continent of continents) {
      expect(continent.label.length).toBeGreaterThan(0);
      expect(continent.center).toHaveLength(2);
      expect(typeof continent.center[0]).toBe('number');
      expect(typeof continent.center[1]).toBe('number');
      expect(continent.zoom).toBeGreaterThan(0);
    }
  });
});
