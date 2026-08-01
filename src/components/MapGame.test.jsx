import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapGame from './MapGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';
import { pickRandomCountry } from '../lib/quiz.js';

// See ExploreMap.test.jsx's comment for why fireEvent.click (not
// userEvent.click) is required here: ZoomableGroup wires up d3-zoom's
// native "mousedown.zoom" listener, which throws in jsdom on the
// mousedown that userEvent.click dispatches as part of its full
// pointerdown/mousedown/mouseup/click sequence.

vi.mock('../lib/quiz.js', () => ({
  pickRandomCountry: vi.fn(() => ({ id: 'es', name: 'España', flagCode: 'es' })),
}));

// hasMapGeometry here only allows 'es' (Spain) and 'fr' (France, used for
// the wrong-answer polygon) through, so tests can assert that MapGame's
// target pool was actually filtered down from the full ~49-country
// `paises` dataset, rather than trivially passing regardless of filtering.
vi.mock('../lib/worldAtlas.js', () => ({
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'fr',
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
    pickRandomCountry.mockClear();
  });

  it('only targets countries that have geometry on the map', () => {
    render(<MapGame />);
    expect(pickRandomCountry).toHaveBeenCalledTimes(1);
    const [pool] = pickRandomCountry.mock.calls[0];
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((pais) => pais.flagCode === 'es' || pais.flagCode === 'fr')).toBe(true);
    expect(pool.some((pais) => pais.flagCode === 'cv')).toBe(false);
    expect(pool.some((pais) => pais.flagCode === 'cw')).toBe(false);
  });

  it('prompts with the target country flag', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
  });

  it('unlocks the country and shows success feedback when the right polygon is clicked', async () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(await screen.findByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows encouraging feedback without unlocking on a wrong polygon', async () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(await screen.findByText('Casi... era España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });
});
