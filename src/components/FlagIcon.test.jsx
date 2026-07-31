import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlagIcon from './FlagIcon.jsx';

describe('FlagIcon', () => {
  it('renders the flag-icons class for the given code', () => {
    render(<FlagIcon code="es" label="España" />);
    expect(screen.getByRole('img', { name: 'España' })).toHaveClass('fi', 'fi-es');
  });

  it('applies the small size class when requested', () => {
    render(<FlagIcon code="fr" label="Francia" size="small" />);
    expect(screen.getByRole('img', { name: 'Francia' })).toHaveClass('flag-icon--small');
  });
});
