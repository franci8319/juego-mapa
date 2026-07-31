# Juego de Geografía "Banderas del Mundial" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React web game where a 5-7 year old learns the 48 countries qualified for the 2026 World Cup (plus Italy) through 4 game modes, a digital sticker album, and a free-exploration world map.

**Architecture:** Single-page React app (Vite build, no backend). Pure, unit-tested logic modules (`src/lib/*`) hold all randomness/matching/persistence logic; React components (`src/components/*`) are thin and consume those modules. Progress persists to `localStorage` only.

**Tech Stack:** React 18, Vite, `react-simple-maps` (world map), `flag-icons` (bundled SVG flags), `i18n-iso-countries` (alpha-2 → numeric ISO conversion for map matching), Vitest + React Testing Library for tests.

## Global Constraints

- UI language: Spanish only, all copy in the code below is final copy (not placeholder).
- No backend, no login, no external API calls at runtime. Flags and map geometry are bundled at build time, not fetched from a CDN.
- Every wrong answer shows the correct answer with encouraging copy — never a "you lost" state, never a lives/timer system.
- Dataset is exactly 49 countries: the 48 teams qualified for the 2026 FIFA World Cup plus Italy (added per explicit request, despite not qualifying).
- England and Scotland compete as separate national teams but share one polygon on a country-level world map (the United Kingdom). Both are separate, fully playable entries in every game mode and the album; on the two map-based modes only, clicking the United Kingdom polygon is accepted as correct for either.

---

## Data Reference: the 49 countries

Verified 2026-07-31 against the final 2026 FIFA World Cup qualification results (Wikipedia, cross-checked against FIFA.com coverage) plus Italy added manually. `id` and `flagCode` are the same value: the lowercase code used both as our internal id and as the `flag-icons` CSS suffix (`fi-<code>`). England/Scotland use `flag-icons`' UK-constituent-country codes `gb-eng` / `gb-sct`.

| id | name (es) |
|---|---|
| ca | Canadá |
| mx | México |
| us | Estados Unidos |
| jp | Japón |
| nz | Nueva Zelanda |
| ir | Irán |
| ar | Argentina |
| uz | Uzbekistán |
| jo | Jordania |
| kr | Corea del Sur |
| au | Australia |
| br | Brasil |
| ec | Ecuador |
| py | Paraguay |
| uy | Uruguay |
| co | Colombia |
| ma | Marruecos |
| tn | Túnez |
| eg | Egipto |
| dz | Argelia |
| gh | Ghana |
| cv | Cabo Verde |
| qa | Catar |
| sa | Arabia Saudí |
| sn | Senegal |
| za | Sudáfrica |
| ci | Costa de Marfil |
| gb-eng | Inglaterra |
| fr | Francia |
| hr | Croacia |
| pt | Portugal |
| no | Noruega |
| de | Alemania |
| nl | Países Bajos |
| ch | Suiza |
| gb-sct | Escocia |
| es | España |
| at | Austria |
| be | Bélgica |
| pa | Panamá |
| cw | Curazao |
| ht | Haití |
| ba | Bosnia y Herzegovina |
| se | Suecia |
| tr | Turquía |
| cz | Chequia |
| cd | RD Congo |
| iq | Irak |
| it | Italia |

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/App.test.jsx`

**Interfaces:**
- Produces: `App` component (default export from `src/App.jsx`) — later tasks render their screens inside it, but this task only needs it to render a title.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "juego-mapa",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "flag-icons": "^7",
    "i18n-iso-countries": "^7",
    "react": "^18",
    "react-dom": "^18",
    "react-simple-maps": "^3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6",
    "@testing-library/react": "^16",
    "@testing-library/user-event": "^14",
    "@vitejs/plugin-react": "^4",
    "jsdom": "^25",
    "vite": "^5",
    "vitest": "^2"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
});
```

- [ ] **Step 3: Create `src/setupTests.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />
    <title>Banderas del Mundial</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 6: Create `src/App.jsx`**

```jsx
export default function App() {
  return (
    <main>
      <h1>Banderas del Mundial</h1>
    </main>
  );
}
```

- [ ] **Step 7: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'flag-icons/css/flag-icons.min.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Create empty `src/index.css`**

```css
:root {
  color-scheme: light;
}
```

- [ ] **Step 9: Write the smoke test `src/App.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the game title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Banderas del Mundial' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Install dependencies and run the test**

Run: `npm install`
Then run: `npm test`
Expected: 1 passed (`App > renders the game title`)

- [ ] **Step 11: Commit**

```bash
git add package.json vite.config.js index.html .gitignore src/main.jsx src/App.jsx src/App.test.jsx src/index.css src/setupTests.js
git commit -m "chore: scaffold Vite + React project"
```

---

### Task 2: Country dataset

**Files:**
- Create: `src/data/paises.js`
- Test: `src/data/paises.test.js`

**Interfaces:**
- Produces: `paises` — a frozen array of exactly 49 objects `{ id: string, name: string, flagCode: string }`, exported from `src/data/paises.js`. All later tasks import country data from here — never redefine or duplicate it.

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { paises } from './paises.js';

