import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the game title and the menu by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Banderas del Mundial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi álbum' })).toBeInTheDocument();
  });

  it('navigates to a screen and back to the menu', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Mi álbum' }));
    expect(screen.getByRole('button', { name: '◀ Menú' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '◀ Menú' }));
    expect(screen.queryByRole('button', { name: '◀ Menú' })).not.toBeInTheDocument();
  });
});
