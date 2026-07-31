import { shuffle } from './shuffle.js';

export function buildDeck(countries, pairCount) {
  const chosen = shuffle(countries).slice(0, pairCount);
  const cards = chosen.flatMap((country) => [
    { key: `${country.id}-flag`, countryId: country.id, kind: 'flag' },
    { key: `${country.id}-name`, countryId: country.id, kind: 'name' },
  ]);
  return shuffle(cards);
}
