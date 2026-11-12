import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { DailyRashiCard } from '../../src/components/DailyRashiCard';

describe('DailyRashiCard Component', () => {
  it('should render Rashi selector pills and display Vedic outlook', async () => {
    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={0}
        isHi={true}
      />
    );

    expect(screen.getByTestId('daily-rashi-card')).toBeTruthy();
    expect(screen.getByTestId('rashi-pill-0')).toBeTruthy();
    expect(screen.getByTestId('rashi-pill-1')).toBeTruthy();
    expect(screen.getByText(/दैनिक गोचर राशिफल/i)).toBeTruthy();
  });

  it('should switch Rashi when another pill is tapped', async () => {
    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={0}
        isHi={true}
      />
    );

    const taurusPill = screen.getByTestId('rashi-pill-1');
    await act(async () => {
      fireEvent.press(taurusPill);
    });

    expect(screen.getByText(/वृषभ राशि/i)).toBeTruthy();
  });

  it('should trigger onSaveRashi when Set As My Rashi button is tapped', async () => {
    const onSaveRashiMock = jest.fn();
    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={0}
        onSaveRashi={onSaveRashiMock}
        isHi={true}
      />
    );

    const saveBtn = screen.getByTestId('rashi-set-my-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(onSaveRashiMock).toHaveBeenCalledWith(0);
  });
});
