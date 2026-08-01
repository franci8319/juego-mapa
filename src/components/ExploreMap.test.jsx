import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExploreMap from './ExploreMap.jsx';

// Deviation from the brief: the brief's test used `userEvent.click`, but
// react-simple-maps' ZoomableGroup wires up d3-zoom's native "mousedown.zoom"
// listener on the <svg> (for pan/zoom gestures). userEvent.click dispatches a
// full pointerdown/mousedown/mouseup/click sequence, and that mousedown reaches
// d3-zoom's handler, which reads `event.view` and `svg.viewBox.baseVal` —
// neither of which jsdom populates for synthetic events, so d3-zoom throws
// uncaught exceptions (visible in stderr, and enough to make `vitest run`
// exit non-zero even though the assertions all pass). This is a jsdom/d3-zoom
// incompatibility, not a bug in ExploreMap — real browsers implement both
// fully, and clicking a <Geography> only ever needs a plain "click" for
// React's onClick handler. Using `fireEvent.click`, which dispatches only a
// "click" event, exercises the exact same onClick handler without touching
// d3-zoom's separate mousedown-based gesture listener.
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
}));

describe('ExploreMap', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows name, flag and locked status for a dataset country', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByTestId('geo-724'));
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no lo has descubierto')).toBeInTheDocument();
  });

  it('shows unlocked status when the country is already in the album', () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['ar']));
    render(<ExploreMap />);
    fireEvent.click(screen.getByTestId('geo-32'));
    expect(screen.getByText('¡Ya tienes este cromo!')).toBeInTheDocument();
  });

  it('shows only the name for a country outside the dataset', () => {
    render(<ExploreMap />);
    fireEvent.click(screen.getByTestId('geo-156'));
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
