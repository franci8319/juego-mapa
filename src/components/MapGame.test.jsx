import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
}));

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts with the target country flag', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
  });

  it('unlocks the country and shows success feedback when the right polygon is clicked', async () => {
    render(<MapGame />);
    await userEvent.click(screen.getByTestId('geo-724'));
    expect(await screen.findByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows encouraging feedback without unlocking on a wrong polygon', async () => {
    render(<MapGame />);
    await userEvent.click(screen.getByTestId('geo-250'));
    expect(await screen.findByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });
});
