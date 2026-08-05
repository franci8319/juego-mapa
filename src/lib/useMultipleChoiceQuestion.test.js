import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMultipleChoiceQuestion } from './useMultipleChoiceQuestion.js';
import { getUnlockedIds } from './progress.js';
import { pickRandomCountry } from './quiz.js';

vi.mock('./quiz.js', () => ({
  pickRandomCountry: vi.fn(() => ({ id: 'es', name: 'España', flagCode: 'es' })),
  buildOptions: () => [
    { id: 'es', name: 'España', flagCode: 'es' },
    { id: 'fr', name: 'Francia', flagCode: 'fr' },
    { id: 'it', name: 'Italia', flagCode: 'it' },
    { id: 'de', name: 'Alemania', flagCode: 'de' },
  ],
}));

const speakMock = vi.fn();
vi.mock('./speech.js', () => ({ speak: (...args) => speakMock(...args) }));

const announce = (question) => question.correct.name;

describe('useMultipleChoiceQuestion', () => {
  beforeEach(() => {
    localStorage.clear();
    speakMock.mockClear();
    pickRandomCountry.mockClear();
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

  it('excludes already-asked countries from the next question pool', () => {
    const pool = [
      { id: 'es', name: 'España', flagCode: 'es' },
      { id: 'fr', name: 'Francia', flagCode: 'fr' },
    ];
    const { result } = renderHook(() => useMultipleChoiceQuestion(pool, announce));
    act(() => result.current.answer({ id: 'es', name: 'España' }));
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    const [secondPool] = pickRandomCountry.mock.calls[1];
    expect(secondPool.some((c) => c.id === 'es')).toBe(false);
    expect(secondPool.some((c) => c.id === 'fr')).toBe(true);
  });

  it('falls back to the full pool once every country has already been asked', () => {
    const pool = [{ id: 'es', name: 'España', flagCode: 'es' }];
    const { result } = renderHook(() => useMultipleChoiceQuestion(pool, announce));
    act(() => result.current.answer({ id: 'es', name: 'España' }));
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    const [secondPool] = pickRandomCountry.mock.calls[1];
    expect(secondPool).toEqual(pool);
  });

  it('ignores further answers once the correct one has been given', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    act(() => result.current.answer({ id: 'es', name: 'España' }));
    act(() => result.current.answer({ id: 'fr', name: 'Francia' }));
    expect(result.current.wrongIds).toEqual([]);
    expect(getUnlockedIds()).toEqual(['es']);
  });

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

  it('ignores onEachStart/onEnd callbacks from a narration superseded by replay()', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    const staleCall = speakMock.mock.calls[0][1];

    act(() => result.current.replay());
    expect(result.current.narratingIndex).toBe(0);

    // Simulates speak()'s internal cancel() firing the PREVIOUS utterance's
    // "end" event — it must not clear narratingIndex now that replay()
    // has started a new narration generation.
    act(() => staleCall.onEnd());
    expect(result.current.narratingIndex).toBe(0);
  });

  it('recovers via a watchdog timeout if speechSynthesis never reports onEnd', () => {
    const { result } = renderHook(() => useMultipleChoiceQuestion([], announce));
    expect(result.current.narratingIndex).toBe(0);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.narratingIndex).toBeNull();
  });
});
