import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  hasMapGeometry: () => true,
}));

// react-simple-maps' ZoomableGroup wires a native "mousedown.zoom" d3-zoom
// listener directly on the <svg>, which throws in jsdom on the full pointer
// event sequence userEvent.click dispatches (missing SVGAnimatedRect/event
// internals). fireEvent.click dispatches only a bare "click" event, which
// d3-zoom never listens for, so it safely exercises the same onClick handler
// React relies on without touching d3-zoom's separate gesture listener.
// (Same pattern already used in ExploreMap.test.jsx.)

describe('MapGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prompts with the target country flag and a replay button', () => {
    render(<MapGame />);
    expect(screen.getByRole('img', { name: 'Encuentra: España' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repetir en voz alta' })).toBeInTheDocument();
  });

  it('shows "Prueba con otra" on a wrong click, keeps the question open, and does not unlock', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-250'));
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual([]);
    // The question is still open: clicking the correct geography now still works.
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(getUnlockedIds()).toEqual(['es']);
  });

  it('never reveals the correct country on a wrong click', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-250'));
    // The wrong geography gets a transient highlight, but the correct one
    // (Spain, geo-724) must not receive any inline style revealing it.
    expect(screen.getByTestId('geo-724')).not.toHaveAttribute('style');
  });

  it('unlocks and auto-advances to a fresh target after the correct click', () => {
    render(<MapGame />);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(getUnlockedIds()).toEqual(['es']);

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.queryByText('¡Genial! Es España')).not.toBeInTheDocument();
  });

  it('never shows a "Siguiente" button', () => {
    render(<MapGame />);
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });
});
