import { shuffle } from './shuffle.js';

export function pickRandomCountry(countries) {
  const index = Math.floor(Math.random() * countries.length);
  return countries[index];
}

export function buildOptions(countries, correct, optionCount = 4) {
  const distractPool = countries.filter((c) => c.id !== correct.id);
  const distractors = shuffle(distractPool).slice(0, optionCount - 1);
  return shuffle([correct, ...distractors]);
}
