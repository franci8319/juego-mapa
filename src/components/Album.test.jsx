import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Album from './Album.jsx';

describe('Album', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows 0/49 and only mystery cards when nothing is unlocked', () => {
    render(<Album />);
    expect(screen.getByText('0/49 cromos')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Sin descubrir')).toHaveLength(49);
  });

  it('shows an unlocked country with its flag and name', () => {
    localStorage.setItem('banderas-mundial-progress', JSON.stringify(['es']));
    render(<Album />);
    expect(screen.getByText('1/49 cromos')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'España' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Sin descubrir')).toHaveLength(48);
  });
});
