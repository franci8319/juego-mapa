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

const EASY_WEIGHTS = { 1: 0.7, 2: 0.25, 3: 0.05 };
const UNIFORM_WEIGHTS = { 1: 1 / 3, 2: 1 / 3, 3: 1 / 3 };
const DIFFICULTY_RAMP_LENGTH = 10;

function tierWeights(correctCount) {
  const t = Math.min(correctCount / DIFFICULTY_RAMP_LENGTH, 1);
  return {
    1: EASY_WEIGHTS[1] + (UNIFORM_WEIGHTS[1] - EASY_WEIGHTS[1]) * t,
    2: EASY_WEIGHTS[2] + (UNIFORM_WEIGHTS[2] - EASY_WEIGHTS[2]) * t,
    3: EASY_WEIGHTS[3] + (UNIFORM_WEIGHTS[3] - EASY_WEIGHTS[3]) * t,
  };
}

export function pickWeightedCountry(countries, correctCount) {
  const weights = tierWeights(correctCount);
  const roll = Math.random();
  let cumulative = 0;
  let chosenTier = 3;
  for (const tier of [1, 2, 3]) {
    cumulative += weights[tier];
    if (roll <= cumulative) {
      chosenTier = tier;
      break;
    }
  }
  const pool = countries.filter((c) => c.difficulty === chosenTier);
  const fallbackPool = pool.length > 0 ? pool : countries;
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
}
