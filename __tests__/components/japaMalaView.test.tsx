import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { JapaMalaView } from '../../src/components/JapaMalaView';

describe('JapaMalaView - Interactive 108-Bead Mala UI Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const defaultProps = {
    mantraTitle: 'महामृत्युंजय मन्त्र',
    mantraDevanagari: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्...',
    mantraMeaning: 'We meditate on the three-eyed Lord Shiva...',
    audioEnabled: true,
    hapticsEnabled: true,
  };

  it('should render the mantra title, Devanagari text, and initial bead count', async () => {
    await render(<JapaMalaView {...defaultProps} />);

    expect(screen.getByText('महामृत्युंजय मन्त्र')).toBeTruthy();
    expect(screen.getByText('ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्...')).toBeTruthy();
    expect(screen.getByTestId('bead-touch-zone')).toBeTruthy();
    expect(screen.getByTestId('japa-reset-btn')).toBeTruthy();
  });

  it('should increment bead counter when user taps the sacred bead zone', async () => {
    await render(<JapaMalaView {...defaultProps} />);
    const tapZone = screen.getByTestId('bead-touch-zone');
    const beadNum = screen.getByTestId('central-bead-number');

    expect(beadNum.props.children).toBe(0);

    // Click 1
    await act(async () => {
      fireEvent.press(tapZone);
    });
    expect(beadNum.props.children).toBe(1);

    // Click 2
    await act(async () => {
      fireEvent.press(tapZone);
    });
    expect(beadNum.props.children).toBe(2);

    // Click 3
    await act(async () => {
      fireEvent.press(tapZone);
    });
    expect(beadNum.props.children).toBe(3);
  });

  it('should update target malas count when user clicks target selector pills', async () => {
    await render(<JapaMalaView {...defaultProps} />);

    // Click '3' target pill
    const pill3 = screen.getByTestId('target-pill-3');
    await act(async () => {
      fireEvent.press(pill3);
    });
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);

    // Click '11' target pill
    const pill11 = screen.getByTestId('target-pill-11');
    await act(async () => {
      fireEvent.press(pill11);
    });
    expect(screen.getAllByText('11').length).toBeGreaterThanOrEqual(1);
  });

  it('should reset bead counter when user clicks the reset button', async () => {
    await render(<JapaMalaView {...defaultProps} />);
    const tapZone = screen.getByTestId('bead-touch-zone');
    const beadNum = screen.getByTestId('central-bead-number');

    // Count up 5 beads
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        fireEvent.press(tapZone);
      });
    }
    expect(beadNum.props.children).toBe(5);

    // Click reset button
    const resetBtn = screen.getByTestId('japa-reset-btn');
    await act(async () => {
      fireEvent.press(resetBtn);
    });

    expect(beadNum.props.children).toBe(0);
  });
});
