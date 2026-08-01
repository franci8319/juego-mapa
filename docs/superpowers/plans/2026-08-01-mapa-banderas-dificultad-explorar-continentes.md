# Mapa: Banderas, Dificultad, y Explorar Mejorado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In MapGame, show a small emoji flag on the map for every country guessed correctly this session, and make question difficulty progressive (easy-biased at first, converging to uniform after ~10 correct answers). In ExploreMap, redesign the continent picker as visual cards, compute continent framing from real country-centroid data instead of hand-guessed coordinates, and progressively reveal emoji flags for on-screen countries as the user zooms in.

**Architecture:** A new tiny `flagEmoji.js` helper (pure Unicode math, no dependencies) is shared by both MapGame and ExploreMap for the emoji markers. A new `continentView.js` computes continent center/zoom from the real centroids of that continent's own member countries (already computed once in `worldAtlas.js`), replacing the hand-tuned values previously stored in `continents.js`. Difficulty tiers are a new field on the existing `paises` dataset, consumed only by a new `pickWeightedCountry` in `quiz.js` — no other game mode is affected.

**Tech Stack:** Same as the existing project — React 18, Vite, `react-simple-maps` (adding its `Marker` component, already bundled, no new dependency), `d3-geo` (already a direct dependency), Vitest + React Testing Library.

## Global Constraints

- Emoji flags (`flagEmoji.js`) are used ONLY as the on-map decorative markers in MapGame and ExploreMap. Every other flag display in the app (Bandera→País, País→Bandera, Álbum, the big flag to guess in Mapa) keeps using the existing `FlagIcon`/`flag-icons` SVG rendering, unchanged.
- England/Scotland (`gb-eng`/`gb-sct`) both map to the 🇬🇧 emoji — there is no reliable cross-device 2-letter emoji for either individually.
- MapGame's revealed-flags-on-map state is session-only (component-local `useState`, not persisted to `localStorage`) — it resets every time the screen is left and re-entered. It is independent of the album's `unlockCountry`/`getUnlockedIds` persistence, which is unaffected by this plan.
- Difficulty tiers are `1` (easy), `2` (medium), `3` (hard). `pickWeightedCountry` must never throw or return `undefined` even if a tier's pool is empty for the given `countries` array (falls back to the full array).
- The continent-picker visual redesign must preserve each button's accessible name (the plain label text) exactly as today, since `App.jsx`/tests navigate by that name — the icon is decorative (`aria-hidden`), matching the pattern already used for the main menu.
- `continents.js` no longer stores `center`/`zoom` (replaced by `getContinentView`, computed from real data) — this is an intentional breaking change to that file's shape from the previous plan.

---

### Task 1: Emoji flag helper

**Files:**
- Create: `src/lib/flagEmoji.js`
- Test: `src/lib/flagEmoji.test.js`

**Interfaces:**
- Produces: `getFlagEmoji(flagCode: string): string` — exported from `src/lib/flagEmoji.js`. Builds the Unicode flag emoji from a 2-letter code (via the "regional indicator symbol" codepoint offset); `gb-eng`/`gb-sct` both resolve to the United Kingdom emoji. Used by `MapGame` (Task 4) and `ExploreMap` (Task 7).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/flagEmoji.test.js`
Expected: FAIL — `Failed to resolve import "./flagEmoji.js"`

- [ ] **Step 3: Write `src/lib/flagEmoji.js`**

```js
// Unicode "regional indicator symbol" letters run from U+1F1E6 ('A') to
// U+1F1FF ('Z'), in the same order as ASCII 'a'-'z'. A flag emoji is just
// two of these placed next to each other.
const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 0x61;

