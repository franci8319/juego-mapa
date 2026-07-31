import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the game title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Banderas del Mundial' })).toBeInTheDocument();
  });
});
