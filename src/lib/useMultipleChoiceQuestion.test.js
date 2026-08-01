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
