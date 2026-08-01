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

  it('ignores a second, different answer after feedback is already shown', async () => {
    render(<FlagToCountry />);
    await userEvent.click(screen.getByRole('button', { name: 'Francia' }));
    expect(screen.getByText('Casi... era España')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'España' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Francia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Italia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Alemania' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Italia' }));

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
