import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title with data-testid', () => {
    render(<App />);
    const title = screen.getByTestId('app-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Vite + React');
  });
});
