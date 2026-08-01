import { describe, expect, it } from 'vitest';
import { getFlagEmoji } from './flagEmoji.js';

describe('getFlagEmoji', () => {
  it('builds the flag emoji from a 2-letter code', () => {
    expect(getFlagEmoji('es')).toBe('🇪🇸');
    expect(getFlagEmoji('us')).toBe('🇺🇸');
    expect(getFlagEmoji('fr')).toBe('🇫🇷');
  });

  it('maps both England and Scotland to the United Kingdom flag emoji', () => {
    expect(getFlagEmoji('gb-eng')).toBe('🇬🇧');
    expect(getFlagEmoji('gb-sct')).toBe('🇬🇧');
  });
});
