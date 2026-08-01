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

  it('applies the medium size class when requested', () => {
    render(<FlagIcon code="it" label="Italia" size="medium" />);
    expect(screen.getByRole('img', { name: 'Italia' })).toHaveClass('flag-icon--medium');
  });
});
