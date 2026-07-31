import { describe, expect, it } from 'vitest';
import { buildOptions, pickRandomCountry } from './quiz.js';

const countries = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' },
  { id: 'e', name: 'E' },
];

describe('pickRandomCountry', () => {
  it('always returns a country from the given list', () => {
    for (let i = 0; i < 20; i += 1) {
      const picked = pickRandomCountry(countries);
      expect(countries).toContainEqual(picked);
    }
  });
});

describe('buildOptions', () => {
  it('returns optionCount options including the correct one, no duplicates', () => {
    const correct = countries[0];
    const options = buildOptions(countries, correct, 4);
    expect(options).toHaveLength(4);
    expect(options).toContainEqual(correct);
    const ids = options.map((o) => o.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('caps optionCount to the available pool size', () => {
    const correct = countries[0];
    const options = buildOptions(countries.slice(0, 2), correct, 4);
    expect(options.length).toBeLessThanOrEqual(2);
    expect(options).toContainEqual(correct);
  });
});
