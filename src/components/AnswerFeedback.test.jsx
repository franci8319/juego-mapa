import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnswerFeedback from './AnswerFeedback.jsx';

describe('AnswerFeedback', () => {
  it('shows a check icon and the message in the correct style', () => {
    render(<AnswerFeedback correct message="¡Genial! Es España" />);
    expect(screen.getByText('¡Genial! Es España')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('¡Genial! Es España').closest('.feedback')).toHaveClass('feedback--correct');
  });

  it('shows a cross icon and the message in the incorrect style', () => {
    render(<AnswerFeedback correct={false} message="Prueba con otra" />);
    expect(screen.getByText('Prueba con otra')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('Prueba con otra').closest('.feedback')).toHaveClass('feedback--incorrect');
  });
});
