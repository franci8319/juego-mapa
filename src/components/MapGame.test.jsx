import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MapGame from './MapGame.jsx';
import { getUnlockedIds } from '../lib/progress.js';
import { pickWeightedCountry } from '../lib/quiz.js';
import { getCentroid } from '../lib/worldAtlas.js';

vi.mock('../lib/quiz.js', () => ({
  pickWeightedCountry: vi.fn(() => ({ id: 'es', name: 'España', flagCode: 'es', difficulty: 1 })),
}));

// hasMapGeometry here only allows 'es' (Spain) and 'fr' (France, used for
// the wrong-answer polygon) through, so tests can assert that MapGame's
// target pool was actually filtered down from the full ~49-country
// `paises` dataset, rather than trivially passing regardless of filtering.
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
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'fr',
  getCentroid: vi.fn(() => [0, 0]),
}));

// react-simple-maps' ZoomableGroup wires a native "mousedown.zoom" d3-zoom
// listener directly on the <svg>, which throws in jsdom on the full pointer
// event sequence userEvent.click dispatches (missing SVGAnimatedRect/event
// internals). fireEvent.click dispatches only a bare "click" event, which
// d3-zoom never listens for, so it safely exercises the same onClick handler
// React relies on without touching d3-zoom's separate gesture listener.
// (Same pattern already used in ExploreMap.test.jsx.)

const ZOOM_LOCK_MS = 4050; // ZOOM_START_DELAY_MS (50) + ZOOM_DURATION_MS (4000)

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    pickWeightedCountry.mockClear();
    getCentroid.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only targets countries that have geometry on the map', () => {
    render(<MapGame />);
    expect(pickWeightedCountry).toHaveBeenCalledTimes(1);
    const [pool] = pickWeightedCountry.mock.calls[0];
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((pais) => pais.flagCode === 'es' || pais.flagCode === 'fr')).toBe(true);
    expect(pool.some((pais) => pais.flagCode === 'cv')).toBe(false);
  });

  it('picks the initial target with correctCount 0', () => {
    render(<MapGame />);
    const [, correctCount] = pickWeightedCountry.mock.calls[0];
    expect(correctCount).toBe(0);
  });

  it('prompts with the target country flag and a replay button', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir en voz alta' })).toBeInTheDocument();
  });

  it('locks map clicks during the zoom-in animation', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
  });

  it('unlocks map clicks once the zoom-in animation finishes', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('shows "Prueba con otra" on a wrong click after the zoom, keeps the question open, and does not unlock', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('never reveals the correct country on a wrong click', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByTestId('geo-724')).not.toHaveAttribute('style');
  });

  it('flashes the clicked wrong geography red and clears it after 700ms', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    const wrongGeo = screen.getByTestId('geo-250');
    fireEvent.click(wrongGeo);
    expect(wrongGeo.style.fill).toBe('#d90429');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(wrongGeo.style.fill).toBe('');
  });

  it('unlocks and auto-advances to a fresh target with an incremented correctCount', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
    expect(pickWeightedCountry).toHaveBeenCalledTimes(2);
    const [, secondCorrectCount] = pickWeightedCountry.mock.calls[1];
    expect(secondCorrectCount).toBe(1);
  });

  it('never shows a "Siguiente" button', () => {
    render(<MapGame />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });

  it('still locks map clicks 1ms before the zoom-in animation finishes', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS - 1);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(getUnlockedIds()).toEqual([]);
  });

  it('applies the map-game-zoom transition class only while the zoom-in animation is running', () => {
    const { container } = render(<MapGame />);
    expect(container.querySelector('.map-game-zoom')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    expect(container.querySelector('.map-game-zoom')).toBeFalsy();
  });

  it('computes the zoom center from the real target centroid', () => {
    render(<MapGame />);
    expect(getCentroid).toHaveBeenCalledWith('es');
  });

  it('excludes already-revealed countries from the next question pool', () => {
    render(<MapGame />);
    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    const [secondPool] = pickWeightedCountry.mock.calls[1];
    expect(secondPool.some((pais) => pais.flagCode === 'es')).toBe(false);
    expect(secondPool.some((pais) => pais.flagCode === 'fr')).toBe(true);
  });

  it('places a flag marker on the map after a correct answer, and not before', () => {
    render(<MapGame />);
    expect(screen.queryByText('🇪🇸')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ZOOM_LOCK_MS);
    });
    fireEvent.click(screen.getByTestId('geo-724'));

    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });
});
