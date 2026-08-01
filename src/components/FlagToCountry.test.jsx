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
