import { beforeEach, describe, expect, it } from 'vitest';
import { getUnlockedIds, isUnlocked, unlockCountry } from './progress.js';

beforeEach(() => {
  localStorage.clear();
});

describe('progress', () => {
  it('starts with no countries unlocked', () => {
    expect(getUnlockedIds()).toEqual([]);
  });

  it('unlocks a country and persists it', () => {
    unlockCountry('es');
    expect(getUnlockedIds()).toEqual(['es']);
    expect(isUnlocked('es')).toBe(true);
    expect(isUnlocked('fr')).toBe(false);
  });

  it('does not duplicate an already-unlocked country', () => {
    unlockCountry('es');
    unlockCountry('es');
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('ignores corrupted storage instead of throwing', () => {
    localStorage.setItem('banderas-mundial-progress', 'not json');
    expect(getUnlockedIds()).toEqual([]);
  });
});
