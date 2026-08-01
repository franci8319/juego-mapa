# Menú Visual, Zoom en Mapa, Narración Resaltada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Memory game mode, redesign the main menu into a visual emoji/color-coded 2-column grid a 4-year-old can navigate without reading, add a 4-second animated zoom from world view to the target country in the Mapa game mode (with clicks locked during the animation), and highlight the button being narrated in Bandera→País while blocking answers until the narration finishes.

**Architecture:** Four independent-but-related changes, each touching a small, well-scoped set of files. The zoom animation reuses the CSS-transition-on-controlled-props technique already proven for the SVG map rendering in this project, scoped to MapGame only via an explicit `className` (never applied to ExploreMap's `ZoomableGroup`, which needs its drag/pinch gestures to stay instantaneous). The narration highlight extends the already-shared `useMultipleChoiceQuestion` hook with an optional signal (`narratingIndex`) that `CountryToFlag` simply ignores, keeping its behavior unchanged.

**Tech Stack:** Same as the existing project — React 18, Vite, `react-simple-maps`, Vitest + React Testing Library. New direct dependency: `d3-geo` (for computing real country centroids; already present transitively via `react-simple-maps`, being promoted to a direct dependency per this project's established convention of not relying on undeclared transitive packages — see `world-atlas`/`topojson-client` in the original plan).

## Global Constraints

- UI language: Spanish only.
- No lives/timer/punitive-fail system (already established) — none of these changes introduce one.
- The CSS transition added for the Mapa zoom animation must be scoped ONLY to MapGame's `ZoomableGroup` (via a dedicated `className`) — it must NEVER apply to ExploreMap's `ZoomableGroup`, whose pan/pinch-zoom gestures need to move instantly with the user's finger, not animate on every frame.
- `CountryToFlag`'s existing behavior (answerable immediately, no narration lock) must not change — it shares `useMultipleChoiceQuestion` with `FlagToCountry` but simply does not use the new `narratingIndex` value.
- `speak()`'s new `onEnd` callback must fire even when `speechSynthesis` is unavailable (jsdom, or a real browser without support) — otherwise a caller that gates interaction on "narration finished" (Bandera→País) would lock forever on such a device.
- `MemoryGame`/`memory.js` and all their tests are deleted entirely, not just unwired — no dead code left behind.

---

### Task 1: Remove the Memory game mode

**Files:**
- Delete: `src/components/MemoryGame.jsx`
- Delete: `src/components/MemoryGame.test.jsx`
- Delete: `src/lib/memory.js`
- Delete: `src/lib/memory.test.js`
- Modify: `src/components/MainMenu.jsx`
- Modify: `src/components/MainMenu.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Modifies: `MainMenu`'s exported `SCREENS` array drops the `memory` entry (still `{ id, label }` shape for now — the `icon`/`color` fields are added in Task 2, not here, to keep this task's diff focused on removal only).

- [ ] **Step 1: Delete the four Memory files**

```bash
git rm src/components/MemoryGame.jsx src/components/MemoryGame.test.jsx src/lib/memory.js src/lib/memory.test.js
```

- [ ] **Step 2: Update `src/components/MainMenu.jsx`** — remove the `memory` entry from `SCREENS`

```jsx
export const SCREENS = [
  { id: 'flag-to-country', label: 'Bandera → País' },
  { id: 'country-to-flag', label: 'País → Bandera' },
  { id: 'map-game', label: 'Mapa' },
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

- [ ] **Step 3: Update `src/components/MainMenu.test.jsx`** — remove the "Memory" assertion

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

- [ ] **Step 4: Update `src/App.jsx`** — remove the `MemoryGame` import and its screen branch

Remove the line `import MemoryGame from './components/MemoryGame.jsx';` and the line `{screen === 'memory' && <MemoryGame />}`. The rest of `App.jsx` is unchanged.

- [ ] **Step 5: Update `src/index.css`** — remove the now-dead `.memory-grid`/`.memory-card` rules

Delete these two rules (currently present in the file):

```css
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

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all remaining tests pass (the `MemoryGame.test.jsx`/`memory.test.js` tests are gone since those files were deleted — 0 failures is what matters, not a specific total count)

- [ ] **Step 7: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 8: Commit**

```bash
git add src/components/MainMenu.jsx src/components/MainMenu.test.jsx src/App.jsx src/index.css
git commit -m "feat: remove the Memory game mode"
```

---

### Task 2: Visual, emoji/color-coded main menu

**Files:**
- Modify: `src/components/MainMenu.jsx`
- Modify: `src/components/MainMenu.test.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Modifies: `SCREENS` entries gain `icon: string` (an emoji) and `color: string` (a CSS color) fields. `MainMenu`'s rendered output structure changes (each button now wraps an icon `<span>` and a label `<span>`) but its accessible name per button (used by `App.jsx`'s navigation and every other consumer) is unchanged, since the icon is `aria-hidden`.

- [ ] **Step 1: Write the failing test**

Append to the existing `describe('MainMenu', ...)` block in `src/components/MainMenu.test.jsx` (keep the two existing tests):

```jsx
it('shows a distinct icon for every screen', () => {
  render(<MainMenu onNavigate={() => {}} />);
  expect(screen.getByText('🏳️')).toBeInTheDocument();
  expect(screen.getByText('🚩')).toBeInTheDocument();
  expect(screen.getByText('🗺️')).toBeInTheDocument();
  expect(screen.getByText('🧭')).toBeInTheDocument();
  expect(screen.getByText('📖')).toBeInTheDocument();
});

it('still exposes each label as the button\'s accessible name (icon is decorative)', () => {
  render(<MainMenu onNavigate={() => {}} />);
  expect(screen.getByRole('button', { name: 'Bandera → País' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MainMenu.test.jsx`
Expected: FAIL — no icons rendered yet

- [ ] **Step 3: Replace `src/components/MainMenu.jsx`**

```jsx
export const SCREENS = [
  { id: 'flag-to-country', label: 'Bandera → País', icon: '🏳️', color: '#4361ee' },
  { id: 'country-to-flag', label: 'País → Bandera', icon: '🚩', color: '#2b9348' },
  { id: 'map-game', label: 'Mapa', icon: '🗺️', color: '#f77f00' },
  { id: 'explore', label: 'Explorar mapa', icon: '🧭', color: '#7209b7' },
  { id: 'album', label: 'Mi álbum', icon: '📖', color: '#e63946' },
];

export default function MainMenu({ onNavigate }) {
  return (
    <nav className="main-menu">
      {SCREENS.map((screen) => (
        <button
          key={screen.id}
          type="button"
          className="menu-card"
          style={{ background: screen.color }}
          onClick={() => onNavigate(screen.id)}
        >
          <span className="menu-card__icon" aria-hidden="true">
            {screen.icon}
          </span>
          <span className="menu-card__label">{screen.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MainMenu.test.jsx`
Expected: 4 passed

- [ ] **Step 5: Update `src/index.css`** — replace the `.main-menu` rule and add card styles

Replace:

```css
.main-menu {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
```

with:

```css
.main-menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.menu-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  min-height: 120px;
  margin: 0;
  padding: 1rem;
}

.menu-card__icon {
  font-size: 3rem;
  line-height: 1;
}

.menu-card__label {
  font-size: 1rem;
}
```

- [ ] **Step 6: Run the full suite and confirm the build**

Run: `npm test`
Expected: all tests passing

Run: `npm run build`
Expected: exits 0

- [ ] **Step 7: Commit**

```bash
git add src/components/MainMenu.jsx src/components/MainMenu.test.jsx src/index.css
git commit -m "feat: redesign main menu with emoji icons and color-coded cards"
```

---

### Task 3: `getCentroid` helper for the map zoom animation

**Files:**
- Modify: `package.json` (add `d3-geo` dependency)
- Modify: `src/lib/worldAtlas.js`
- Modify: `src/lib/worldAtlas.test.js`

**Interfaces:**
- Consumes: `feature` from `topojson-client` (existing dependency), `geoCentroid` from `d3-geo` (new dependency), `toNumericId` from `src/lib/isoMap.js` (existing).
- Produces: `getCentroid(flagCode: string): [number, number] | null` — exported from `src/lib/worldAtlas.js`, alongside the existing `worldAtlasTopology`/`hasMapGeometry`. Returns `[longitude, latitude]` for a country that has map geometry, `null` otherwise (mirrors `hasMapGeometry`'s null-safety). Used by `MapGame` (Task 4).

- [ ] **Step 1: Add the `d3-geo` dependency**

Run: `npm install d3-geo@^2`

(Pinned to major version 2 to match the version already resolved transitively via `react-simple-maps` in this project's lockfile — installing an unpinned `d3-geo@latest` could pull in a newer major version alongside the existing transitive one.)

- [ ] **Step 2: Write the failing test**

Add to `src/lib/worldAtlas.test.js` (append; keep the existing tests):

```js
import { getCentroid } from './worldAtlas.js';

// ... inside a new describe block:

describe('getCentroid', () => {
  it('returns a real [longitude, latitude] centroid for a country with map geometry', () => {
    const centroid = getCentroid('es');
    expect(centroid).not.toBeNull();
    const [lon, lat] = centroid;
    expect(lon).toBeGreaterThan(-10);
    expect(lon).toBeLessThan(5);
    expect(lat).toBeGreaterThan(35);
    expect(lat).toBeLessThan(45);
  });

  it('returns null for a country with no map geometry', () => {
    expect(getCentroid('cv')).toBeNull();
    expect(getCentroid('cw')).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/lib/worldAtlas.test.js`
Expected: FAIL — `getCentroid` is not exported yet

- [ ] **Step 4: Update `src/lib/worldAtlas.js`**

```js
import worldAtlasTopology from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import { toNumericId } from './isoMap.js';

export { worldAtlasTopology };

const atlasNumericIds = new Set(
  worldAtlasTopology.objects.countries.geometries.map((g) => String(Number(g.id)))
);

export function hasMapGeometry(flagCode) {
  const numeric = toNumericId(flagCode);
  return numeric !== null && atlasNumericIds.has(numeric);
}

const countriesFeatureCollection = feature(worldAtlasTopology, worldAtlasTopology.objects.countries);
const centroidByNumericId = new Map(
  countriesFeatureCollection.features.map((f) => [String(Number(f.id)), geoCentroid(f)])
);

export function getCentroid(flagCode) {
  const numeric = toNumericId(flagCode);
  if (numeric === null) return null;
  return centroidByNumericId.get(numeric) ?? null;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/worldAtlas.test.js`
Expected: 7 passed (5 existing + 2 new)

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/worldAtlas.js src/lib/worldAtlas.test.js
git commit -m "feat: add country centroid lookup for the map zoom animation"
```

---

### Task 4: Animated zoom-to-country in MapGame

**Files:**
- Modify: `src/components/MapGame.jsx`
- Modify: `src/components/MapGame.test.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `getCentroid` from `src/lib/worldAtlas.js` (Task 3), everything else already imported by `MapGame.jsx`.
- Produces: `MapGame()` — same default export contract, no props. Internally adds `mapView`/`isZooming` state driving the `ZoomableGroup`'s `center`/`zoom` props and gating `handleGeographyClick`.

- [ ] **Step 1: Replace `src/components/MapGame.test.jsx`**

```jsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MapGame from './MapGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';
import { pickRandomCountry } from '../lib/quiz.js';

vi.mock('../lib/quiz.js', () => ({
  pickRandomCountry: vi.fn(() => ({ id: 'es', name: 'España', flagCode: 'es' })),
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
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'fr',
  getCentroid: () => [0, 0],
}));

// react-simple-maps' ZoomableGroup wires a native "mousedown.zoom" d3-zoom
// listener directly on the <svg>, which throws in jsdom on the full pointer
// event sequence userEvent.click dispatches. fireEvent.click dispatches
// only a bare "click" event, which d3-zoom never listens for, so it safely
// exercises the same onClick handler React relies on.

const ZOOM_LOCK_MS = 4050; // ZOOM_START_DELAY_MS (50) + ZOOM_DURATION_MS (4000)

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
    pickRandomCountry.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
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
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByTestId('geo-250').style.fill).toBe('#d90429');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByTestId('geo-250').style.fill).toBe('');
  });

  it('unlocks and auto-advances to a fresh target after the correct click', () => {
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
  });

  it('never shows a "Siguiente" button', () => {
    render(<MapGame />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('only targets countries that have map geometry', () => {
    render(<MapGame />);
    const [pool] = pickRandomCountry.mock.calls[0];
    expect(pool.every((p) => p.flagCode === 'es' || p.flagCode === 'fr')).toBe(true);
    expect(pool.some((p) => p.flagCode === 'cv')).toBe(false);
    expect(pool.some((p) => p.flagCode === 'cw')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: FAIL — clicks aren't locked yet, `getCentroid` isn't imported, no `map-game-zoom` class

- [ ] **Step 3: Replace `src/components/MapGame.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickRandomCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { getCentroid, hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
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
  const [target, setTarget] = useState(() => pickRandomCountry(mappableCountries));
  const [feedback, setFeedback] = useState(null);
  const [wrongGeoId, setWrongGeoId] = useState(null);
  const [mapView, setMapView] = useState(WORLD_VIEW);
  const [isZooming, setIsZooming] = useState(true);

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
    const timer = setTimeout(() => {
      setFeedback(null);
      setWrongGeoId(null);
      setTarget(pickRandomCountry(mappableCountries));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
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
        <ZoomableGroup
          className="map-game-zoom"
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
        </ZoomableGroup>
      </ComposableMap>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: 9 passed

- [ ] **Step 5: Add the CSS transition, scoped only to MapGame**

Append to `src/index.css`:

```css
.map-game-zoom {
  transition: transform 4s ease-in-out;
}
```

**Do NOT** add this rule to `.rsm-zoomable-group` (the library's own default class, shared with `ExploreMap`) — that would make `ExploreMap`'s pan/pinch-zoom gestures laggy since every drag frame would animate instead of tracking the finger instantly. The class name here (`map-game-zoom`) must match the `className="map-game-zoom"` passed to `ZoomableGroup` in Step 3.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 8: Manual browser check (cannot be automated — no browser available to the agent)**

Run `npm run dev`, open "Mapa" on a real device, and confirm: the map genuinely animates smoothly from a world view to the target country over ~4 seconds (not an instant jump), bordering countries are visible at the end (not just the one country filling the whole screen), and the map cannot be tapped to answer until the animation finishes. If the animation does NOT appear smooth (e.g., it jumps instead of transitioning), report this back rather than trying to force a fix blind — it would mean the CSS-transition-on-controlled-props assumption verified during planning didn't hold on the actual device/browser, and needs a different technical approach.

- [ ] **Step 9: Commit**

```bash
git add src/components/MapGame.jsx src/components/MapGame.test.jsx src/index.css
git commit -m "feat: add animated zoom-to-country sequence in MapGame"
```

---

### Task 5: `speak()` — per-utterance start/end callbacks

**Files:**
- Modify: `src/lib/speech.js`
- Modify: `src/lib/speech.test.js`

**Interfaces:**
- Modifies: `speak(text, options?)` — `text` unchanged (`string | string[]`); new optional second parameter `{ onEachStart?: (index: number) => void, onEnd?: () => void }`. `onEachStart(index)` fires when the utterance at that index starts speaking (wired to `SpeechSynthesisUtterance.onstart`). `onEnd()` fires once, when the LAST utterance in the batch finishes (wired to the last utterance's `onend`) — **and also fires synchronously, immediately, if `speechSynthesis` is unavailable**, so a caller gating UI state on "narration finished" never gets stuck waiting on a device without speech support. Existing call sites (`speak(text)` with no options) are unaffected. Used by `useMultipleChoiceQuestion` (Task 6).

- [ ] **Step 1: Write the failing test**

Append to `src/lib/speech.test.js` (keep the existing tests):

```js
it('fires onEnd immediately when speechSynthesis is unavailable, without throwing', () => {
  delete window.speechSynthesis;
  const onEnd = vi.fn();
  expect(() => speak('Hola', { onEnd })).not.toThrow();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it('wires onEachStart to fire with the right index when each utterance starts', () => {
  const onEachStart = vi.fn();
  speak(['Hola', 'Mundo'], { onEachStart });
  const [utteranceA, utteranceB] = SpeechSynthesisUtterance.mock.results.map((r) => r.value);
  utteranceA.onstart();
  expect(onEachStart).toHaveBeenCalledWith(0);
  utteranceB.onstart();
  expect(onEachStart).toHaveBeenCalledWith(1);
});

it('wires onEnd to the last utterance only, not the earlier ones', () => {
  const onEnd = vi.fn();
  speak(['Hola', 'Mundo'], { onEnd });
  const [utteranceA, utteranceB] = SpeechSynthesisUtterance.mock.results.map((r) => r.value);
  expect(utteranceA.onend).toBeUndefined();
  utteranceB.onend();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it('does not require onEachStart/onEnd to be provided', () => {
  expect(() => speak(['Hola', 'Mundo'])).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/speech.test.js`
Expected: FAIL — `speak` doesn't accept a second argument yet

- [ ] **Step 3: Replace `src/lib/speech.js`**

```js
export function speak(text, { onEachStart, onEnd } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const texts = Array.isArray(text) ? text : [text];
  texts.forEach((line, index) => {
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'es-ES';
    if (onEachStart) {
      utterance.onstart = () => onEachStart(index);
    }
    if (onEnd && index === texts.length - 1) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/speech.test.js`
Expected: 7 passed (3 existing + 4 new)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing (every existing caller of `speak(text)` with a single argument is unaffected — `options` defaults to `{}`, so `onEachStart`/`onEnd` are both `undefined` and none of the new branches activate)

- [ ] **Step 6: Commit**

```bash
git add src/lib/speech.js src/lib/speech.test.js
git commit -m "feat: add per-utterance start/end callbacks to speak()"
```

---

### Task 6: Expose narration progress from `useMultipleChoiceQuestion`

**Files:**
- Modify: `src/lib/useMultipleChoiceQuestion.js`
- Modify: `src/lib/useMultipleChoiceQuestion.test.js`

**Interfaces:**
- Modifies: the hook's return value gains `narratingIndex: number | null` — the index into `announce(question)`'s returned array currently being spoken, or `null` once narration has finished (or immediately, on a device without `speechSynthesis`). `CountryToFlag` (unmodified in this task) will receive this new field and ignore it — no behavior change for that component. Used by `FlagToCountry` (Task 7).

- [ ] **Step 1: Write the failing test**

Append to `src/lib/useMultipleChoiceQuestion.test.js` (keep the 5 existing tests; this task needs its own `vi.mock('./speech.js', ...)` replaced with a version that lets tests control `onEachStart`/`onEnd` — update the existing mock and add new tests):

Replace the existing `vi.mock('./speech.js', () => ({ speak: vi.fn() }));` line with:

```js
const speakMock = vi.fn();
vi.mock('./speech.js', () => ({ speak: (...args) => speakMock(...args) }));
```

Then append these tests to the `describe('useMultipleChoiceQuestion', ...)` block:

```js
it('starts narratingIndex at 0 on mount', () => {
  const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
  expect(result.current.narratingIndex).toBe(0);
});

it('updates narratingIndex as speak() reports each utterance starting, then resets to null on end', () => {
  const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
  const { onEachStart, onEnd } = speakMock.mock.calls[0][1];

  act(() => onEachStart(1));
  expect(result.current.narratingIndex).toBe(1);

  act(() => onEnd());
  expect(result.current.narratingIndex).toBeNull();
});

it('resets narratingIndex to 0 when replay() is called', () => {
  const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
  const { onEnd } = speakMock.mock.calls[0][1];
  act(() => onEnd());
  expect(result.current.narratingIndex).toBeNull();

  act(() => result.current.replay());
  expect(result.current.narratingIndex).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/useMultipleChoiceQuestion.test.js`
Expected: FAIL — `narratingIndex` is `undefined`, `speak` isn't called with a second argument

- [ ] **Step 3: Update `src/lib/useMultipleChoiceQuestion.js`**

```js
import { useCallback, useEffect, useState } from 'react';
import { buildOptions, pickRandomCountry } from './quiz.js';
import { unlockCountry } from './progress.js';
import { speak } from './speech.js';

const ADVANCE_DELAY_MS = 1800;

function buildQuestion(pool) {
  const correct = pickRandomCountry(pool);
  return { correct, options: buildOptions(pool, correct) };
}

export function useMultipleChoiceQuestion(pool, announce) {
  const [question, setQuestion] = useState(() => buildQuestion(pool));
  const [wrongIds, setWrongIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [narratingIndex, setNarratingIndex] = useState(0);

  // Must run BEFORE the feedback effect below: on auto-advance, `question`
  // and `feedback` are both updated in the same batched tick, and this
  // effect running first (and calling speak(), which cancels any prior
  // utterance) is what lets the feedback effect's early-return (feedback
  // is now null) avoid cutting the new announcement off. Reordering these
  // two effects would make auto-advanced questions go silent.
  useEffect(() => {
    setNarratingIndex(0);
    speak(announce(question), {
      onEachStart: setNarratingIndex,
      onEnd: () => setNarratingIndex(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // Must run AFTER the "announce question" effect above — see the comment
  // there for why the ordering matters.
  useEffect(() => {
    if (!feedback) return undefined;
    speak(feedback.message);
    if (!feedback.correct) return undefined;
    const timer = setTimeout(() => {
      setWrongIds([]);
      setFeedback(null);
      setQuestion(buildQuestion(pool));
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  const answer = useCallback(
    (option) => {
      if (feedback?.correct || wrongIds.includes(option.id)) return;
      if (option.id === question.correct.id) {
        unlockCountry(option.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${question.correct.name}` });
      } else {
        setWrongIds((prev) => [...prev, option.id]);
        setFeedback({ correct: false, message: 'Prueba con otra' });
      }
    },
    [question, wrongIds, feedback]
  );

  const replay = useCallback(() => {
    setNarratingIndex(0);
    speak(announce(question), {
      onEachStart: setNarratingIndex,
      onEnd: () => setNarratingIndex(null),
    });
  }, [question, announce]);

  return { question, wrongIds, feedback, answer, replay, narratingIndex };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/useMultipleChoiceQuestion.test.js`
Expected: 8 passed (5 existing + 3 new)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing — in particular, `CountryToFlag.test.jsx` must still pass unmodified, since `CountryToFlag` doesn't read `narratingIndex` at all

- [ ] **Step 6: Commit**

```bash
git add src/lib/useMultipleChoiceQuestion.js src/lib/useMultipleChoiceQuestion.test.js
git commit -m "feat: expose narration progress from useMultipleChoiceQuestion"
```

---

### Task 7: FlagToCountry — highlight the narrated option, lock answers until narration ends

**Files:**
- Modify: `src/components/FlagToCountry.jsx`
- Modify: `src/components/FlagToCountry.test.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `narratingIndex` from `useMultipleChoiceQuestion` (Task 6).
- Produces: `FlagToCountry()` — same default export contract, no props. This is the ONLY consumer that reads/acts on `narratingIndex` — `CountryToFlag` and `MapGame` are unaffected by this task.

- [ ] **Step 1: Replace `src/components/FlagToCountry.test.jsx`**

```jsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the flag to guess, a replay button, and 4 country name options', () => {
    render(<FlagToCountry />);
    expect(screen.getByRole('img', { name: 'Bandera a adivinar' })).toHaveClass('fi-es');
    expect(screen.getByRole('button', { name: 'Repetir en voz alta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Francia' })).toBeInTheDocument();
  });

  it('options are answerable once narration has finished (jsdom has no speechSynthesis, so narration ends immediately)', () => {
    render(<FlagToCountry />);
    expect(screen.getByRole('button', { name: 'España' })).toBeEnabled();
  });

  it('marks a wrong option red and disabled, keeps the question open, and shows "Prueba con otra"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlagToCountry />);
    await user.click(screen.getByRole('button', { name: 'Francia' }));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Francia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Francia' })).toHaveClass('option--wrong');
    expect(screen.getByRole('button', { name: 'España' })).toBeEnabled();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('marks the correct option green, unlocks it, and auto-advances after the delay', async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlagToCountry />);
    await user.click(screen.getByRole('button', { name: 'España' }));

    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'España' })).toHaveClass('option--correct');
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
  });

  it('ignores a second, different answer after feedback is already shown', async () => {
    const user = userEvent.setup({ delay: null });
    render(<FlagToCountry />);
    await user.click(screen.getByRole('button', { name: 'Francia' }));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Italia' }));

    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('never shows a "Siguiente" button', () => {
    render(<FlagToCountry />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('highlights and disables all options while narrating, using a real speechSynthesis mock', () => {
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
    global.SpeechSynthesisUtterance = vi.fn(function (text) {
      this.text = text;
    });

    render(<FlagToCountry />);

    // All 4 options should be disabled while speechSynthesis exists but no
    // utterance has reported starting/ending yet (narratingIndex stays 0
    // from the initial state, since our mock never auto-fires onstart/onend).
    expect(screen.getByRole('button', { name: 'España' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Francia' })).toBeDisabled();

    // Simulate the browser narrating option index 2 (0=prompt, 1..4=options
    // 0..3, so index 2 highlights options[1] — whichever option that is
    // given the mocked buildOptions() order above, i.e. 'Francia').
    const utterances = SpeechSynthesisUtterance.mock.instances;
    act(() => {
      utterances[2].onstart();
    });
    expect(screen.getByRole('button', { name: 'Francia' })).toHaveClass('option--narrating');

    // Once the last utterance ends, everything unlocks.
    act(() => {
      utterances[utterances.length - 1].onend();
    });
    expect(screen.getByRole('button', { name: 'España' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Francia', class: 'option--narrating' })).toBeNull();

    delete window.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FlagToCountry.test.jsx`
Expected: FAIL — options aren't disabled during narration and there's no `option--narrating` class yet

- [ ] **Step 3: Replace `src/components/FlagToCountry.jsx`**

```jsx
import { paises } from '../data/paises.js';
import { useMultipleChoiceQuestion } from '../lib/useMultipleChoiceQuestion.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

const announce = (question) => [
  '¿Qué país es esta bandera?',
  ...question.options.map((option) => option.name),
];

export default function FlagToCountry() {
  const { question, wrongIds, feedback, answer, replay, narratingIndex } = useMultipleChoiceQuestion(
    paises,
    announce
  );
  const isNarrating = narratingIndex !== null;
  const highlightedOptionIndex = isNarrating ? narratingIndex - 1 : -1;

  return (
    <section className="game flag-to-country">
      <FlagIcon code={question.correct.flagCode} label="Bandera a adivinar" size="large" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <div className="options">
        {question.options.map((option, index) => {
          const isWrong = wrongIds.includes(option.id);
          const isCorrectPick = Boolean(feedback?.correct) && option.id === question.correct.id;
          const isBeingNarrated = index === highlightedOptionIndex;
          const className = isWrong
            ? 'option--wrong'
            : isCorrectPick
              ? 'option--correct'
              : isBeingNarrated
                ? 'option--narrating'
                : undefined;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => answer(option)}
              disabled={isWrong || Boolean(feedback?.correct) || isNarrating}
              className={className}
            >
              {option.name}
            </button>
          );
        })}
      </div>
      {feedback && <AnswerFeedback correct={feedback.correct} message={feedback.message} />}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/FlagToCountry.test.jsx`
Expected: 7 passed

- [ ] **Step 5: Add the `option--narrating` CSS rule**

Append to `src/index.css`:

```css
.option--narrating {
  background: #ffd60a;
  color: #1a1a2e;
}
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 7: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 8: Commit**

```bash
git add src/components/FlagToCountry.jsx src/components/FlagToCountry.test.jsx src/index.css
git commit -m "feat: highlight narrated option and lock answers until narration ends in FlagToCountry"
```

---

### Task 8: Final verification

**Files:** None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests passing, 0 failures

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: exits 0, `dist/` produced

- [ ] **Step 3: Manual browser check (cannot be automated — no browser available to the agent)**

Run `npm run dev`, and on a real device:
- Confirm Memory is gone from the menu and there's no dead link anywhere.
- Confirm the new menu shows 5 big colorful cards with distinct emoji, and that tapping each one navigates correctly.
- Confirm the Mapa zoom animation (already checked once in Task 4, re-confirm here in the context of the full app) plus that voice actually narrates and the child can follow the highlighted option in Bandera→País — this is the one behavior in Task 7 that fundamentally cannot be verified without real `speechSynthesis` playback.

- [ ] **Step 4: Report**

No commit for this task — if the manual check finds a real issue (e.g., zoom animation not smooth, an emoji not rendering on the device's font, narration highlight timing feeling off), report it back rather than silently fixing it, since these are product/UX judgment calls the human should see before a fix is picked.

## Plan Self-Review Notes

- **Spec coverage:** Memory removal (Task 1), visual menu with icons/colors (Task 2), animated map zoom with click-lock (Tasks 3-4), narration highlight + answer lock in FlagToCountry only, CountryToFlag unaffected (Tasks 5-7). All design doc sections covered. The design doc's explicit "fuera de alcance" items (no per-country zoom sizing, no filtering of non-target continents in the zoom, no fix attempted if the CSS-transition approach doesn't pan out) are respected — Task 4 Step 8 explicitly says to report rather than force a fix.
- **Type consistency:** `speak(text, { onEachStart, onEnd })`'s signature is used identically in Task 6's hook (both the mount effect and `replay`). `useMultipleChoiceQuestion`'s return shape gains exactly one new field (`narratingIndex`) without changing any existing field's meaning — verified against both of its consumers (Task 7 uses it, `CountryToFlag.jsx` — not modified in this plan — simply receives and ignores it).
- **Cross-task dependency check:** Task 4 (MapGame) depends on Task 3 (`getCentroid`) — sequenced correctly. Task 7 (FlagToCountry) depends on Task 6 (`narratingIndex`) which depends on Task 5 (`speak()` callbacks) — sequenced correctly. Task 2 (menu redesign) depends on Task 1 (Memory removed first, so the redesign works from a clean 5-item `SCREENS` array) — sequenced correctly.
- **Placeholder scan:** none found — every step has complete code.
