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

  it('ignores a second, different answer after feedback is already shown', async () => {
    render(<CountryToFlag />);
    await userEvent.click(screen.getByRole('button', { name: 'Bandera de Francia' }));
    expect(screen.getByText('Casi... era España')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Bandera de Italia' }));

    expect(screen.getByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });
});
