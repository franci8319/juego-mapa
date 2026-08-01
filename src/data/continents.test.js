import { describe, expect, it } from 'vitest';
import { continents } from './continents.js';

describe('continents', () => {
  it('has exactly 5 continents with unique ids', () => {
    expect(continents).toHaveLength(5);
    const ids = continents.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids.sort()).toEqual(['africa', 'america', 'asia', 'europa', 'oceania']);
  });

  it('gives every continent a label, an icon, and a color', () => {
    for (const continent of continents) {
      expect(continent.label.length).toBeGreaterThan(0);
      expect(continent.icon.length).toBeGreaterThan(0);
      expect(continent.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
