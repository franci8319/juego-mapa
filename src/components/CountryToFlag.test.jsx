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
