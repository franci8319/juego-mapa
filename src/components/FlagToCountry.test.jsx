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
    delete window.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
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
    expect(screen.getByRole('button', { name: 'Francia' })).not.toHaveClass('option--narrating');
  });
});
