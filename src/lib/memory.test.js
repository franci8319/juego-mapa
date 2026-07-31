import { describe, expect, it } from 'vitest';
import { buildDeck } from './memory.js';

const countries = [
  { id: 'a', name: 'A', flagCode: 'a' },
  { id: 'b', name: 'B', flagCode: 'b' },
  { id: 'c', name: 'C', flagCode: 'c' },
  { id: 'd', name: 'D', flagCode: 'd' },
];

describe('buildDeck', () => {
  it('returns two cards per requested pair', () => {
    const deck = buildDeck(countries, 3);
    expect(deck).toHaveLength(6);
  });

  it('gives each chosen country exactly one flag card and one name card', () => {
    const deck = buildDeck(countries, 3);
    const byCountry = {};
    for (const card of deck) {
      byCountry[card.countryId] ??= [];
      byCountry[card.countryId].push(card.kind);
    }
    expect(Object.keys(byCountry)).toHaveLength(3);
    for (const kinds of Object.values(byCountry)) {
      expect(kinds.sort()).toEqual(['flag', 'name']);
    }
  });

  it('gives every card a unique key', () => {
    const deck = buildDeck(countries, 3);
    const keys = deck.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
