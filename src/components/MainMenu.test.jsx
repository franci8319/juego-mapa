import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MainMenu from './MainMenu.jsx';

describe('MainMenu', () => {
  it('renders a button for every screen', () => {
    render(<MainMenu onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: 'Bandera → País' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'País → Bandera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Memory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explorar mapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi álbum' })).toBeInTheDocument();
  });

  it('calls onNavigate with the screen id when clicked', async () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mi álbum' }));
    expect(onNavigate).toHaveBeenCalledWith('album');
  });
});
