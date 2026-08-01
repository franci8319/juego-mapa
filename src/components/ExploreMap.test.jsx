import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExploreMap from './ExploreMap.jsx';

// hasMapGeometry/getCentroid here only recognize 'es' and 'ar' — both real
// entries in src/data/paises.js (continent 'europa' and 'america'
// respectively) — and both resolve to the SAME fixed centroid. That keeps
// getContinentView's real computation deterministic for this test file
// without needing to hardcode real-world geographic values here (those are
// already covered by continentView.test.js's own dedicated tests).
vi.mock('../lib/worldAtlas.js', () => ({
  worldAtlasTopology: {
    type: 'Topology',
    objects: {
      countries: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Polygon', id: '724', arcs: [[0]], properties: { name: 'Spain' } },
          { type: 'Polygon', id: '156', arcs: [[1]], properties: { name: 'China' } },
          { type: 'Polygon', id: '32', arcs: [[1]], properties: { name: 'Argentina' } },
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
  hasMapGeometry: (flagCode) => flagCode === 'es' || flagCode === 'ar',
  getCentroid: (flagCode) => (flagCode === 'es' || flagCode === 'ar' ? [10, 20] : null),
}));

describe('ExploreMap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a continent picker with 5 continents and a "whole world" option', () => {
    render(<ExploreMap />);
    expect(screen.getByRole('button', { name: 'América' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Europa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'África' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Asia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oceanía' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver el mundo entero' })).toBeInTheDocument();
  });

  it('shows a distinct icon for every continent card', () => {
    render(<ExploreMap />);
    expect(screen.getByText('🌎')).toBeInTheDocument();
    expect(screen.getByText('🏰')).toBeInTheDocument();
    expect(screen.getByText('🦁')).toBeInTheDocument();
    expect(screen.getByText('🐉')).toBeInTheDocument();
    expect(screen.getByText('🐨')).toBeInTheDocument();
  });

  it('shows the map and a way back after choosing "Ver el mundo entero"', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.getByTestId('geo-724')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '◀ Elegir otro continente' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Europa' })).not.toBeInTheDocument();
  });

  it('shows the map after choosing a specific continent', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByTestId('geo-724')).toBeInTheDocument();
  });

  it('returns to the picker when "Elegir otro continente" is clicked', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    fireEvent.click(screen.getByRole('button', { name: '◀ Elegir otro continente' }));
    expect(screen.getByRole('button', { name: 'Europa' })).toBeInTheDocument();
    expect(screen.queryByTestId('geo-724')).not.toBeInTheDocument();
  });

  it('shows name, flag and locked status for a dataset country', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no lo has descubierto')).toBeInTheDocument();
  });

  it('shows unlocked status when the country is already in the album', () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['ar']));
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-32'));
    expect(screen.getByText('¡Ya tienes este cromo!')).toBeInTheDocument();
  });

  it('shows only the name for a country outside the dataset', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-156'));
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('clears the stale country panel when switching continents', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '◀ Elegir otro continente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.queryByText('España')).not.toBeInTheDocument();
  });

  it('does not show flag emoji markers at the default world zoom', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver el mundo entero' }));
    expect(screen.queryByText('🇪🇸')).not.toBeInTheDocument();
  });

  it('shows flag emoji markers once a continent is zoomed in enough', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });
});
