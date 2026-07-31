import { describe, expect, it } from 'vitest';
import { matchesGeography, toNumericId } from './isoMap.js';

describe('toNumericId', () => {
  it('converts a plain alpha-2 code to its numeric ISO id', () => {
    expect(toNumericId('es')).toBe('724');
    expect(toNumericId('us')).toBe('840');
  });

  it('maps both England and Scotland to the United Kingdom numeric id', () => {
    expect(toNumericId('gb-eng')).toBe('826');
    expect(toNumericId('gb-sct')).toBe('826');
  });
});

describe('matchesGeography', () => {
  it('matches when the numeric ids are equal regardless of type/padding', () => {
    expect(matchesGeography('es', '724')).toBe(true);
    expect(matchesGeography('es', 724)).toBe(true);
    expect(matchesGeography('es', '074')).toBe(false);
  });

  it('matches England and Scotland against the UK polygon', () => {
    expect(matchesGeography('gb-eng', '826')).toBe(true);
    expect(matchesGeography('gb-sct', '826')).toBe(true);
  });
});