export function getFlagEmoji(flagCode) {
  const alpha2 = flagCode === 'gb-eng' || flagCode === 'gb-sct' ? 'gb' : flagCode;
  return [...alpha2.toLowerCase()]
    .map((char) => String.fromCodePoint(char.codePointAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join('');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/flagEmoji.test.js`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/flagEmoji.js src/lib/flagEmoji.test.js
git commit -m "feat: add emoji flag helper for on-map markers"
```

---

### Task 2: Difficulty field on the country dataset

**Files:**
- Modify: `src/data/paises.js`
- Modify: `src/data/paises.test.js`

**Interfaces:**
- Modifies: every entry in `paises` gains a `difficulty` field (`1 | 2 | 3`). Purely additive — `id`/`name`/`flagCode`/`continent` values are unchanged. Used by `MapGame` (Task 4) via `pickWeightedCountry` (Task 3).

- [ ] **Step 1: Write the failing test**

Append to the existing `describe('paises dataset', ...)` block in `src/data/paises.test.js`:

```js
it('gives every country a difficulty tier of 1, 2, or 3', () => {
  for (const pais of paises) {
    expect([1, 2, 3]).toContain(pais.difficulty);
  }
});

it('groups countries into the expected difficulty tier counts', () => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const pais of paises) {
    counts[pais.difficulty] += 1;
  }
  expect(counts).toEqual({ 1: 12, 2: 21, 3: 16 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/data/paises.test.js`
Expected: FAIL — 2 new failures, the pre-existing tests still pass

- [ ] **Step 3: Replace `src/data/paises.js`**

```js
export const paises = Object.freeze([
  { id: 'ca', name: 'Canadá', flagCode: 'ca', continent: 'america', difficulty: 1 },
  { id: 'mx', name: 'México', flagCode: 'mx', continent: 'america', difficulty: 1 },
  { id: 'us', name: 'Estados Unidos', flagCode: 'us', continent: 'america', difficulty: 1 },
  { id: 'jp', name: 'Japón', flagCode: 'jp', continent: 'asia', difficulty: 1 },
  { id: 'nz', name: 'Nueva Zelanda', flagCode: 'nz', continent: 'oceania', difficulty: 3 },
  { id: 'ir', name: 'Irán', flagCode: 'ir', continent: 'asia', difficulty: 3 },
  { id: 'ar', name: 'Argentina', flagCode: 'ar', continent: 'america', difficulty: 1 },
  { id: 'uz', name: 'Uzbekistán', flagCode: 'uz', continent: 'asia', difficulty: 3 },
  { id: 'jo', name: 'Jordania', flagCode: 'jo', continent: 'asia', difficulty: 3 },
  { id: 'kr', name: 'Corea del Sur', flagCode: 'kr', continent: 'asia', difficulty: 2 },
  { id: 'au', name: 'Australia', flagCode: 'au', continent: 'oceania', difficulty: 2 },
  { id: 'br', name: 'Brasil', flagCode: 'br', continent: 'america', difficulty: 1 },
  { id: 'ec', name: 'Ecuador', flagCode: 'ec', continent: 'america', difficulty: 2 },
  { id: 'py', name: 'Paraguay', flagCode: 'py', continent: 'america', difficulty: 3 },
  { id: 'uy', name: 'Uruguay', flagCode: 'uy', continent: 'america', difficulty: 2 },
  { id: 'co', name: 'Colombia', flagCode: 'co', continent: 'america', difficulty: 2 },
  { id: 'ma', name: 'Marruecos', flagCode: 'ma', continent: 'africa', difficulty: 2 },
  { id: 'tn', name: 'Túnez', flagCode: 'tn', continent: 'africa', difficulty: 3 },
  { id: 'eg', name: 'Egipto', flagCode: 'eg', continent: 'africa', difficulty: 2 },
  { id: 'dz', name: 'Argelia', flagCode: 'dz', continent: 'africa', difficulty: 3 },
  { id: 'gh', name: 'Ghana', flagCode: 'gh', continent: 'africa', difficulty: 2 },
  { id: 'cv', name: 'Cabo Verde', flagCode: 'cv', continent: 'africa', difficulty: 3 },
  { id: 'qa', name: 'Catar', flagCode: 'qa', continent: 'asia', difficulty: 2 },
  { id: 'sa', name: 'Arabia Saudí', flagCode: 'sa', continent: 'asia', difficulty: 2 },
  { id: 'sn', name: 'Senegal', flagCode: 'sn', continent: 'africa', difficulty: 2 },
  { id: 'za', name: 'Sudáfrica', flagCode: 'za', continent: 'africa', difficulty: 2 },
  { id: 'ci', name: 'Costa de Marfil', flagCode: 'ci', continent: 'africa', difficulty: 3 },
  { id: 'gb-eng', name: 'Inglaterra', flagCode: 'gb-eng', continent: 'europa', difficulty: 1 },
  { id: 'fr', name: 'Francia', flagCode: 'fr', continent: 'europa', difficulty: 1 },
  { id: 'hr', name: 'Croacia', flagCode: 'hr', continent: 'europa', difficulty: 2 },
  { id: 'pt', name: 'Portugal', flagCode: 'pt', continent: 'europa', difficulty: 1 },
  { id: 'no', name: 'Noruega', flagCode: 'no', continent: 'europa', difficulty: 2 },
  { id: 'de', name: 'Alemania', flagCode: 'de', continent: 'europa', difficulty: 1 },
  { id: 'nl', name: 'Países Bajos', flagCode: 'nl', continent: 'europa', difficulty: 2 },
  { id: 'ch', name: 'Suiza', flagCode: 'ch', continent: 'europa', difficulty: 2 },
  { id: 'gb-sct', name: 'Escocia', flagCode: 'gb-sct', continent: 'europa', difficulty: 2 },
  { id: 'es', name: 'España', flagCode: 'es', continent: 'europa', difficulty: 1 },
  { id: 'at', name: 'Austria', flagCode: 'at', continent: 'europa', difficulty: 2 },
  { id: 'be', name: 'Bélgica', flagCode: 'be', continent: 'europa', difficulty: 2 },
  { id: 'pa', name: 'Panamá', flagCode: 'pa', continent: 'america', difficulty: 3 },
  { id: 'cw', name: 'Curazao', flagCode: 'cw', continent: 'america', difficulty: 3 },
  { id: 'ht', name: 'Haití', flagCode: 'ht', continent: 'america', difficulty: 3 },
  { id: 'ba', name: 'Bosnia y Herzegovina', flagCode: 'ba', continent: 'europa', difficulty: 3 },
  { id: 'se', name: 'Suecia', flagCode: 'se', continent: 'europa', difficulty: 2 },
  { id: 'tr', name: 'Turquía', flagCode: 'tr', continent: 'europa', difficulty: 2 },
  { id: 'cz', name: 'Chequia', flagCode: 'cz', continent: 'europa', difficulty: 3 },
  { id: 'cd', name: 'RD Congo', flagCode: 'cd', continent: 'africa', difficulty: 3 },
  { id: 'iq', name: 'Irak', flagCode: 'iq', continent: 'asia', difficulty: 3 },
  { id: 'it', name: 'Italia', flagCode: 'it', continent: 'europa', difficulty: 1 },
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/paises.test.js`
Expected: 8 passed (6 existing + 2 new)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests still passing (purely additive field, no existing consumer reads `pais.difficulty`)

- [ ] **Step 6: Commit**

```bash
git add src/data/paises.js src/data/paises.test.js
git commit -m "feat: add difficulty tier field to the country dataset"
```

---

### Task 3: Weighted difficulty-aware country picker

**Files:**
- Modify: `src/lib/quiz.js`
- Modify: `src/lib/quiz.test.js`

**Interfaces:**
- Produces: `pickWeightedCountry(countries: Country[], correctCount: number): Country` — exported from `src/lib/quiz.js`, alongside the existing `pickRandomCountry`/`buildOptions`. Picks a difficulty tier (1/2/3) with probabilities that start heavily favoring tier 1 and linearly converge to uniform (1/3 each) by `correctCount === 10`, then picks uniformly at random within that tier. Falls back to the full `countries` array if no country in the chosen tier exists. Used by `MapGame` (Task 4).

- [ ] **Step 1: Write the failing test**

```js
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickWeightedCountry } from './quiz.js';

const countries = [
  { id: 'a', difficulty: 1 },
  { id: 'b', difficulty: 2 },
  { id: 'c', difficulty: 3 },
];

describe('pickWeightedCountry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('heavily favors tier 1 at correctCount 0', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    expect(pickWeightedCountry(countries, 0).id).toBe('a');
  });

  it('can still pick tier 3 at correctCount 0 for a high roll (never fully excluded)', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(pickWeightedCountry(countries, 0).id).toBe('c');
  });

  it('becomes uniform across tiers once correctCount reaches 10', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0);
    expect(pickWeightedCountry(countries, 10).id).toBe('b');
  });

  it('falls back to the full pool if no country matches the chosen tier', () => {
    const onlyTier1 = [{ id: 'a', difficulty: 1 }];
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.99).mockReturnValueOnce(0);
    expect(pickWeightedCountry(onlyTier1, 0).id).toBe('a');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/quiz.test.js`
Expected: FAIL — `pickWeightedCountry` is not exported yet (the 3 pre-existing tests still pass)

- [ ] **Step 3: Add to `src/lib/quiz.js`** (append after the existing `buildOptions` function)

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/quiz.test.js`
Expected: 7 passed (3 existing + 4 new)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/lib/quiz.js src/lib/quiz.test.js
git commit -m "feat: add difficulty-weighted country picker"
```

---

### Task 4: MapGame — difficulty-weighted picking and on-map flag markers

**Files:**
- Modify: `src/components/MapGame.jsx`
- Modify: `src/components/MapGame.test.jsx`

**Interfaces:**
- Consumes: `pickWeightedCountry` from `src/lib/quiz.js` (Task 3, replaces `pickRandomCountry` for target selection), `getFlagEmoji` from `src/lib/flagEmoji.js` (Task 1), `Marker` from `react-simple-maps` (already installed).
- Produces: `MapGame()` — same default export contract, no props. Adds session-local `revealedFlags` state.

- [ ] **Step 1: Replace `src/components/MapGame.test.jsx`**

```jsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MapGame from './MapGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';
import { pickWeightedCountry } from '../lib/quiz.js';
import { getCentroid } from '../lib/worldAtlas.js';

vi.mock('../lib/quiz.js', () => ({
  pickWeightedCountry: vi.fn(() => ({ id: 'es', name: 'España', flagCode: 'es', difficulty: 1 })),
}));

// hasMapGeometry here only allows 'es' (Spain) and 'fr' (France, used for
// the wrong-answer polygon) through, so tests can assert that MapGame's
// target pool was actually filtered down from the full ~49-country
// `paises` dataset, rather than trivially passing regardless of filtering.
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
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'fr',
  getCentroid: vi.fn(() => [0, 0]),
}));

// react-simple-maps' ZoomableGroup wires a native "mousedown.zoom" d3-zoom
// listener directly on the <svg>, which throws in jsdom on the full pointer
// event sequence userEvent.click dispatches (missing SVGAnimatedRect/event
// internals). fireEvent.click dispatches only a bare "click" event, which
// d3-zoom never listens for, so it safely exercises the same onClick handler
// React relies on without touching d3-zoom's separate gesture listener.
// (Same pattern already used in ExploreMap.test.jsx.)

const ZOOM_LOCK_MS = 4050; // ZOOM_START_DELAY_MS (50) + ZOOM_DURATION_MS (4000)

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    pickWeightedCountry.mockClear();
    getCentroid.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only targets countries that have geometry on the map', () => {
    render(<MapGame />);
    expect(pickWeightedCountry).toHaveBeenCalledTimes(1);
    const [pool] = pickWeightedCountry.mock.calls[0];
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((pais) => pais.flagCode === 'es' || pais.flagCode === 'fr')).toBe(true);
    expect(pool.some((pais) => pais.flagCode === 'cv')).toBe(false);
  });

  it('picks the initial target with correctCount 0', () => {
    render(<MapGame />);
    const [, correctCount] = pickWeightedCountry.mock.calls[0];
    expect(correctCount).toBe(0);
  });

  it('prompts with the target country flag and a replay button', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir en voz alta' })).toBeInTheDocument();
  });

  it('locks map clicks during the zoom-in animation', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('unlocks map clicks once the zoom-in animation finishes', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows "Prueba con otra" on a wrong click after the zoom, keeps the question open, and does not unlock', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('never reveals the correct country on a wrong click', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByTestId('geo-724')).not.toHaveAttribute('style');
  });

  it('flashes the clicked wrong geography red and clears it after 700ms', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    const wrongGeo = screen.getByTestId('geo-250');
    fireEvent.click(wrongGeo);
    expect(wrongGeo.style.fill).toBe('#d90429');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(wrongGeo.style.fill).toBe('');
  });

  it('unlocks and auto-advances to a fresh target with an incremented correctCount', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
    expect(pickWeightedCountry).toHaveBeenCalledTimes(2);
    const [, secondCorrectCount] = pickWeightedCountry.mock.calls[1];
    expect(secondCorrectCount).toBe(1);
  });

  it('never shows a "Siguiente" button', () => {
    render(<MapGame />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('still locks map clicks 1ms before the zoom-in animation finishes', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS - 1);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(getUnlockedIds()).toEqual([]);
  });

  it('applies the map-game-zoom transition class only while the zoom-in animation is running', () => {
    const { container } = render(<MapGame />);
    expect(container.querySelector('.map-game-zoom')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    expect(container.querySelector('.map-game-zoom')).toBeFalsy();
  });

  it('computes the zoom center from the real target centroid', () => {
    render(<MapGame />);
    expect(getCentroid).toHaveBeenCalledWith('es');
  });

  it('places a flag marker on the map after a correct answer, and not before', () => {
    render(<MapGame />);
    expect(screen.queryByText('🇪🇸')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));

    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: FAIL — `pickWeightedCountry` mock isn't consumed yet (component still imports `pickRandomCountry`), no flag markers render

- [ ] **Step 3: Replace `src/components/MapGame.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickWeightedCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import { getFlagEmoji } from '../lib/flagEmoji.js';
import { speak } from '../lib/speech.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

// The bundled 110m-resolution atlas drops some small island states (e.g.
// Cabo Verde, Curazao), so only countries that actually have a clickable
// polygon on the map may be asked about here — otherwise the question
// would be unwinnable. Other game modes still use the full `paises` list.
const mappableCountries = paises.filter((pais) => hasMapGeometry(pais.flagCode));

const ADVANCE_DELAY_MS = 1800;
const WRONG_FLASH_MS = 700;
// Keep ZOOM_DURATION_MS in sync with the transition duration on
// `.map-game-zoom` in src/index.css — they drive the same animation from
// two different places (React's click-lock timer and the CSS transition).
const ZOOM_DURATION_MS = 4000;
const ZOOM_START_DELAY_MS = 50; // lets the world-view frame paint before animating to the target
const TARGET_ZOOM = 4;
const WORLD_VIEW = { center: [0, 0], zoom: 1 };

function announceTarget(target) {
  return ['Encuentra este país en el mapa', target.name];
}

export default function MapGame() {
  const [target, setTarget] = useState(() => pickWeightedCountry(mappableCountries, 0));
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongGeoId, setWrongGeoId] = useState(null);
  const [mapView, setMapView] = useState(WORLD_VIEW);
  const [isZooming, setIsZooming] = useState(true);
  // Session-only: which countries the child has already found this visit,
  // so their flag can stay pinned on the map. Not persisted — resets every
  // time this screen is left and re-entered.
  const [revealedFlags, setRevealedFlags] = useState([]);

  // Must run BEFORE the feedback effect below: on auto-advance, `target`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    speak(announceTarget(target));
  }, [target]);

  // Resets the map to the world view, then (after a short delay so the
  // browser paints that reset frame first) animates toward the target's
  // real centroid — the CSS transition on `.map-game-zoom` is what makes
  // this a smooth zoom rather than an instant jump. Clicks are locked for
  // the whole animation window via `isZooming`.
  useEffect(() => {
    setMapView(WORLD_VIEW);
    setIsZooming(true);
    const centroid = getCentroid(target.flagCode);
    const startZoomTimer = setTimeout(() => {
      setMapView(centroid ? { center: centroid, zoom: TARGET_ZOOM } : WORLD_VIEW);
    }, ZOOM_START_DELAY_MS);
    const unlockTimer = setTimeout(() => setIsZooming(false), ZOOM_START_DELAY_MS + ZOOM_DURATION_MS);
    return () => {
      clearTimeout(startZoomTimer);
      clearTimeout(unlockTimer);
    };
  }, [target]);

  // Must run AFTER the "announce target" effect above — see the comment
  // there for why the ordering matters.
  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    // correctCount is read from this render's closure rather than added to
    // the dependency array below: it only ever changes together with
    // feedback (both set in this same timeout), so the closure can't go
    // stale independently of feedback changing too.
    const nextCorrectCount = correctCount + 1;
    const timer = setTimeout(() => {
      setFeedback(null);
      setWrongGeoId(null);
      setCorrectCount(nextCorrectCount);
      setTarget(pickWeightedCountry(mappableCountries, nextCorrectCount));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (!wrongGeoId) return undefined;
    const timer = setTimeout(() => setWrongGeoId(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [wrongGeoId]);

  const handleGeographyClick = useCallback(
    (geo) => {
      if (feedback?.correct || isZooming) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
        setWrongGeoId(null);
        setRevealedFlags((prev) => (prev.includes(target.id) ? prev : [...prev, target.id]));
      } else {
        setFeedback({ correct: false, message: 'Prueba con otra' });
        setWrongGeoId(geo.id);
      }
    },
    [target, feedback, isZooming]
  );

  const replay = useCallback(() => {
    speak(announceTarget(target));
  }, [target]);

  return (
    <section className="game map-game">
      <FlagIcon code={target.flagCode} label={`Encuentra: ${target.name}`} size="large" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <ComposableMap>
        {/* The transition class is only applied while isZooming: it must
            drop off once the intro animation ends, or it also smears the
            child's own drag/pinch gestures afterward (every pan frame would
            animate over 4s instead of tracking the finger instantly). */}
        <ZoomableGroup
          className={isZooming ? 'map-game-zoom' : ''}
          center={mapView.center}
          zoom={mapView.zoom}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={worldAtlasTopology}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-testid={`geo-${geo.id}`}
                  onClick={() => handleGeographyClick(geo)}
                  style={
                    geo.id === wrongGeoId
                      ? { default: { fill: '#d90429', stroke: '#ffffff', strokeWidth: 1 } }
                      : undefined
                  }
                />
              ))
            }
          </Geographies>
          {revealedFlags.map((id) => {
            const pais = mappableCountries.find((p) => p.id === id);
            const centroid = pais && getCentroid(pais.flagCode);
            if (!centroid) return null;
            return (
              <Marker key={id} coordinates={centroid}>
                <text textAnchor="middle" dy={3} style={{ fontSize: 10, pointerEvents: 'none' }}>
                  {getFlagEmoji(pais.flagCode)}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: 14 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/components/MapGame.jsx src/components/MapGame.test.jsx
git commit -m "feat: add difficulty-weighted picking and on-map flag markers to MapGame"
```

---

### Task 5: Simplify `continents.js` to visual metadata only

**Files:**
- Modify: `src/data/continents.js`
- Modify: `src/data/continents.test.js`

**Interfaces:**
- Modifies: `continents` entries change shape from `{ id, label, center, zoom }` to `{ id, label, icon, color }`. `center`/`zoom` are no longer stored here — they are now computed by `getContinentView` (Task 6) from real country data. This is an intentional breaking change to this file's exported shape.

- [ ] **Step 1: Replace `src/data/continents.test.js`**

```js
import { describe, expect, it } from 'vitest';
import { continents } from './continents.js';

describe('continents', () => {
  it('has exactly 5 continents with unique ids', () => {
    expect(continents).toHaveLength(5);
    const ids = continents.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids.sort()).toEqual(['africa', 'america', 'asia', 'europa', 'oceania']);
  });

  it('gives every continent a label, an icon, and a color', () => {
    for (const continent of continents) {
      expect(continent.label.length).toBeGreaterThan(0);
      expect(continent.icon.length).toBeGreaterThan(0);
      expect(continent.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/data/continents.test.js`
Expected: FAIL — current entries have `center`/`zoom`, not `icon`/`color`

- [ ] **Step 3: Replace `src/data/continents.js`**

```js
export const continents = Object.freeze([
  { id: 'america', label: 'América', icon: '🌎', color: '#4361ee' },
  { id: 'europa', label: 'Europa', icon: '🏰', color: '#7209b7' },
  { id: 'africa', label: 'África', icon: '🦁', color: '#f77f00' },
  { id: 'asia', label: 'Asia', icon: '🐉', color: '#e63946' },
  { id: 'oceania', label: 'Oceanía', icon: '🐨', color: '#2b9348' },
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/continents.test.js`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/data/continents.js src/data/continents.test.js
git commit -m "feat: simplify continents data to visual metadata (icon/color)"
```

(This will leave `ExploreMap.jsx` referencing the now-removed `continent.center`/`continent.zoom` — that's fixed in Task 7, which lands right after Task 6. Do not attempt to run `ExploreMap.test.jsx` or the full suite as part of this task; it is expected to fail until Task 7 lands.)

---

### Task 6: Compute continent framing from real country data

**Files:**
- Create: `src/lib/continentView.js`
- Test: `src/lib/continentView.test.js`

**Interfaces:**
- Consumes: `paises` from `src/data/paises.js` (its `continent` field), `getCentroid`/`hasMapGeometry` from `src/lib/worldAtlas.js`.
- Produces: `getContinentView(continentId: string): { center: [number, number], zoom: number }` — exported from `src/lib/continentView.js`. Computes the center as the midpoint of the bounding box of that continent's member countries' real centroids (not their full geometry — using full geometry would include remote overseas territories like French Guiana or the Aleutian Islands and badly distort the box), and a zoom inversely proportional to that bounding box's span, clamped to a sane range. Returns a default world view for an unrecognized continent id. Used by `ExploreMap` (Task 7).

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { getContinentView } from './continentView.js';

describe('getContinentView', () => {
  it('centers Europa roughly over central Europe with a zoomed-in view', () => {
    const { center, zoom } = getContinentView('europa');
    expect(center[0]).toBeGreaterThan(5);
    expect(center[0]).toBeLessThan(25);
    expect(center[1]).toBeGreaterThan(45);
    expect(center[1]).toBeLessThan(60);
    expect(zoom).toBeGreaterThan(1.2);
  });

  it('centers Oceanía between New Zealand and Australia', () => {
    const { center } = getContinentView('oceania');
    expect(center[0]).toBeGreaterThan(140);
    expect(center[1]).toBeLessThan(-20);
  });

  it('returns a default world view for an unknown continent id', () => {
    expect(getContinentView('atlantida')).toEqual({ center: [0, 0], zoom: 1 });
  });

  it('always returns a zoom within the configured bounds for every real continent', () => {
    for (const id of ['america', 'europa', 'africa', 'asia', 'oceania']) {
      const { zoom } = getContinentView(id);
      expect(zoom).toBeGreaterThanOrEqual(1.2);
      expect(zoom).toBeLessThanOrEqual(6);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/continentView.test.js`
Expected: FAIL — `Failed to resolve import "./continentView.js"`

- [ ] **Step 3: Write `src/lib/continentView.js`**

```js
import { paises } from '../data/paises.js';
import { getCentroid, hasMapGeometry } from './worldAtlas.js';

const ZOOM_K = 150;
const MIN_ZOOM = 1.2;
const MAX_ZOOM = 6;
const DEFAULT_VIEW = { center: [0, 0], zoom: 1 };

export function getContinentView(continentId) {
  const centroids = paises
    .filter((pais) => pais.continent === continentId && hasMapGeometry(pais.flagCode))
    .map((pais) => getCentroid(pais.flagCode))
    .filter(Boolean);

  if (centroids.length === 0) return DEFAULT_VIEW;

  const lons = centroids.map((c) => c[0]);
  const lats = centroids.map((c) => c[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const span = Math.max(maxLon - minLon, maxLat - minLat, 1);
  const zoom = Math.min(Math.max(ZOOM_K / span, MIN_ZOOM), MAX_ZOOM);
  return { center, zoom };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/continentView.test.js`
Expected: 4 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass EXCEPT `ExploreMap.test.jsx`, which still references the old `continents.js` shape removed in Task 5 — this is expected and fixed in Task 7 next. Confirm no OTHER test file regressed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/continentView.js src/lib/continentView.test.js
git commit -m "feat: compute continent map framing from real country centroids"
```

---

### Task 7: ExploreMap — visual continent cards, real framing, and progressive flag reveal

**Files:**
- Modify: `src/components/ExploreMap.jsx`
- Modify: `src/components/ExploreMap.test.jsx`

**Interfaces:**
- Consumes: `continents` (new `icon`/`color` shape from Task 5), `getContinentView` from `src/lib/continentView.js` (Task 6), `getFlagEmoji` from `src/lib/flagEmoji.js` (Task 1), `Marker` from `react-simple-maps`.
- Produces: `ExploreMap()` — same default export contract, no props.

- [ ] **Step 1: Replace `src/components/ExploreMap.test.jsx`**

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExploreMap from './ExploreMap.jsx';

// hasMapGeometry/getCentroid here only recognize 'es' and 'ar' — both real
// entries in src/data/paises.js (continent 'europa' and 'america'
// respectively) — and both resolve to the SAME fixed centroid. That keeps
// getContinentView's real computation deterministic for this test file
// without needing to hardcode real-world geographic values here (those are
// already covered by continentView.test.js's own dedicated tests).
vi.mock('../lib/worldAtlas.js', () => ({
  worldAtlasTopology: {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', id: '724', arcs: [[0]], properties: { name: 'Spain' } },
          { type: 'Polygon', id: '156', arcs: [[1]], properties: { name: 'China' } },
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
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'ar',
  getCentroid: (flagCode) => (flagCode === 'es' || flagCode === 'ar' ? [10, 20] : null),
}));

describe('ExploreMap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a continent picker with 5 continents and a "whole world" option', () => {
    render(<ExploreMap />);
    expect(screen.getByRole('button', { name: 'América' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Europa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'África' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Asia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oceanía' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver el mundo entero' })).toBeInTheDocument();
  });

  it('shows a distinct icon for every continent card', () => {
    render(<ExploreMap />);
    expect(screen.getByText('🌎')).toBeInTheDocument();
    expect(screen.getByText('🏰')).toBeInTheDocument();
    expect(screen.getByText('🦁')).toBeInTheDocument();
    expect(screen.getByText('🐉')).toBeInTheDocument();
    expect(screen.getByText('🐨')).toBeInTheDocument();
  });

  it('shows the map and a way back after choosing "Ver el mundo entero"', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.getByTestId('geo-724')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '◀ Elegir otro continente' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Europa' })).not.toBeInTheDocument();
  });

  it('shows the map after choosing a specific continent', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByTestId('geo-724')).toBeInTheDocument();
  });

  it('returns to the picker when "Elegir otro continente" is clicked', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    fireEvent.click(screen.getByRole('button', { name: '◀ Elegir otro continente' }));
    expect(screen.getByRole('button', { name: 'Europa' })).toBeInTheDocument();
    expect(screen.queryByTestId('geo-724')).not.toBeInTheDocument();
  });

  it('shows name, flag and locked status for a dataset country', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no lo has descubierto')).toBeInTheDocument();
  });

  it('shows unlocked status when the country is already in the album', () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['ar']));
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-32'));
    expect(screen.getByText('¡Ya tienes este cromo!')).toBeInTheDocument();
  });

  it('shows only the name for a country outside the dataset', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-156'));
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('clears the stale country panel when switching continents', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '◀ Elegir otro continente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.queryByText('España')).not.toBeInTheDocument();
  });

  it('does not show flag emoji markers at the default world zoom', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.queryByText('🇪🇸')).not.toBeInTheDocument();
  });

  it('shows flag emoji markers once a continent is zoomed in enough', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ExploreMap.test.jsx`
Expected: FAIL — current component still reads the removed `continent.center`/`continent.zoom`, has no icons, no flag markers

- [ ] **Step 3: Replace `src/components/ExploreMap.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { continents } from '../data/continents.js';
import { getUnlockedIds } from '../lib/progress.js';
import { matchesGeography } from '../lib/isoMap.js';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
import { getContinentView } from '../lib/continentView.js';
import { getFlagEmoji } from '../lib/flagEmoji.js';
import FlagIcon from './FlagIcon.jsx';

// Below this zoom level the whole world (or most of it) is visible, and
// showing all 47 flag emoji at once would be an illegible pile — flags only
// start appearing once the view is zoomed in at least this much (any single
// continent's computed zoom already clears this; only the "whole world"
// view and light pinch-outs stay below it).
const FLAG_REVEAL_ZOOM = 1.3;

const flaggableCountries = paises.filter((pais) => hasMapGeometry(pais.flagCode));

function findDatasetCountry(geographyId) {
  return paises.find((pais) => matchesGeography(pais.flagCode, geographyId));
}

export default function ExploreMap() {
  const [continent, setContinent] = useState(null); // null | 'world' | { id, label, icon, color }
  const [selected, setSelected] = useState(null);
  const [liveZoom, setLiveZoom] = useState(1);

  const zoomProps =
    continent === 'world' || !continent
      ? { zoom: 1, minZoom: 1, maxZoom: 8 }
      : { ...getContinentView(continent.id), minZoom: 1, maxZoom: 8 };

  // Syncs liveZoom to the newly-selected continent's computed zoom (or 1 for
  // "world"). onMoveEnd (in the JSX below) then keeps it live as the user
  // pinch-zooms further, which is what actually drives the progressive flag
  // reveal — zoomProps.zoom alone only reflects the *initial* framing.
  useEffect(() => {
    if (continent) setLiveZoom(zoomProps.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continent]);

  const handleGeographyClick = (geo) => {
    const datasetCountry = findDatasetCountry(geo.id);
    if (datasetCountry) {
      setSelected({ inDataset: true, country: datasetCountry, unlocked: getUnlockedIds().includes(datasetCountry.id) });
    } else {
      setSelected({ inDataset: false, name: geo.properties.name });
    }
  };

  if (!continent) {
    return (
      <section className="game explore-map">
        <p>¿Qué continente quieres explorar?</p>
        <div className="continent-picker">
          {continents.map((c) => (
            <button
              key={c.id}
              type="button"
              className="continent-card"
              style={{ background: c.color }}
              onClick={() => setContinent(c)}
            >
              <span className="continent-card__icon" aria-hidden="true">
                {c.icon}
              </span>
              <span className="continent-card__label">{c.label}</span>
            </button>
          ))}
          <button type="button" className="continent-card" onClick={() => setContinent('world')}>
            <span className="continent-card__icon" aria-hidden="true">
              🌐
            </span>
            <span className="continent-card__label">Ver el mundo entero</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="game explore-map">
      <button
        type="button"
        onClick={() => {
          setContinent(null);
          setSelected(null);
        }}
      >
        ◀ Elegir otro continente
      </button>
      <ComposableMap>
        <ZoomableGroup {...zoomProps} onMoveEnd={({ zoom }) => setLiveZoom(zoom)}>
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
          {liveZoom >= FLAG_REVEAL_ZOOM &&
            flaggableCountries.map((pais) => {
              const centroid = getCentroid(pais.flagCode);
              if (!centroid) return null;
              return (
                <Marker key={pais.id} coordinates={centroid}>
                  <text textAnchor="middle" dy={3} style={{ fontSize: 10, pointerEvents: 'none' }}>
                    {getFlagEmoji(pais.flagCode)}
                  </text>
                </Marker>
              );
            })}
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/ExploreMap.test.jsx`
Expected: 11 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 7: Commit**

```bash
git add src/components/ExploreMap.jsx src/components/ExploreMap.test.jsx
git commit -m "feat: visual continent cards, real-data framing, and flag reveal in ExploreMap"
```

---

### Task 8: CSS for the new visual elements

**Files:**
- Modify: `src/index.css`

**Interfaces:** None — pure CSS. No behavioral tests; the full suite must still pass unchanged.

- [ ] **Step 1: Append to `src/index.css`**

```css
.continent-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  min-height: 100px;
  margin: 0;
  padding: 0.75rem;
}

.continent-card__icon {
  font-size: 2.5rem;
  line-height: 1;
}

.continent-card__label {
  font-size: 0.9rem;
}

.rsm-svg {
  overflow: hidden;
}
```

The `overflow: hidden` addition to the existing `.rsm-svg` rule (already present in this file from earlier work) ensures flag markers positioned outside the currently panned/zoomed viewport are actually clipped rather than rendered off to the side — this specific visual behavior cannot be verified by the automated test suite (jsdom does not lay out or clip SVG), so confirm it manually per Task 9.

- [ ] **Step 2: Run the full suite to confirm nothing broke**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 3: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: add visuals for continent cards and map SVG clipping"
```

---

### Task 9: Final verification

**Files:** None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests passing, 0 failures

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: exits 0, `dist/` produced

- [ ] **Step 3: Manual browser check (cannot be automated — no browser available to the agent)**

Run `npm run dev`, and on a real device:
- Mapa: confirm the emoji flags actually render as recognizable flags (not broken glyphs) on the device's emoji font, appear at roughly the right spot on the map after a correct answer, and stay put as more are earned; confirm the first several questions of a fresh session lean toward well-known countries and gradually include less-known ones.
- Explorar mapa: confirm the continent cards look right; confirm picking each of the 5 continents does NOT show visible slivers of a neighboring continent at the edges (this is the main thing this whole plan was meant to fix — if any continent still looks wrong, note which one, since the zoom formula may need recalibrating for that specific continent); confirm flag emoji progressively appear as you zoom in (both via picking a continent and via pinch-zooming manually from the world view) and that off-screen countries' flags are not visible piled up elsewhere.

- [ ] **Step 4: Report**

No commit for this task — if the manual check finds a real issue (e.g., one continent still shows a neighbor, a specific emoji renders as a broken box on the child's phone), report it back rather than silently fixing it, since these are calibration/product judgment calls the human should see before a fix is picked.

## Plan Self-Review Notes

- **Spec coverage:** emoji flags on MapGame's map, session-only (Task 4); progressive difficulty in MapGame (Tasks 2-4); visual continent-picker cards (Tasks 5, 7); continent framing computed from real data instead of hand-guessed values (Tasks 6-7); progressive flag reveal while zooming in ExploreMap (Task 7). All design doc sections covered. Explicitly out-of-scope items from the design doc (no persistence of map flags between visits, no dynamic difficulty reclassification, no per-country tight zoom on tap in ExploreMap) are respected — nothing in this plan implements them.
- **Type consistency:** `pickWeightedCountry(countries, correctCount)` signature matches between its Task 3 definition and Task 4's two call sites (initial `useState` and the auto-advance timer). `getContinentView(continentId)` return shape `{ center, zoom }` matches between Task 6's definition and Task 7's `zoomProps` construction. `getFlagEmoji(flagCode)` is used identically in Tasks 4 and 7.
- **Cross-task dependency check:** Task 5 (continents.js) intentionally breaks `ExploreMap.jsx` until Task 7 lands immediately after Task 6 — called out explicitly in Task 5 and Task 6's steps so it isn't mistaken for a regression mid-plan.
- **Placeholder scan:** none found — every step has complete code.
