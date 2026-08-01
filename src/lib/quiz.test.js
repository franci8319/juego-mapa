import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOptions, pickRandomCountry, pickWeightedCountry } from './quiz.js';

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

describe('pickWeightedCountry', () => {
  const tieredCountries = [
    { id: 'a', difficulty: 1 },
    { id: 'b', difficulty: 2 },
    { id: 'c', difficulty: 3 },
  ];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('heavily favors tier 1 at correctCount 0', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    expect(pickWeightedCountry(tieredCountries, 0).id).toBe('a');
  });

  it('can still pick tier 3 at correctCount 0 for a high roll (never fully excluded)', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(pickWeightedCountry(tieredCountries, 0).id).toBe('c');
  });

  it('becomes uniform across tiers once correctCount reaches 10', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0);
    expect(pickWeightedCountry(tieredCountries, 10).id).toBe('b');
  });

  it('falls back to the full pool if no country matches the chosen tier', () => {
    const onlyTier1 = [{ id: 'a', difficulty: 1 }];
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(pickWeightedCountry(onlyTier1, 0).id).toBe('a');
  });
});
