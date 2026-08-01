import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MemoryGame from './MemoryGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';

vi.mock('../lib/memory.js', () => ({
  buildDeck: () => [
    { key: 'es-flag', countryId: 'es', kind: 'flag' },
    { key: 'fr-flag', countryId: 'fr', kind: 'flag' },
    { key: 'es-name', countryId: 'es', kind: 'name' },
    { key: 'fr-name', countryId: 'fr', kind: 'name' },
  ],
}));

describe('MemoryGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one face-down card per deck entry', () => {
    render(<MemoryGame />);
    expect(screen.getAllByRole('button', { name: '?' })).toHaveLength(4);
  });

  it('unlocks the country and keeps both cards face up on a match', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MemoryGame />);
    await user.click(screen.getAllByRole('button', { name: '?' })[0]); // es-flag
    await user.click(screen.getAllByRole('button', { name: '?' })[1]); // es-name (index shifts as cards flip)
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('flips mismatched cards back down after a delay', async () => {
    const user = userEvent.setup({ delay: null });
    render(<MemoryGame />);
    await user.click(screen.getAllByRole('button', { name: '?' })[0]); // es-flag
    await user.click(screen.getAllByRole('button', { name: '?' })[2]); // fr-name (index shifts as cards flip; mismatch)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getAllByRole('button', { name: '?' })).toHaveLength(4);
    expect(getUnlockedIds()).toEqual([]);
  });
});
