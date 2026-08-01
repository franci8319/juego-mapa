# Modo Fácil, Voz y Feedback Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a continent picker to the explore map, replace the "reveal answer + Siguiente button" quiz flow with "retry until correct, never reveal, auto-advance" across all 3 quiz modes, add color (green/red) and voice feedback throughout, and fix the mobile flag-sizing bug in País → Bandera.

**Architecture:** New pure-logic pieces (`continents.js` data, `speech.js` voice utility) and a shared `useMultipleChoiceQuestion` hook extract the now-nontrivial retry/auto-advance/voice state machine out of `FlagToCountry` and `CountryToFlag` (previously near-duplicated, now genuinely shared). `MapGame` gets the same behavior inlined (only one consumer, so no hook extraction — YAGNI). A new `AnswerFeedback` component replaces the three near-identical feedback blocks.

**Tech Stack:** Same as existing project — React 18, Vite, `react-simple-maps`, Vitest + React Testing Library. New: `renderHook`/`act` from `@testing-library/react` (already a dependency) for hook-level tests, and the browser's built-in Web Speech API (already used in `CountryToFlag`, no new dependency).

## Global Constraints

- UI language: Spanish only.
- No lives/timer system (already established) — this plan adds retry-until-correct, which is even more forgiving, never punitive.
- **Never reveal the correct answer on a wrong pick, in any of the 3 quiz modes.** This explicitly reverses the MapGame "highlight the correct country on miss" behavior shipped in the previous iteration — that code must be removed, not just left dormant.
- Wrong answer → mark that specific option red and disable it (FlagToCountry/CountryToFlag) or give the clicked map polygon a brief red flash (MapGame, since there's no discrete "option" to disable) → say "Prueba con otra" (text + voice) → question stays open.
- Correct answer → mark green → say "¡Genial! Es `<name>`" (text + voice) → call `unlockCountry` → after a fixed 1800ms delay, auto-advance to a **new** question. No "Siguiente" button anywhere in these 3 modes.
- Voice uses the existing `es-ES` `SpeechSynthesisUtterance` pattern already in `CountryToFlag.jsx`, guarded so it never throws when `speechSynthesis` is unavailable (already proven safe in jsdom by the existing test suite).
- `MemoryGame` and `Album` are explicitly out of scope for this plan — do not modify them.
- `continent` values: `'america' | 'europa' | 'africa' | 'asia' | 'oceania'`, assigned by FIFA confederation (verified counts: 12/17/10/8/2, totaling 49).

---

### Task 1: Continents data

**Files:**
- Create: `src/data/continents.js`
- Test: `src/data/continents.test.js`

**Interfaces:**
- Produces: `continents` — a frozen array of exactly 5 objects `{ id: string, label: string, center: [number, number], zoom: number }`, exported from `src/data/continents.js`. `id` values are the same 5 strings used as the `continent` field in `src/data/paises.js` (Task 2). `center` is `[longitude, latitude]` for `react-simple-maps`' `ZoomableGroup`. Consumed by `ExploreMap` (Task 10) and cross-checked by `paises.test.js` (Task 2).

- [ ] **Step 1: Write the failing test**

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

  it('gives every continent a label and a valid center/zoom', () => {
    for (const continent of continents) {
      expect(continent.label.length).toBeGreaterThan(0);
      expect(continent.center).toHaveLength(2);
      expect(typeof continent.center[0]).toBe('number');
      expect(typeof continent.center[1]).toBe('number');
      expect(continent.zoom).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/data/continents.test.js`
Expected: FAIL — `Failed to resolve import "./continents.js"`

- [ ] **Step 3: Write `src/data/continents.js`**

```js
export const continents = Object.freeze([
  { id: 'america', label: 'América', center: [-80, 10], zoom: 1.7 },
  { id: 'europa', label: 'Europa', center: [15, 50], zoom: 3.5 },
  { id: 'africa', label: 'África', center: [20, 3], zoom: 2.2 },
  { id: 'asia', label: 'Asia', center: [75, 30], zoom: 1.6 },
  { id: 'oceania', label: 'Oceanía', center: [150, -30], zoom: 2.3 },
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/continents.test.js`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/data/continents.js src/data/continents.test.js
git commit -m "feat: add continents data for the map easy mode"
```

---

### Task 2: Add `continent` field to the country dataset

**Files:**
- Modify: `src/data/paises.js`
- Modify: `src/data/paises.test.js`

**Interfaces:**
- Modifies: every entry in `paises` (Task 2 of the original plan) gains a `continent` field. New shape: `{ id, name, flagCode, continent }`. This is a breaking addition to the `Country` shape every consumer already uses — but since it's an added field (not a rename), no other file needs to change for this task alone.
- Consumes: `continents` from `src/data/continents.js` (Task 1), test-only (to cross-validate ids).

- [ ] **Step 1: Write the failing test**

Add to `src/data/paises.test.js` (append to the existing `describe('paises dataset', ...)` block — do not remove the existing 4 tests):

```js
import { continents } from './continents.js';

// ... inside the existing describe block, add:

it('gives every country a continent from the known continent list', () => {
  const validIds = new Set(continents.map((c) => c.id));
  for (const pais of paises) {
    expect(validIds.has(pais.continent)).toBe(true);
  }
});

it('groups countries into continents matching the expected confederation counts', () => {
  const counts = {};
  for (const pais of paises) {
    counts[pais.continent] = (counts[pais.continent] ?? 0) + 1;
  }
  expect(counts).toEqual({ america: 12, europa: 17, africa: 10, asia: 8, oceania: 2 });
});
```

(The `import { continents } from './continents.js';` line goes at the top of the file alongside the existing `import { paises } from './paises.js';`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/data/paises.test.js`
Expected: FAIL — 2 new failures (`validIds.has(undefined)` is `false`, and `counts` is `{}` vs the expected object) — the 4 pre-existing tests still pass.

- [ ] **Step 3: Update `src/data/paises.js`**

Replace the file content with (every entry gains `continent`; id/name/flagCode values are unchanged from before):

```js
export const paises = Object.freeze([
  { id: 'ca', name: 'Canadá', flagCode: 'ca', continent: 'america' },
  { id: 'mx', name: 'México', flagCode: 'mx', continent: 'america' },
  { id: 'us', name: 'Estados Unidos', flagCode: 'us', continent: 'america' },
  { id: 'jp', name: 'Japón', flagCode: 'jp', continent: 'asia' },
  { id: 'nz', name: 'Nueva Zelanda', flagCode: 'nz', continent: 'oceania' },
  { id: 'ir', name: 'Irán', flagCode: 'ir', continent: 'asia' },
  { id: 'ar', name: 'Argentina', flagCode: 'ar', continent: 'america' },
  { id: 'uz', name: 'Uzbekistán', flagCode: 'uz', continent: 'asia' },
  { id: 'jo', name: 'Jordania', flagCode: 'jo', continent: 'asia' },
  { id: 'kr', name: 'Corea del Sur', flagCode: 'kr', continent: 'asia' },
  { id: 'au', name: 'Australia', flagCode: 'au', continent: 'oceania' },
  { id: 'br', name: 'Brasil', flagCode: 'br', continent: 'america' },
  { id: 'ec', name: 'Ecuador', flagCode: 'ec', continent: 'america' },
  { id: 'py', name: 'Paraguay', flagCode: 'py', continent: 'america' },
  { id: 'uy', name: 'Uruguay', flagCode: 'uy', continent: 'america' },
  { id: 'co', name: 'Colombia', flagCode: 'co', continent: 'america' },
  { id: 'ma', name: 'Marruecos', flagCode: 'ma', continent: 'africa' },
  { id: 'tn', name: 'Túnez', flagCode: 'tn', continent: 'africa' },
  { id: 'eg', name: 'Egipto', flagCode: 'eg', continent: 'africa' },
  { id: 'dz', name: 'Argelia', flagCode: 'dz', continent: 'africa' },
  { id: 'gh', name: 'Ghana', flagCode: 'gh', continent: 'africa' },
  { id: 'cv', name: 'Cabo Verde', flagCode: 'cv', continent: 'africa' },
  { id: 'qa', name: 'Catar', flagCode: 'qa', continent: 'asia' },
  { id: 'sa', name: 'Arabia Saudí', flagCode: 'sa', continent: 'asia' },
  { id: 'sn', name: 'Senegal', flagCode: 'sn', continent: 'africa' },
  { id: 'za', name: 'Sudáfrica', flagCode: 'za', continent: 'africa' },
  { id: 'ci', name: 'Costa de Marfil', flagCode: 'ci', continent: 'africa' },
  { id: 'gb-eng', name: 'Inglaterra', flagCode: 'gb-eng', continent: 'europa' },
  { id: 'fr', name: 'Francia', flagCode: 'fr', continent: 'europa' },
  { id: 'hr', name: 'Croacia', flagCode: 'hr', continent: 'europa' },
  { id: 'pt', name: 'Portugal', flagCode: 'pt', continent: 'europa' },
  { id: 'no', name: 'Noruega', flagCode: 'no', continent: 'europa' },
  { id: 'de', name: 'Alemania', flagCode: 'de', continent: 'europa' },
  { id: 'nl', name: 'Países Bajos', flagCode: 'nl', continent: 'europa' },
  { id: 'ch', name: 'Suiza', flagCode: 'ch', continent: 'europa' },
  { id: 'gb-sct', name: 'Escocia', flagCode: 'gb-sct', continent: 'europa' },
  { id: 'es', name: 'España', flagCode: 'es', continent: 'europa' },
  { id: 'at', name: 'Austria', flagCode: 'at', continent: 'europa' },
  { id: 'be', name: 'Bélgica', flagCode: 'be', continent: 'europa' },
  { id: 'pa', name: 'Panamá', flagCode: 'pa', continent: 'america' },
  { id: 'cw', name: 'Curazao', flagCode: 'cw', continent: 'america' },
  { id: 'ht', name: 'Haití', flagCode: 'ht', continent: 'america' },
  { id: 'ba', name: 'Bosnia y Herzegovina', flagCode: 'ba', continent: 'europa' },
  { id: 'se', name: 'Suecia', flagCode: 'se', continent: 'europa' },
  { id: 'tr', name: 'Turquía', flagCode: 'tr', continent: 'europa' },
  { id: 'cz', name: 'Chequia', flagCode: 'cz', continent: 'europa' },
  { id: 'cd', name: 'RD Congo', flagCode: 'cd', continent: 'africa' },
  { id: 'iq', name: 'Irak', flagCode: 'iq', continent: 'asia' },
  { id: 'it', name: 'Italia', flagCode: 'it', continent: 'europa' },
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/data/paises.test.js`
Expected: 6 passed (the original 4 + the 2 new ones)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests still passing (this is a purely additive field, no existing consumer reads `pais.continent`, so nothing else can break)

- [ ] **Step 6: Commit**

```bash
git add src/data/paises.js src/data/paises.test.js
git commit -m "feat: add continent field to the country dataset"
```

---

### Task 3: Voice utility

**Files:**
- Create: `src/lib/speech.js`
- Test: `src/lib/speech.test.js`

**Interfaces:**
- Produces: `speak(text: string | string[]): void` — exported from `src/lib/speech.js`. Cancels any pending speech, then queues one `SpeechSynthesisUtterance` (Spanish, `es-ES`) per string. No-ops silently (never throws) when `speechSynthesis` is unavailable. Used by `useMultipleChoiceQuestion` (Task 6) and `MapGame` (Task 9).

- [ ] **Step 1: Write the failing test**

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from './speech.js';

describe('speak', () => {
  beforeEach(() => {
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
    global.SpeechSynthesisUtterance = vi.fn(function (text) {
      this.text = text;
    });
  });

  afterEach(() => {
    delete window.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
  });

  it('does nothing when speechSynthesis is unavailable', () => {
    delete window.speechSynthesis;
    expect(() => speak('Hola')).not.toThrow();
  });

  it('cancels pending speech and speaks a single string in Spanish', () => {
    speak('Hola');
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Hola');
    const instance = SpeechSynthesisUtterance.mock.results[0].value;
    expect(instance.lang).toBe('es-ES');
  });

  it('queues each string in an array as its own utterance, in order', () => {
    speak(['Hola', 'Mundo']);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2);
    expect(SpeechSynthesisUtterance).toHaveBeenNthCalledWith(1, 'Hola');
    expect(SpeechSynthesisUtterance).toHaveBeenNthCalledWith(2, 'Mundo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/speech.test.js`
Expected: FAIL — `Failed to resolve import "./speech.js"`

- [ ] **Step 3: Write `src/lib/speech.js`**

```js
export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const texts = Array.isArray(text) ? text : [text];
  for (const line of texts) {
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/speech.test.js`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/speech.js src/lib/speech.test.js
git commit -m "feat: add shared voice (speechSynthesis) utility"
```

---

### Task 4: AnswerFeedback component

**Files:**
- Create: `src/components/AnswerFeedback.jsx`
- Test: `src/components/AnswerFeedback.test.jsx`

**Interfaces:**
- Produces: `AnswerFeedback({ correct: boolean, message: string })` — default export, `src/components/AnswerFeedback.jsx`. Renders a colored icon (✓/✗) + the message text. Used by `FlagToCountry` (Task 7), `CountryToFlag` (Task 8), `MapGame` (Task 9), replacing each mode's own inline feedback block (which also had a "Siguiente" button — that button is gone; this component has none).

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnswerFeedback from './AnswerFeedback.jsx';

describe('AnswerFeedback', () => {
  it('shows a check icon and the message in the correct style', () => {
    render(<AnswerFeedback correct message="¡Genial! Es España" />);
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('¡Genial! Es España').closest('.feedback')).toHaveClass('feedback--correct');
  });

  it('shows a cross icon and the message in the incorrect style', () => {
    render(<AnswerFeedback correct={false} message="Prueba con otra" />);
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('Prueba con otra').closest('.feedback')).toHaveClass('feedback--incorrect');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/AnswerFeedback.test.jsx`
Expected: FAIL — `Failed to resolve import "./AnswerFeedback.jsx"`

- [ ] **Step 3: Write `src/components/AnswerFeedback.jsx`**

```jsx
export default function AnswerFeedback({ correct, message }) {
  return (
    <div className={correct ? 'feedback feedback--correct' : 'feedback feedback--incorrect'}>
      <span className="feedback__icon" aria-hidden="true">
        {correct ? '✓' : '✗'}
      </span>
      <p>{message}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/AnswerFeedback.test.jsx`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/AnswerFeedback.jsx src/components/AnswerFeedback.test.jsx
git commit -m "feat: add shared AnswerFeedback component"
```

---

### Task 5: FlagIcon "medium" size

**Files:**
- Modify: `src/components/FlagIcon.jsx`
- Modify: `src/components/FlagIcon.test.jsx`

**Interfaces:**
- Modifies: `FlagIcon`'s `size` prop now accepts `'large' | 'medium' | 'small'` (previously only `'large' | 'small'`, with any non-`'small'` value silently treated as `'large'`). Class name is now derived directly from `size` (`flag-icon--${size}`), so an unrecognized size value produces a class with no matching CSS rule instead of silently falling back — acceptable since every current call site passes a known value. Used by `CountryToFlag` (Task 8), which switches its 4 option flags from `size="large"` to `size="medium"` to fix the mobile scrolling bug.

- [ ] **Step 1: Write the failing test**

Add to `src/components/FlagIcon.test.jsx` (inside the existing `describe('FlagIcon', ...)` block):

```jsx
it('applies the medium size class when requested', () => {
  render(<FlagIcon code="it" label="Italia" size="medium" />);
  expect(screen.getByRole('img', { name: 'Italia' })).toHaveClass('flag-icon--medium');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FlagIcon.test.jsx`
Expected: FAIL — the rendered class is `flag-icon--large` (current fallback behavior), not `flag-icon--medium`

- [ ] **Step 3: Update `src/components/FlagIcon.jsx`**

```jsx
export default function FlagIcon({ code, label, size = 'large' }) {
  return <span role="img" aria-label={label} className={`fi fi-${code} flag-icon flag-icon--${size}`} />;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/FlagIcon.test.jsx`
Expected: 3 passed (the 2 existing + the new one)

- [ ] **Step 5: Commit**

```bash
git add src/components/FlagIcon.jsx src/components/FlagIcon.test.jsx
git commit -m "feat: add medium FlagIcon size"
```

---

### Task 6: `useMultipleChoiceQuestion` hook

**Files:**
- Create: `src/lib/useMultipleChoiceQuestion.js`
- Test: `src/lib/useMultipleChoiceQuestion.test.js`

**Interfaces:**
- Consumes: `pickRandomCountry`/`buildOptions` from `src/lib/quiz.js` (existing), `unlockCountry` from `src/lib/progress.js` (existing), `speak` from `src/lib/speech.js` (Task 3).
- Produces: `useMultipleChoiceQuestion(pool: Country[], announce: (question) => string | string[])` — a React hook, default export not used (named export), from `src/lib/useMultipleChoiceQuestion.js`. Returns `{ question: {correct, options}, wrongIds: string[], feedback: {correct, message} | null, answer: (option) => void, replay: () => void }`. `announce` MUST be a stable reference (defined at module scope in the caller, not inline in the component body) since it is intentionally omitted from the internal effect's dependency array. Used by `FlagToCountry` (Task 7) and `CountryToFlag` (Task 8).

- [ ] **Step 1: Write the failing test**

```js
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMultipleChoiceQuestion } from './useMultipleChoiceQuestion.js';
import { getUnlockedIds } from './progress.js';

vi.mock('./quiz.js', () => ({
  pickRandomCountry: () => ({ id: 'es', name: 'España', flagCode: 'es' }),
  buildOptions: () => [
    { id: 'es', name: 'España', flagCode: 'es' },
    { id: 'fr', name: 'Francia', flagCode: 'fr' },
    { id: 'it', name: 'Italia', flagCode: 'it' },
    { id: 'de', name: 'Alemania', flagCode: 'de' },
  ],
}));

vi.mock('./speech.js', () => ({ speak: vi.fn() }));

const announce = (question) => question.correct.name;

describe('useMultipleChoiceQuestion', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with a question, no feedback, and no wrong ids', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    expect(result.current.question.correct.id).toBe('es');
    expect(result.current.feedback).toBeNull();
    expect(result.current.wrongIds).toEqual([]);
  });

  it('marks a wrong answer, keeps the question open, and does not unlock', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    expect(result.current.feedback).toEqual({ correct: false, message: 'Prueba con otra' });
    expect(result.current.wrongIds).toEqual(['fr']);
    expect(result.current.question.correct.id).toBe('es');
    expect(getUnlockedIds()).toEqual([]);
  });

  it('accumulates multiple wrong ids and ignores a repeated click on an already-wrong option', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    act(() => result.current.answer({ id: 'it', name: 'Italia' }));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    expect(result.current.wrongIds).toEqual(['fr', 'it']);
  });

  it('unlocks and auto-advances to a fresh question after the correct answer', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    act(() => result.current.answer({ id: 'es', name: 'España' }));

    expect(result.current.feedback).toEqual({ correct: true, message: '¡Genial! Es España' });
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(result.current.feedback).toBeNull();
    expect(result.current.wrongIds).toEqual([]);
  });

  it('ignores further answers once the correct one has been given', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    act(() => result.current.answer({ id: 'es', name: 'España' }));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    expect(result.current.wrongIds).toEqual([]);
    expect(getUnlockedIds()).toEqual(['es']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/useMultipleChoiceQuestion.test.js`
Expected: FAIL — `Failed to resolve import "./useMultipleChoiceQuestion.js"`

- [ ] **Step 3: Write `src/lib/useMultipleChoiceQuestion.js`**

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

  useEffect(() => {
    speak(announce(question));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

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
    speak(announce(question));
  }, [question, announce]);

  return { question, wrongIds, feedback, answer, replay };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/useMultipleChoiceQuestion.test.js`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/useMultipleChoiceQuestion.js src/lib/useMultipleChoiceQuestion.test.js
git commit -m "feat: add shared retry-until-correct quiz question hook"
```

---

### Task 7: Rewrite FlagToCountry (retry, voice, colors, auto-advance)

**Files:**
- Modify: `src/components/FlagToCountry.jsx`
- Modify: `src/components/FlagToCountry.test.jsx`

**Interfaces:**
- Consumes: `useMultipleChoiceQuestion` (Task 6), `AnswerFeedback` (Task 4), `FlagIcon` (existing), `paises` (existing).
- Produces: `FlagToCountry()` — same default export contract as before, no props.

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

  it('never shows a "Siguiente" button', () => {
    render(<FlagToCountry />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FlagToCountry.test.jsx`
Expected: FAIL — current component has no replay button, no `option--wrong`/`option--correct` classes, and still has a "Siguiente" button

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
  const { question, wrongIds, feedback, answer, replay } = useMultipleChoiceQuestion(paises, announce);

  return (
    <section className="game flag-to-country">
      <FlagIcon code={question.correct.flagCode} label="Bandera a adivinar" size="large" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <div className="options">
        {question.options.map((option) => {
          const isWrong = wrongIds.includes(option.id);
          const isCorrectPick = Boolean(feedback?.correct) && option.id === question.correct.id;
          const className = isWrong ? 'option--wrong' : isCorrectPick ? 'option--correct' : undefined;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => answer(option)}
              disabled={isWrong || Boolean(feedback?.correct)}
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
Expected: 4 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/components/FlagToCountry.jsx src/components/FlagToCountry.test.jsx
git commit -m "feat: rewrite FlagToCountry with retry, voice, color feedback, auto-advance"
```

---

### Task 8: Rewrite CountryToFlag (medium flags, retry, voice, colors, auto-advance)

**Files:**
- Modify: `src/components/CountryToFlag.jsx`
- Modify: `src/components/CountryToFlag.test.jsx`

**Interfaces:**
- Consumes: `useMultipleChoiceQuestion` (Task 6), `AnswerFeedback` (Task 4), `FlagIcon` with `size="medium"` (Task 5), `paises` (existing).
- Produces: `CountryToFlag()` — same default export contract as before, no props.

- [ ] **Step 1: Replace `src/components/CountryToFlag.test.jsx`**

```jsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the country name to guess, a replay button, and 4 medium-sized flag options', () => {
    render(<CountryToFlag />);
    expect(screen.getByText('¿Cuál es la bandera de España?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir en voz alta' })).toBeInTheDocument();
    const spainFlag = screen.getByRole('img', { name: 'Bandera de España' });
    expect(spainFlag).toHaveClass('flag-icon--medium');
  });

  it('marks a wrong flag red and disabled, keeps the question open, and shows "Prueba con otra"', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CountryToFlag />);
    await user.click(screen.getByRole('button', { name: 'Bandera de Francia' }));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bandera de Francia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bandera de Francia' })).toHaveClass('option--wrong');
    expect(getUnlockedIds()).toEqual([]);
  });

  it('marks the correct flag green, unlocks it, and auto-advances after the delay', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CountryToFlag />);
    await user.click(screen.getByRole('button', { name: 'Bandera de España' }));

    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bandera de España' })).toHaveClass('option--correct');
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
  });

  it('never shows a "Siguiente" button', () => {
    render(<CountryToFlag />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('does not crash when speechSynthesis is unavailable', () => {
    expect(() => render(<CountryToFlag />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CountryToFlag.test.jsx`
Expected: FAIL — current component has `size="large"` flags, no replay button, no color classes, still has "Siguiente"

- [ ] **Step 3: Replace `src/components/CountryToFlag.jsx`**

```jsx
import { paises } from '../data/paises.js';
import { useMultipleChoiceQuestion } from '../lib/useMultipleChoiceQuestion.js';
import AnswerFeedback from './AnswerFeedback.jsx';
import FlagIcon from './FlagIcon.jsx';

const announce = (question) => question.correct.name;

export default function CountryToFlag() {
  const { question, wrongIds, feedback, answer, replay } = useMultipleChoiceQuestion(paises, announce);

  return (
    <section className="game country-to-flag">
      <p>¿Cuál es la bandera de {question.correct.name}?</p>
      <button type="button" className="replay-button" onClick={replay} aria-label="Repetir en voz alta">
        🔊
      </button>
      <div className="options">
        {question.options.map((option) => {
          const isWrong = wrongIds.includes(option.id);
          const isCorrectPick = Boolean(feedback?.correct) && option.id === question.correct.id;
          const className = isWrong ? 'option--wrong' : isCorrectPick ? 'option--correct' : undefined;
          return (
            <button
              key={option.id}
              type="button"
              aria-label={`Bandera de ${option.name}`}
              onClick={() => answer(option)}
              disabled={isWrong || Boolean(feedback?.correct)}
              className={className}
            >
              <FlagIcon code={option.flagCode} label={`Bandera de ${option.name}`} size="medium" />
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

Run: `npm test -- src/components/CountryToFlag.test.jsx`
Expected: 5 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/components/CountryToFlag.jsx src/components/CountryToFlag.test.jsx
git commit -m "feat: rewrite CountryToFlag with medium flags, retry, voice, auto-advance"
```

---

### Task 9: Rewrite MapGame (retry, voice, transient red flash, remove reveal-on-miss, auto-advance)

**Files:**
- Modify: `src/components/MapGame.jsx`
- Modify: `src/components/MapGame.test.jsx`

**Interfaces:**
- Consumes: `AnswerFeedback` (Task 4), `speak` from `src/lib/speech.js` (Task 3), `matchesGeography` from `src/lib/isoMap.js` (existing), `hasMapGeometry`/`worldAtlasTopology` from `src/lib/worldAtlas.js` (existing), `pickRandomCountry` from `src/lib/quiz.js` (existing), `unlockCountry` from `src/lib/progress.js` (existing).
- Produces: `MapGame()` — same default export contract as before, no props. This task does NOT touch `useMultipleChoiceQuestion` — MapGame has only one consumer of its map-specific state shape (no discrete options list, spatial "wrong" is transient rather than a disabled list), so its retry/voice/auto-advance logic is written inline rather than extracted to a shared hook (YAGNI — extracting a single-use hook adds a layer with no reuse benefit).

- [ ] **Step 1: Replace `src/components/MapGame.test.jsx`**

```jsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  hasMapGeometry: () => true,
}));

// react-simple-maps' ZoomableGroup wires a native "mousedown.zoom" d3-zoom
// listener directly on the <svg>, which throws in jsdom on the full pointer
// event sequence userEvent.click dispatches (missing SVGAnimatedRect/event
// internals). fireEvent.click dispatches only a bare "click" event, which
// d3-zoom never listens for, so it safely exercises the same onClick handler
// React relies on without touching d3-zoom's separate gesture listener.
// (Same pattern already used in ExploreMap.test.jsx.)

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('shows "Prueba con otra" on a wrong click, keeps the question open, and does not unlock', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
    // The question is still open: clicking the correct geography now still works.
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('never reveals the correct country on a wrong click', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-250'));
    // The wrong geography gets a transient highlight, but the correct one
    // (Spain, geo-724) must not receive any inline style revealing it.
    expect(screen.getByTestId('geo-724')).not.toHaveAttribute('style');
  });

  it('unlocks and auto-advances to a fresh target after the correct click', () => {
    render(<MapGame />);
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/MapGame.test.jsx`
Expected: FAIL — current component locks after the first wrong click, reveals the target with a highlight, and still has "Siguiente"

- [ ] **Step 3: Replace `src/components/MapGame.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { pickRandomCountry } from '../lib/quiz.js';
import { matchesGeography } from '../lib/isoMap.js';
import { unlockCountry } from '../lib/progress.js';
import { hasMapGeometry, worldAtlasTopology } from '../lib/worldAtlas.js';
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

function announceTarget(target) {
  return ['Encuentra este país en el mapa', target.name];
}

export default function MapGame() {
  const [target, setTarget] = useState(() => pickRandomCountry(mappableCountries));
  const [feedback, setFeedback] = useState(null);
  const [wrongGeoId, setWrongGeoId] = useState(null);

  useEffect(() => {
    speak(announceTarget(target));
  }, [target]);

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
      if (feedback?.correct) return;
      if (matchesGeography(target.flagCode, geo.id)) {
        unlockCountry(target.id);
        setFeedback({ correct: true, message: `¡Genial! Es ${target.name}` });
        setWrongGeoId(null);
      } else {
        setFeedback({ correct: false, message: 'Prueba con otra' });
        setWrongGeoId(geo.id);
      }
    },
    [target, feedback]
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
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
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
Expected: 5 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/components/MapGame.jsx src/components/MapGame.test.jsx
git commit -m "feat: rewrite MapGame with retry, voice, auto-advance; remove reveal-on-miss"
```

---

### Task 10: ExploreMap continent picker

**Files:**
- Modify: `src/components/ExploreMap.jsx`
- Modify: `src/components/ExploreMap.test.jsx`

**Interfaces:**
- Consumes: `continents` from `src/data/continents.js` (Task 1).
- Produces: `ExploreMap()` — same default export contract as before, no props. Internally adds a `continent` selection step before the map is shown.

- [ ] **Step 1: Replace `src/components/ExploreMap.test.jsx`**

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ExploreMap.test.jsx`
Expected: FAIL — current component renders the map directly with no continent picker

- [ ] **Step 3: Replace `src/components/ExploreMap.jsx`**

```jsx
import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { paises } from '../data/paises.js';
import { continents } from '../data/continents.js';
import { getUnlockedIds } from '../lib/progress.js';
import { matchesGeography } from '../lib/isoMap.js';
import { worldAtlasTopology } from '../lib/worldAtlas.js';
import FlagIcon from './FlagIcon.jsx';

function findDatasetCountry(geographyId) {
  return paises.find((pais) => matchesGeography(pais.flagCode, geographyId));
}

export default function ExploreMap() {
  const [continent, setContinent] = useState(null); // null | 'world' | { id, label, center, zoom }
  const [selected, setSelected] = useState(null);

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
            <button key={c.id} type="button" onClick={() => setContinent(c)}>
              {c.label}
            </button>
          ))}
          <button type="button" onClick={() => setContinent('world')}>
            Ver el mundo entero
          </button>
        </div>
      </section>
    );
  }

  const zoomProps =
    continent === 'world'
      ? { zoom: 1, minZoom: 1, maxZoom: 8 }
      : { zoom: continent.zoom, center: continent.center, minZoom: 1, maxZoom: 8 };

  return (
    <section className="game explore-map">
      <button type="button" onClick={() => setContinent(null)}>
        ◀ Elegir otro continente
      </button>
      <ComposableMap>
        <ZoomableGroup {...zoomProps}>
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
Expected: 7 passed

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/components/ExploreMap.jsx src/components/ExploreMap.test.jsx
git commit -m "feat: add continent picker (easy mode) to ExploreMap"
```

---

### Task 11: CSS for the new visual states

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- None — pure CSS. No behavioral tests; the full suite must still pass unchanged (CSS doesn't affect test outcomes, since all class-name assertions added in Tasks 4-10 already pass without any CSS existing — CSS only affects visual appearance, verified manually).

- [ ] **Step 1: Append to `src/index.css`**

```css
.flag-icon--medium {
  width: 130px;
  height: 87px;
}

.feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.feedback__icon {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.option--correct {
  background: #2b9348;
}

.option--wrong {
  background: #d90429;
}

.replay-button {
  font-size: 1.5rem;
  background: #6c757d;
}

.continent-picker {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}
```

- [ ] **Step 2: Run the full suite to confirm nothing broke**

Run: `npm test`
Expected: all tests passing

- [ ] **Step 3: Confirm the production build still succeeds**

Run: `npm run build`
Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style: add visuals for retry feedback, replay button, continent picker"
```

---

### Task 12: Final verification

**Files:** None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests passing (should be 49 pre-existing minus removed "Siguiente"-button assertions plus all new tests from Tasks 1-10 — exact count isn't the point, zero failures is)

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: exits 0, `dist/` produced

- [ ] **Step 3: Manual browser check (cannot be automated — no browser available to the agent)**

Run `npm run dev`, and on a real device or browser (ideally the same tablet the child uses), check:
- Explorar mapa: the continent picker appears first; each continent button visibly frames a reasonable region (not perfectly centered — approximate coordinates were used, so note any continent that looks clearly wrong for a follow-up fix); "Ver el mundo entero" behaves like before.
- Bandera→País, País→Bandera, Mapa: answering wrong marks that option/country red and lets you try again without ever revealing the right answer; answering correctly marks it green, plays voice, and auto-advances after ~1.8s with no button to press; the 🔊 button replays the question.
- País→Bandera specifically: confirm the 4 flags now fit on a phone-sized viewport without needing to scroll to see them or to see the feedback that follows.
- Voice: confirm audio actually plays in a real browser (jsdom never exercises real speech playback).

- [ ] **Step 4: Report**

No commit for this task — if the manual check in Step 3 finds a real issue, report it back rather than silently fixing it, since these are product/UX judgment calls (e.g., continent framing) the human should see before a fix is picked.

## Plan Self-Review Notes

- **Spec coverage:** continent picker + data (Tasks 1, 2, 10), retry-until-correct + never-reveal + auto-advance in all 3 quiz modes (Tasks 6, 7, 8, 9), removal of the MapGame reveal-on-miss highlight (Task 9), voice in all 3 modes with a replay control (Tasks 3, 7, 8, 9), color feedback (Tasks 4, 7, 8, 9, 11), mobile flag-sizing fix (Tasks 5, 8, 11). All design doc sections are covered. `MemoryGame`/`Album` intentionally untouched, matching the design doc's explicit out-of-scope list.
- **Type consistency:** `useMultipleChoiceQuestion(pool, announce)` return shape `{ question, wrongIds, feedback, answer, replay }` is used identically in Tasks 7 and 8. `AnswerFeedback({ correct, message })` props match between its Task 4 definition and every consumer (Tasks 7, 8, 9). `continents` entries' `{ id, label, center, zoom }` shape matches between Task 1's definition, Task 2's cross-check test, and Task 10's consumption.
- **Placeholder scan:** none found — every step has complete code.
