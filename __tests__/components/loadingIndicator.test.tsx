import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import { LoadingIndicator } from '../../components/LoadingIndicator';

describe('LoadingIndicator Component Tests', () => {
  afterEach(cleanup);

  it('should render sacred Om symbol when no message prop is provided', async () => {
    await render(<LoadingIndicator />);
    expect(screen.getByText('ॐ')).toBeTruthy();
  });

  it('should render custom message when provided', async () => {
    await render(<LoadingIndicator message="पञ्चाङ्ग गणना जारी है..." />);
    expect(screen.getByText('पञ्चाङ्ग गणना जारी है...')).toBeTruthy();
  });
});