describe('paises dataset', () => {
  it('has exactly 49 countries', () => {
    expect(paises).toHaveLength(49);
  });

  it('has a unique id for every country', () => {
    const ids = paises.map((p) => p.id);
    expect(new Set(ids).size).toBe(49);
  });

  it('gives every country a non-empty name and flagCode', () => {
    for (const pais of paises) {
      expect(pais.name.length).toBeGreaterThan(0);
      expect(pais.flagCode.length).toBeGreaterThan(0);
    }
  });

  it('includes Italy and both UK home nations', () => {
    const ids = paises.map((p) => p.id);
    expect(ids).toContain('it');
    expect(ids).toContain('gb-eng');
    expect(ids).toContain('gb-sct');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/data/paises.test.js`
Expected: FAIL — `Failed to resolve import "./paises.js"`

- [ ] **Step 3: Write `src/data/paises.js`**

```js
export const paises = Object.freeze([
  { id: 'ca', name: 'Canadá', flagCode: 'ca' },
  { id: 'mx', name: 'México', flagCode: 'mx' },
  { id: 'us', name: 'Estados Unidos', flagCode: 'us' },
  { id: 'jp', name: 'Japón', flagCode: 'jp' },
  { id: 'nz', name: 'Nueva Zelanda', flagCode: 'nz' },
  { id: 'ir', name: 'Irán', flagCode: 'ir' },
  { id: 'ar', name: 'Argentina', flagCode: 'ar' },
  { id: 'uz', name: 'Uzbekistán', flagCode: 'uz' },
  { id: 'jo', name: 'Jordania', flagCode: 'jo' },
  { id: 'kr', name: 'Corea del Sur', flagCode: 'kr' },
  { id: 'au', name: 'Australia', flagCode: 'au' },
  { id: 'br', name: 'Brasil', flagCode: 'br' },
  { id: 'ec', name: 'Ecuador', flagCode: 'ec' },
  { id: 'py', name: 'Paraguay', flagCode: 'py' },
  { id: 'uy', name: 'Uruguay', flagCode: 'uy' },
  { id: 'co', name: 'Colombia', flagCode: 'co' },
  { id: 'ma', name: 'Marruecos', flagCode: 'ma' },
  { id: 'tn', name: 'Túnez', flagCode: 'tn' },
  { id: 'eg', name: 'Egipto', flagCode: 'eg' },
  { id: 'dz', name: 'Argelia', flagCode: 'dz' },
  { id: 'gh', name: 'Ghana', flagCode: 'gh' },
  { id: 'cv', name: 'Cabo Verde', flagCode: 'cv' },
  { id: 'qa', name: 'Catar', flagCode: 'qa' },
  { id: 'sa', name: 'Arabia Saudí', flagCode: 'sa' },
  { id: 'sn', name: 'Senegal', flagCode: 'sn' },
  { id: 'za', name: 'Sudáfrica', flagCode: 'za' },
  { id: 'ci', name: 'Costa de Marfil', flagCode: 'ci' },
  { id: 'gb-eng', name: 'Inglaterra', flagCode: 'gb-eng' },
  { id: 'fr', name: 'Francia', flagCode: 'fr' },
  { id: 'hr', name: 'Croacia', flagCode: 'hr' },
  { id: 'pt', name: 'Portugal', flagCode: 'pt' },
  { id: 'no', name: 'Noruega', flagCode: 'no' },
  { id: 'de', name: 'Alemania', flagCode: 'de' },
  { id: 'nl', name: 'Países Bajos', flagCode: 'nl' },
  { id: 'ch', name: 'Suiza', flagCode: 'ch' },
  { id: 'gb-sct', name: 'Escocia', flagCode: 'gb-sct' },
  { id: 'es', name: 'España', flagCode: 'es' },
  { id: 'at', name: 'Austria', flagCode: 'at' },
  { id: 'be', name: 'Bélgica', flagCode: 'be' },
  { id: 'pa', name: 'Panamá', flagCode: 'pa' },
  { id: 'cw', name: 'Curazao', flagCode: 'cw' },
  { id: 'ht', name: 'Haití', flagCode: 'ht' },
  { id: 'ba', name: 'Bosnia y Herzegovina', flagCode: 'ba' },
  { id: 'se', name: 'Suecia', flagCode: 'se' },
  { id: 'tr', name: 'Turquía', flagCode: 'tr' },
  { id: 'cz', name: 'Chequia', flagCode: 'cz' },
  { id: 'cd', name: 'RD Congo', flagCode: 'cd' },
  { id: 'iq', name: 'Irak', flagCode: 'iq' },
  { id: 'it', name: 'Italia', flagCode: 'it' },
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/paises.test.js`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/data/paises.js src/data/paises.test.js
git commit -m "feat: add 49-country dataset for the 2026 World Cup + Italy"
```

---

### Task 3: Shuffle utility

**Files:**
- Create: `src/lib/shuffle.js`
- Test: `src/lib/shuffle.test.js`

**Interfaces:**
- Produces: `shuffle(array)` — pure function, returns a **new** array with the same elements in randomized order; does not mutate its input. Used by Task 4 (quiz.js) and Task 10 (memory.js).

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle.js';

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/shuffle.test.js`
Expected: FAIL — `Failed to resolve import "./shuffle.js"`

- [ ] **Step 3: Write `src/lib/shuffle.js`**

```js
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/shuffle.test.js`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/shuffle.js src/lib/shuffle.test.js
git commit -m "feat: add shuffle utility"
```

---

### Task 4: Progress module (localStorage)

**Files:**
- Create: `src/lib/progress.js`
- Test: `src/lib/progress.test.js`

**Interfaces:**
- Produces: `getUnlockedIds(): string[]`, `isUnlocked(id: string): boolean`, `unlockCountry(id: string): string[]` (returns the updated list) — all exported from `src/lib/progress.js`. Used by `Album` (Task 7) and every game-mode component (Tasks 8-11).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/progress.test.js`
Expected: FAIL — `Failed to resolve import "./progress.js"`

- [ ] **Step 3: Write `src/lib/progress.js`**

```js
const STORAGE_KEY = 'banderas-mundial-progress';

export function getUnlockedIds() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isUnlocked(id) {
  return getUnlockedIds().includes(id);
}

export function unlockCountry(id) {
  const current = getUnlockedIds();
  if (current.includes(id)) return current;
  const updated = [...current, id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/progress.test.js`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.js src/lib/progress.test.js
git commit -m "feat: add localStorage-backed progress tracking"
```

---

### Task 5: Quiz logic (multiple choice generator)

**Files:**
- Create: `src/lib/quiz.js`
- Test: `src/lib/quiz.test.js`

**Interfaces:**
- Consumes: `shuffle` from `src/lib/shuffle.js` (Task 3).
- Produces: `pickRandomCountry(countries): Country`, `buildOptions(countries, correct, optionCount = 4): Country[]` (array including `correct`, length `optionCount`, no duplicate ids) — both exported from `src/lib/quiz.js`. Used by `FlagToCountry` (Task 8) and `CountryToFlag` (Task 9).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/quiz.test.js`
Expected: FAIL — `Failed to resolve import "./quiz.js"`

- [ ] **Step 3: Write `src/lib/quiz.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/quiz.test.js`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz.js src/lib/quiz.test.js
git commit -m "feat: add multiple-choice quiz question generator"
```

---

### Task 6: ISO numeric matching for the map (isoMap)

**Files:**
- Create: `src/lib/isoMap.js`
- Test: `src/lib/isoMap.test.js`

**Interfaces:**
- Consumes: `i18n-iso-countries` package (no locale registration needed — only numeric conversion is used, which is locale-independent).
- Produces: `toNumericId(flagCode: string): string | null`, `matchesGeography(flagCode: string, geographyId: string | number): boolean` — both exported from `src/lib/isoMap.js`. Used by `MapGame` (Task 11) and `ExploreMap` (Task 12) to match a clicked map polygon (which carries a numeric ISO 3166-1 id from the bundled world atlas) back to our `flagCode`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/isoMap.test.js`
Expected: FAIL — `Failed to resolve import "./isoMap.js"`

- [ ] **Step 3: Write `src/lib/isoMap.js`**

```js
import iso from 'i18n-iso-countries';

export function toNumericId(flagCode) {
  const alpha2 = flagCode === 'gb-eng' || flagCode === 'gb-sct' ? 'GB' : flagCode.toUpperCase();
  const numeric = iso.alpha2ToNumeric(alpha2);
  return numeric ? String(Number(numeric)) : null;
}

export function matchesGeography(flagCode, geographyId) {
  const numeric = toNumericId(flagCode);
  return numeric !== null && numeric === String(Number(geographyId));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/isoMap.test.js`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/isoMap.js src/lib/isoMap.test.js
git commit -m "feat: add ISO alpha-2 to numeric id matching for map polygons"
```

---

### Task 7: Memory game deck logic

**Files:**
- Create: `src/lib/memory.js`
- Test: `src/lib/memory.test.js`

**Interfaces:**
- Consumes: `shuffle` from `src/lib/shuffle.js` (Task 3).
- Produces: `buildDeck(countries, pairCount): Card[]` where `Card = { key: string, countryId: string, kind: 'flag' | 'name' }` — exported from `src/lib/memory.js`. Used by `MemoryGame` (Task 10).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memory.test.js`
Expected: FAIL — `Failed to resolve import "./memory.js"`

- [ ] **Step 3: Write `src/lib/memory.js`**

```js
import { shuffle } from './shuffle.js';

export function buildDeck(countries, pairCount) {
  const chosen = shuffle(countries).slice(0, pairCount);
  const cards = chosen.flatMap((country) => [
    { key: `${country.id}-flag`, countryId: country.id, kind: 'flag' },
    { key: `${country.id}-name`, countryId: country.id, kind: 'name' },
  ]);
  return shuffle(cards);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/memory.test.js`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/memory.js src/lib/memory.test.js
git commit -m "feat: add memory game deck builder"
```

---

### Task 8: FlagIcon component

**Files:**
- Create: `src/components/FlagIcon.jsx`
- Test: `src/components/FlagIcon.test.jsx`

**Interfaces:**
- Produces: `FlagIcon({ code, label, size })` — default export from `src/components/FlagIcon.jsx`. `size` is `'large' | 'small'` (defaults to `'large'`). Used by `Album` (Task 9), `FlagToCountry` (Task 11), `CountryToFlag` (Task 12), `MemoryGame` (Task 13).

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlagIcon from './FlagIcon.jsx';

describe('FlagIcon', () => {
  it('renders the flag-icons class for the given code', () => {
    render(<FlagIcon code="es" label="España" />);
    expect(screen.getByRole('img', { name: 'España' })).toHaveClass('fi', 'fi-es');
  });

  it('applies the small size class when requested', () => {
    render(<FlagIcon code="fr" label="Francia" size="small" />);
    expect(screen.getByRole('img', { name: 'Francia' })).toHaveClass('flag-icon--small');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FlagIcon.test.jsx`
Expected: FAIL — `Failed to resolve import "./FlagIcon.jsx"`

- [ ] **Step 3: Write `src/components/FlagIcon.jsx`**

```jsx
export default function FlagIcon({ code, label, size = 'large' }) {
  const sizeClass = size === 'small' ? 'flag-icon--small' : 'flag-icon--large';
  return <span role="img" aria-label={label} className={`fi fi-${code} flag-icon ${sizeClass}`} />;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/FlagIcon.test.jsx`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/FlagIcon.jsx src/components/FlagIcon.test.jsx
git commit -m "feat: add FlagIcon component"
```

---

### Task 9: MainMenu + App navigation shell

**Files:**
- Create: `src/components/MainMenu.jsx`
- Create: `src/components/MainMenu.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Produces: `MainMenu({ onNavigate })` (default export, `src/components/MainMenu.jsx`) — renders one button per screen; calls `onNavigate(screenId)` on click. `App` (default export, `src/App.jsx`) holds `screen` state (`'menu' | 'flag-to-country' | 'country-to-flag' | 'map-game' | 'memory' | 'explore' | 'album'`) and renders `MainMenu` plus a "◀ Menú" back button once a screen other than `'menu'` is selected. Later tasks (10-14) each register their screen's component inside `App.jsx`'s switch.

- [ ] **Step 1: Write the failing test for MainMenu**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MainMenu from './MainMenu.jsx';

describe('MainMenu', () => {
  it('renders a button for every screen', () => {
    render(<MainMenu onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: 'Bandera → País' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'País → Bandera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Memory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explorar mapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi álbum' })).toBeInTheDocument();
  });

  it('calls onNavigate with the screen id when clicked', async () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mi álbum' }));
    expect(onNavigate).toHaveBeenCalledWith('album');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MainMenu.test.jsx`
Expected: FAIL — `Failed to resolve import "./MainMenu.jsx"`

- [ ] **Step 3: Write `src/components/MainMenu.jsx`**

```jsx
export const SCREENS = [
  { id: 'flag-to-country', label: 'Bandera → País' },
  { id: 'country-to-flag', label: 'País → Bandera' },
  { id: 'map-game', label: 'Mapa' },
  { id: 'memory', label: 'Memory' },
  { id: 'explore', label: 'Explorar mapa' },
  { id: 'album', label: 'Mi álbum' },
];

export default function MainMenu({ onNavigate }) {
  return (
    <nav className="main-menu">
      {SCREENS.map((screen) => (
        <button key={screen.id} type="button" onClick={() => onNavigate(screen.id)}>
          {screen.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MainMenu.test.jsx`
Expected: 2 passed

- [ ] **Step 5: Write the failing test for App navigation**

Replace `src/App.test.jsx` with:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the game title and the menu by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Banderas del Mundial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi álbum' })).toBeInTheDocument();
  });

  it('navigates to a screen and back to the menu', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Mi álbum' }));
    expect(screen.getByRole('button', { name: '◀ Menú' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '◀ Menú' }));
    expect(screen.queryByRole('button', { name: '◀ Menú' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/App.test.jsx`
Expected: FAIL — no "Mi álbum" button rendered yet

- [ ] **Step 7: Write `src/App.jsx`**

```jsx
import { useState } from 'react';
import MainMenu from './components/MainMenu.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');

  return (
    <main>
      <h1>Banderas del Mundial</h1>
      {screen !== 'menu' && (
        <button type="button" onClick={() => setScreen('menu')}>
          ◀ Menú
        </button>
      )}
      {screen === 'menu' && <MainMenu onNavigate={setScreen} />}
      {screen === 'flag-to-country' && <p>Bandera → País (próximamente)</p>}
      {screen === 'country-to-flag' && <p>País → Bandera (próximamente)</p>}
      {screen === 'map-game' && <p>Mapa (próximamente)</p>}
      {screen === 'memory' && <p>Memory (próximamente)</p>}
      {screen === 'explore' && <p>Explorar mapa (próximamente)</p>}
      {screen === 'album' && <p>Mi álbum (próximamente)</p>}
    </main>
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- src/App.test.jsx`
Expected: 2 passed

- [ ] **Step 9: Commit**

```bash
git add src/components/MainMenu.jsx src/components/MainMenu.test.jsx src/App.jsx src/App.test.jsx
git commit -m "feat: add main menu and screen navigation"
```

---

### Task 10: Album screen

**Files:**
- Create: `src/components/Album.jsx`
- Create: `src/components/Album.test.jsx`
- Modify: `src/App.jsx:1` (import) and the `screen === 'album'` line

**Interfaces:**
- Consumes: `paises` (Task 2), `getUnlockedIds` from `src/lib/progress.js` (Task 4), `FlagIcon` (Task 8).
- Produces: `Album()` — default export, `src/components/Album.jsx`, no props (reads progress internally).

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Album from './Album.jsx';

describe('Album', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows 0/49 and only mystery cards when nothing is unlocked', () => {
    render(<Album />);
    expect(screen.getByText('0/49 cromos')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Sin descubrir')).toHaveLength(49);
  });

  it('shows an unlocked country with its flag and name', () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['es']));
    render(<Album />);
    expect(screen.getByText('1/49 cromos')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Sin descubrir')).toHaveLength(48);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Album.test.jsx`
Expected: FAIL — `Failed to resolve import "./Album.jsx"`

- [ ] **Step 3: Write `src/components/Album.jsx`**

```jsx
import { paises } from '../data/paises.js';
import { getUnlockedIds } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

export default function Album() {
  const unlockedIds = getUnlockedIds();

  return (
    <section className="album">
      <p>
        {unlockedIds.length}/{paises.length} cromos
      </p>
      <div className="album-grid">
        {paises.map((pais) => {
          const unlocked = unlockedIds.includes(pais.id);
          return (
            <div key={pais.id} className={`album-card ${unlocked ? 'unlocked' : 'locked'}`}>
              {unlocked ? (
                <>
                  <FlagIcon code={pais.flagCode} label={pais.name} size="small" />
                  <span>{pais.name}</span>
                </>
              ) : (
                <span aria-label="Sin descubrir" className="album-card__mystery">
                  ?
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/Album.test.jsx`
Expected: 2 passed

- [ ] **Step 5: Wire it into `App.jsx`**

In `src/App.jsx`, add the import:

```jsx
import Album from './components/Album.jsx';
```

Replace the line `{screen === 'album' && <p>Mi álbum (próximamente)</p>}` with:

```jsx
{screen === 'album' && <Album />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests still passing

- [ ] **Step 7: Commit**

```bash
git add src/components/Album.jsx src/components/Album.test.jsx src/App.jsx
git commit -m "feat: add sticker album screen"
```

---

### Task 11: FlagToCountry game mode

**Files:**
- Create: `src/components/FlagToCountry.jsx`
- Create: `src/components/FlagToCountry.test.jsx`
- Modify: `src/App.jsx` (import + wire `screen === 'flag-to-country'`)

**Interfaces:**
- Consumes: `paises` (Task 2), `pickRandomCountry`/`buildOptions` from `src/lib/quiz.js` (Task 5), `unlockCountry` from `src/lib/progress.js` (Task 4), `FlagIcon` (Task 8).
- Produces: `FlagToCountry()` — default export, `src/components/FlagToCountry.jsx`, no props.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlagToCountry from './FlagToCountry.jsx';
import { getUnlockedIds } from '../lib/progress.js';

vi.mock('../lib/quiz.js', () => ({
  pickRandomCountry: () => ({ id: 'es', name: 'España', flagCode: 'es' }),
  buildOptions: () => [
    { id: 'es', name: 'España', flagCode: 'es' },
    { id: 'fr', name: 'Francia', flagCode: 'fr' },
    { id: 'it', name: 'Italia', flagCode: 'it' },
    { id: 'de', name: 'Alemania', flagCode: 'de' },
  ],
}));

describe('FlagToCountry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the flag to guess and 4 country name options', () => {
    render(<FlagToCountry />);
    expect(screen.getByRole('img', { name: 'Bandera a adivinar' })).toHaveClass('fi-es');
    expect(screen.getByRole('button', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Francia' })).toBeInTheDocument();
  });

  it('unlocks the country and shows positive feedback on a correct answer', async () => {
    render(<FlagToCountry />);
    await userEvent.click(screen.getByRole('button', { name: 'España' }));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows an encouraging message with the right answer on a wrong pick', async () => {
    render(<FlagToCountry />);
    await userEvent.click(screen.getByRole('button', { name: 'Francia' }));
    expect(screen.getByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('loads a new question when "Siguiente" is clicked', async () => {
    render(<FlagToCountry />);
    await userEvent.click(screen.getByRole('button', { name: 'España' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FlagToCountry.test.jsx`
Expected: FAIL — `Failed to resolve import "./FlagToCountry.jsx"`

- [ ] **Step 3: Write `src/components/FlagToCountry.jsx`**

```jsx
import { useCallback, useState } from 'react';
import { paises } from '../data/paises.js';
import { buildOptions, pickRandomCountry } from '../lib/quiz.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

function nextQuestion() {
  const correct = pickRandomCountry(paises);
  return { correct, options: buildOptions(paises, correct) };
}

export default function FlagToCountry() {
  const [question, setQuestion] = useState(nextQuestion);
  const [feedback, setFeedback] = useState(null);

  const handleAnswer = useCallback(
    (option) => {
      if (feedback) return;
      if (option.id === question.correct.id) {
        unlockCountry(option.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${question.correct.name}` });
      } else {
        setFeedback({ correct: false, message: `Casi... era ${question.correct.name}` });
      }
    },
    [question, feedback]
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setQuestion(nextQuestion());
  }, []);

  return (
    <section className="game flag-to-country">
      <FlagIcon code={question.correct.flagCode} label="Bandera a adivinar" size="large" />
      <div className="options">
        {question.options.map((option) => (
          <button key={option.id} type="button" onClick={() => handleAnswer(option)} disabled={Boolean(feedback)}>
            {option.name}
          </button>
        ))}
      </div>
      {feedback && (
        <div className={feedback.correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
          <p>{feedback.message}</p>
          <button type="button" onClick={handleNext}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/FlagToCountry.test.jsx`
Expected: 4 passed

- [ ] **Step 5: Wire it into `App.jsx`**

Add the import:

```jsx
import FlagToCountry from './components/FlagToCountry.jsx';
```

Replace `{screen === 'flag-to-country' && <p>Bandera → País (próximamente)</p>}` with:

```jsx
{screen === 'flag-to-country' && <FlagToCountry />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Commit**

```bash
git add src/components/FlagToCountry.jsx src/components/FlagToCountry.test.jsx src/App.jsx
git commit -m "feat: add Bandera -> Pais game mode"
```

---

### Task 12: CountryToFlag game mode

**Files:**
- Create: `src/components/CountryToFlag.jsx`
- Create: `src/components/CountryToFlag.test.jsx`
- Modify: `src/App.jsx` (import + wire `screen === 'country-to-flag'`)

**Interfaces:**
- Consumes: same as Task 11 (`paises`, `quiz.js`, `progress.js`, `FlagIcon`).
- Produces: `CountryToFlag()` — default export, `src/components/CountryToFlag.jsx`, no props. Mirrors `FlagToCountry` but the prompt is the country name and the options are flags; also speaks the name aloud via `window.speechSynthesis` when available (never throws if unavailable).

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CountryToFlag from './CountryToFlag.jsx';
import { getUnlockedIds } from '../lib/progress.js';

vi.mock('../lib/quiz.js', () => ({
  pickRandomCountry: () => ({ id: 'es', name: 'España', flagCode: 'es' }),
  buildOptions: () => [
    { id: 'es', name: 'España', flagCode: 'es' },
    { id: 'fr', name: 'Francia', flagCode: 'fr' },
    { id: 'it', name: 'Italia', flagCode: 'it' },
    { id: 'de', name: 'Alemania', flagCode: 'de' },
  ],
}));

describe('CountryToFlag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the country name to guess and 4 flag options', () => {
    render(<CountryToFlag />);
    expect(screen.getByText('¿Cuál es la bandera de España?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bandera de España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bandera de Francia' })).toBeInTheDocument();
  });

  it('unlocks the country and shows positive feedback on a correct answer', async () => {
    render(<CountryToFlag />);
    await userEvent.click(screen.getByRole('button', { name: 'Bandera de España' }));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows an encouraging message with the right flag on a wrong pick', async () => {
    render(<CountryToFlag />);
    await userEvent.click(screen.getByRole('button', { name: 'Bandera de Francia' }));
    expect(screen.getByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('does not crash when speechSynthesis is unavailable', () => {
    expect(() => render(<CountryToFlag />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CountryToFlag.test.jsx`
Expected: FAIL — `Failed to resolve import "./CountryToFlag.jsx"`

- [ ] **Step 3: Write `src/components/CountryToFlag.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { paises } from '../data/paises.js';
import { buildOptions, pickRandomCountry } from '../lib/quiz.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

function nextQuestion() {
  const correct = pickRandomCountry(paises);
  return { correct, options: buildOptions(paises, correct) };
}

export default function CountryToFlag() {
  const [question, setQuestion] = useState(nextQuestion);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.correct.name);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  }, [question]);

  const handleAnswer = useCallback(
    (option) => {
      if (feedback) return;
      if (option.id === question.correct.id) {
        unlockCountry(option.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${question.correct.name}` });
      } else {
        setFeedback({ correct: false, message: `Casi... era ${question.correct.name}` });
      }
    },
    [question, feedback]
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setQuestion(nextQuestion());
  }, []);

  return (
    <section className="game country-to-flag">
      <p>¿Cuál es la bandera de {question.correct.name}?</p>
      <div className="options">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={`Bandera de ${option.name}`}
            onClick={() => handleAnswer(option)}
            disabled={Boolean(feedback)}
          >
            <FlagIcon code={option.flagCode} label={`Bandera de ${option.name}`} size="large" />
          </button>
        ))}
      </div>
      {feedback && (
        <div className={feedback.correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
          <p>{feedback.message}</p>
          <button type="button" onClick={handleNext}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/CountryToFlag.test.jsx`
Expected: 4 passed

- [ ] **Step 5: Wire it into `App.jsx`**

Add the import:

```jsx
import CountryToFlag from './components/CountryToFlag.jsx';
```

Replace `{screen === 'country-to-flag' && <p>País → Bandera (próximamente)</p>}` with:

```jsx
{screen === 'country-to-flag' && <CountryToFlag />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Commit**

```bash
git add src/components/CountryToFlag.jsx src/components/CountryToFlag.test.jsx src/App.jsx
git commit -m "feat: add Pais -> Bandera game mode"
```

---

### Task 13: Memory game mode

**Files:**
- Create: `src/components/MemoryGame.jsx`
- Create: `src/components/MemoryGame.test.jsx`
- Modify: `src/App.jsx` (import + wire `screen === 'memory'`)

**Interfaces:**
- Consumes: `paises` (Task 2), `buildDeck` from `src/lib/memory.js` (Task 7), `unlockCountry` from `src/lib/progress.js` (Task 4), `FlagIcon` (Task 8).
- Produces: `MemoryGame()` — default export, `src/components/MemoryGame.jsx`, no props. Fixed pair count of 6 for v1 (not configurable, per spec's out-of-scope list).

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MemoryGame from './MemoryGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';

vi.mock('../lib/memory.js', () => ({
  buildDeck: () => [
    { key: 'es-flag', countryId: 'es', kind: 'flag' },
    { key: 'fr-flag', countryId: 'fr', kind: 'flag' },
    { key: 'es-name', countryId: 'es', kind: 'name' },
    { key: 'fr-name', countryId: 'fr', kind: 'name' },
  ],
}));

describe('MemoryGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one face-down card per deck entry', () => {
    render(<MemoryGame />);
    expect(screen.getAllByRole('button', { name: '?' })).toHaveLength(4);
  });

  it('unlocks the country and keeps both cards face up on a match', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MemoryGame />);
    await user.click(screen.getAllByRole('button', { name: '?' })[0]); // es-flag
    await user.click(screen.getAllByRole('button', { name: '?' })[1]); // es-name (index shifts as cards flip)
    vi.advanceTimersByTime(700);
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('flips mismatched cards back down after a delay', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MemoryGame />);
    await user.click(screen.getAllByRole('button', { name: '?' })[0]); // es-flag
    await user.click(screen.getAllByRole('button', { name: '?' })[1]); // fr-flag (mismatch)
    vi.advanceTimersByTime(1000);
    expect(screen.getAllByRole('button', { name: '?' })).toHaveLength(4);
    expect(getUnlockedIds()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MemoryGame.test.jsx`
Expected: FAIL — `Failed to resolve import "./MemoryGame.jsx"`

- [ ] **Step 3: Write `src/components/MemoryGame.jsx`**

```jsx
import { useState } from 'react';
import { paises } from '../data/paises.js';
import { buildDeck } from '../lib/memory.js';
import { unlockCountry } from '../lib/progress.js';
import FlagIcon from './FlagIcon.jsx';

const PAIR_COUNT = 6;

export default function MemoryGame() {
  const [deck] = useState(() => buildDeck(paises, PAIR_COUNT));
  const [flipped, setFlipped] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);

  const handleFlip = (card) => {
    const isAlreadyVisible = flipped.some((f) => f.key === card.key) || matchedIds.includes(card.countryId);
    if (flipped.length === 2 || isAlreadyVisible) return;

    const nextFlipped = [...flipped, card];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [a, b] = nextFlipped;
      if (a.countryId === b.countryId) {
        unlockCountry(a.countryId);
        setTimeout(() => {
          setMatchedIds((prev) => [...prev, a.countryId]);
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  return (
    <section className="game memory-game">
      <div className="memory-grid">
        {deck.map((card) => {
          const isVisible = flipped.some((f) => f.key === card.key) || matchedIds.includes(card.countryId);
          const country = paises.find((p) => p.id === card.countryId);
          return (
            <button
              key={card.key}
              type="button"
              className={`memory-card ${isVisible ? 'flipped' : ''}`}
              onClick={() => handleFlip(card)}
              disabled={isVisible}
            >
              {isVisible ? (
                card.kind === 'flag' ? (
                  <FlagIcon code={country.flagCode} label={country.name} size="small" />
                ) : (
                  country.name
                )
              ) : (
                '?'
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MemoryGame.test.jsx`
Expected: 3 passed

- [ ] **Step 5: Wire it into `App.jsx`**

Add the import:

```jsx
import MemoryGame from './components/MemoryGame.jsx';
```

Replace `{screen === 'memory' && <p>Memory (próximamente)</p>}` with:

```jsx
{screen === 'memory' && <MemoryGame />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Commit**

```bash
git add src/components/MemoryGame.jsx src/components/MemoryGame.test.jsx src/App.jsx
git commit -m "feat: add Memory game mode"
```

---

### Task 14: World map data helper

**Files:**
- Create: `src/lib/worldAtlas.js`
- Test: `src/lib/worldAtlas.test.js`

**Interfaces:**
- Consumes: `world-atlas/countries-110m.json` (bundled npm package data, imported directly — no network request).
- Produces: `worldAtlasTopology` (the raw imported topojson object) exported from `src/lib/worldAtlas.js`. Used by `MapGame` (Task 15) and `ExploreMap` (Task 16) as the `geography` prop for `react-simple-maps`.

- [ ] **Step 1: Add the `world-atlas` dependency**

Run: `npm install world-atlas topojson-client`

- [ ] **Step 2: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { worldAtlasTopology } from './worldAtlas.js';

describe('worldAtlasTopology', () => {
  it('is a topojson topology with a countries object', () => {
    expect(worldAtlasTopology.type).toBe('Topology');
    expect(worldAtlasTopology.objects.countries).toBeDefined();
  });

  it('includes an entry for the United Kingdom (numeric id 826)', () => {
    const geometries = worldAtlasTopology.objects.countries.geometries;
    const uk = geometries.find((g) => String(Number(g.id)) === '826');
    expect(uk).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/lib/worldAtlas.test.js`
Expected: FAIL — `Failed to resolve import "./worldAtlas.js"`

- [ ] **Step 4: Write `src/lib/worldAtlas.js`**

```js
import worldAtlasTopology from 'world-atlas/countries-110m.json';

export { worldAtlasTopology };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/worldAtlas.test.js`
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/worldAtlas.js src/lib/worldAtlas.test.js
git commit -m "feat: bundle world atlas topojson data"
```

---

### Task 15: MapGame mode (guess the country on the map)

**Files:**
- Create: `src/components/MapGame.jsx`
- Create: `src/components/MapGame.test.jsx`
- Modify: `src/App.jsx` (import + wire `screen === 'map-game'`)

**Interfaces:**
- Consumes: `paises` (Task 2), `pickRandomCountry` from `src/lib/quiz.js` (Task 5), `matchesGeography` from `src/lib/isoMap.js` (Task 6), `unlockCountry` from `src/lib/progress.js` (Task 4), `worldAtlasTopology` from `src/lib/worldAtlas.js` (Task 14), `FlagIcon` (Task 8), `ComposableMap`/`Geographies`/`Geography` from `react-simple-maps`.
- Produces: `MapGame()` — default export, `src/components/MapGame.jsx`, no props.

- [ ] **Step 1: Write the failing test**

This test renders with a tiny 2-feature fixture topology (not the full world) so it stays fast and deterministic, and mocks `pickRandomCountry` to always target Spain.

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapGame from './MapGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';

vi.mock('../lib/quiz.js', () => ({
  pickRandomCountry: () => ({ id: 'es', name: 'España', flagCode: 'es' }),
}));

vi.mock('../lib/worldAtlas.js', () => ({
  worldAtlasTopology: {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            id: '724',
            arcs: [[0]],
            properties: { name: 'Spain' },
          },
          {
            type: 'Polygon',
            id: '250',
            arcs: [[1]],
            properties: { name: 'France' },
          },
        ],
      },
    },
    arcs: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 0],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 10],
        [20, 0],
      ],
    ],
  },
}));

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts with the target country flag', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
  });

  it('unlocks the country and shows success feedback when the right polygon is clicked', async () => {
    render(<MapGame />);
    await userEvent.click(screen.getByTestId('geo-724'));
    expect(await screen.findByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows encouraging feedback without unlocking on a wrong polygon', async () => {
    render(<MapGame />);
    await userEvent.click(screen.getByTestId('geo-250'));
    expect(await screen.findByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: FAIL — `Failed to resolve import "./MapGame.jsx"`

- [ ] **Step 3: Write `src/components/MapGame.jsx`**

```jsx
import { useCallback, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickRandomCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { worldAtlasTopology } from '../lib/worldAtlas.js';
import FlagIcon from './FlagIcon.jsx';

export default function MapGame() {
  const [target, setTarget] = useState(() => pickRandomCountry(paises));
  const [feedback, setFeedback] = useState(null);

  const handleGeographyClick = useCallback(
    (geo) => {
      if (feedback) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
      } else {
        setFeedback({ correct: false, message: `Casi... era ${target.name}` });
      }
    },
    [target, feedback]
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setTarget(pickRandomCountry(paises));
  }, []);

  return (
    <section className="game map-game">
      <FlagIcon code={target.flagCode} label={`Encuentra: ${target.name}`} size="large" />
      <ComposableMap>
        <Geographies geography={worldAtlasTopology}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                data-testid={`geo-${geo.id}`}
                onClick={() => handleGeographyClick(geo)}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      {feedback && (
        <div className={feedback.correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
          <p>{feedback.message}</p>
          <button type="button" onClick={handleNext}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: 3 passed

- [ ] **Step 5: Wire it into `App.jsx`**

Add the import:

```jsx
import MapGame from './components/MapGame.jsx';
```

Replace `{screen === 'map-game' && <p>Mapa (próximamente)</p>}` with:

```jsx
{screen === 'map-game' && <MapGame />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Manual check (automated SVG/projection rendering is not fully exercised by jsdom)**

Run: `npm run dev`, open the app on a real browser, go to "Mapa", and confirm: the world renders, panning/clicking a country works, and both a correct and incorrect click behave as expected. This step has no pass/fail text — note in the commit message if anything needed a manual fix.

- [ ] **Step 8: Commit**

```bash
git add src/components/MapGame.jsx src/components/MapGame.test.jsx src/App.jsx
git commit -m "feat: add map-based guessing game mode"
```

---

### Task 16: ExploreMap screen (free zoom/pan world map)

**Files:**
- Create: `src/components/ExploreMap.jsx`
- Create: `src/components/ExploreMap.test.jsx`
- Modify: `src/App.jsx` (import + wire `screen === 'explore'`)

**Interfaces:**
- Consumes: `paises` (Task 2), `getUnlockedIds` from `src/lib/progress.js` (Task 4), `worldAtlasTopology` from `src/lib/worldAtlas.js` (Task 14), `FlagIcon` (Task 8), `ComposableMap`/`ZoomableGroup`/`Geographies`/`Geography` from `react-simple-maps`.
- Produces: `ExploreMap()` — default export, `src/components/ExploreMap.jsx`, no props. Clicking a geography shows an info panel: for one of the 49 dataset countries, name + flag + unlocked status; for any other country, just the name from the topology's `properties.name`.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExploreMap from './ExploreMap.jsx';

vi.mock('../lib/worldAtlas.js', () => ({
  worldAtlasTopology: {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', id: '724', arcs: [[0]], properties: { name: 'Spain' } },
          { type: 'Polygon', id: '76', arcs: [[1]], properties: { name: 'Brazil' } },
          { type: 'Polygon', id: '32', arcs: [[1]], properties: { name: 'Argentina' } },
        ],
      },
    },
    arcs: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 0],
      ],
      [
        [20, 0],
        [30, 0],
        [30, 10],
        [20, 0],
      ],
    ],
  },
}));

describe('ExploreMap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows name, flag and locked status for a dataset country', async () => {
    render(<ExploreMap />);
    await userEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no lo has descubierto')).toBeInTheDocument();
  });

  it('shows unlocked status when the country is already in the album', async () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['ar']));
    render(<ExploreMap />);
    await userEvent.click(screen.getByTestId('geo-32'));
    expect(screen.getByText('¡Ya tienes este cromo!')).toBeInTheDocument();
  });

  it('shows only the name for a country outside the dataset', async () => {
    render(<ExploreMap />);
    await userEvent.click(screen.getByTestId('geo-76'));
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ExploreMap.test.jsx`
Expected: FAIL — `Failed to resolve import "./ExploreMap.jsx"`

- [ ] **Step 3: Write `src/components/ExploreMap.jsx`**

```jsx
import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { getUnlockedIds } from '../lib/progress.js';
import { matchesGeography } from '../lib/isoMap.js';
import FlagIcon from './FlagIcon.jsx';

function findDatasetCountry(geographyId) {
  return paises.find((pais) => matchesGeography(pais.flagCode, geographyId));
}

export default function ExploreMap() {
  const [selected, setSelected] = useState(null);

  const handleGeographyClick = (geo) => {
    const datasetCountry = findDatasetCountry(geo.id);
    if (datasetCountry) {
      setSelected({ inDataset: true, country: datasetCountry, unlocked: getUnlockedIds().includes(datasetCountry.id) });
    } else {
      setSelected({ inDataset: false, name: geo.properties.name });
    }
  };

  return (
    <section className="game explore-map">
      <ComposableMap>
        <ZoomableGroup>
          <Geographies geography={undefined}>{() => null}</Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {selected && (
        <div className="explore-panel">
          {selected.inDataset ? (
            <>
              <FlagIcon code={selected.country.flagCode} label={selected.country.name} size="small" />
              <p>{selected.country.name}</p>
              <p>{selected.unlocked ? '¡Ya tienes este cromo!' : 'Todavía no lo has descubierto'}</p>
            </>
          ) : (
            <p>{selected.name}</p>
          )}
        </div>
      )}
    </section>
  );
}
```

Note: the `ComposableMap`/`ZoomableGroup`/`Geographies` block above intentionally has no working `geography` prop yet — Step 3b below replaces it with the real, zoomable map now that the click-handling logic (which the test actually exercises via `data-testid`) is proven out.

- [ ] **Step 3b: Replace the placeholder map block with the real zoomable map**

Replace the `<ComposableMap>...</ComposableMap>` block in `src/components/ExploreMap.jsx` with:

```jsx
      <ComposableMap>
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={worldAtlasTopology}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-testid={`geo-${geo.id}`}
                  onClick={() => handleGeographyClick(geo)}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
```

And add the import at the top of the file:

```jsx
import { worldAtlasTopology } from '../lib/worldAtlas.js';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/ExploreMap.test.jsx`
Expected: 3 passed

- [ ] **Step 5: Wire it into `App.jsx`**

Add the import:

```jsx
import ExploreMap from './components/ExploreMap.jsx';
```

Replace `{screen === 'explore' && <p>Explorar mapa (próximamente)</p>}` with:

```jsx
{screen === 'explore' && <ExploreMap />}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Manual check (pinch-zoom/pan is not exercised by automated tests)**

Run: `npm run dev`, open "Explorar mapa" in a real browser (and ideally a touch device or browser touch emulation), confirm pinch-to-zoom and pan work, and confirm clicking one of the 49 dataset countries shows its flag while clicking any other country shows only its name.

- [ ] **Step 8: Commit**

```bash
git add src/components/ExploreMap.jsx src/components/ExploreMap.test.jsx src/App.jsx
git commit -m "feat: add free-exploration world map screen"
```

---

### Task 17: Touch-friendly responsive styling

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- None — pure CSS, no exported JS symbols. No new tests (visual styling is verified manually; every behavioral test from prior tasks must still pass unchanged).

- [ ] **Step 1: Replace `src/index.css`**

```css
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f8ff;
  color: #1a1a2e;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  text-align: center;
}

h1 {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
}

button {
  font-size: 1.1rem;
  min-height: 48px;
  min-width: 48px;
  padding: 0.75rem 1.25rem;
  margin: 0.4rem;
  border: none;
  border-radius: 12px;
  background: #4361ee;
  color: white;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.main-menu {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.flag-icon {
  display: inline-block;
  border-radius: 8px;
}

.flag-icon--large {
  width: 220px;
  height: 147px;
}

.flag-icon--small {
  width: 64px;
  height: 43px;
}

.feedback--correct {
  color: #2b9348;
}

.feedback--incorrect {
  color: #d90429;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.75rem;
}

.album-card {
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.5rem;
}

.album-card.locked {
  background: #e2e8f0;
}

.album-card__mystery {
  font-size: 2rem;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.5rem;
}

.memory-card {
  aspect-ratio: 1;
  font-size: 1.5rem;
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `npm test`
Expected: all tests passing (CSS changes do not affect test outcomes)

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open in a browser at a phone/tablet width (e.g. browser dev tools device toolbar at 768px), confirm every button is comfortably tappable (no overlapping controls, no text overflow) on every screen.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: touch-friendly responsive layout"
```

---

### Task 18: Production build check and deployment readiness

**Files:**
- Create: `README.md`

**Interfaces:**
- None.

- [ ] **Step 1: Verify the production build succeeds**

Run: `npm run build`
Expected: exits 0, creates a `dist/` folder

- [ ] **Step 2: Write `README.md`**

```markdown
# Banderas del Mundial

Juego de geografía para aprender los países y banderas del Mundial 2026 (48 clasificados + Italia).

## Desarrollo

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tests

\`\`\`bash
npm test
\`\`\`

## Build de producción

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Despliegue

Proyecto estático (Vite). En Vercel: "Import Project" desde el repositorio de GitHub,
framework preset "Vite", build command \`npm run build\`, output directory \`dist\`.
No requiere variables de entorno ni base de datos.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with dev, test and deploy instructions"
```

- [ ] **Step 4: Stop and ask the user before any remote/GitHub/Vercel action**

Do NOT create a GitHub repository, add a git remote, push, or connect Vercel automatically. Creating remote repos and pushing code are visible/hard-to-reverse actions. Ask the user: "¿Quieres que cree el repositorio en GitHub y lo despliegue en Vercel ahora, o prefieres hacerlo tú desde tu cuenta?" and proceed only per their answer.

---

## Plan Self-Review Notes

- **Spec coverage:** 4 game modes (Tasks 11-13, 15), sticker album (Task 10), explore map (Task 16), 49-country dataset incl. Italia (Task 2), localStorage-only persistence (Task 4), touch-friendly responsive layout (Task 17), Vercel/GitHub deployment readiness without auto-pushing (Task 18). All spec sections are covered.
- **England/Scotland gap found during planning:** the original spec didn't anticipate that England and Scotland share one polygon on any country-level world map. Resolved by documenting it as a Global Constraint and implementing it via `isoMap.js`'s explicit `gb-eng`/`gb-sct` → `826` mapping (Task 6), applied identically in both map-based modes (Tasks 15-16).
- **Type consistency check:** `Country = { id, name, flagCode }` is used identically across `paises.js`, `quiz.js`, `progress.js`, `memory.js`, `isoMap.js`, and every component. `unlockCountry(id)` and `getUnlockedIds()` signatures match between Task 4's definition and every later consumer.
