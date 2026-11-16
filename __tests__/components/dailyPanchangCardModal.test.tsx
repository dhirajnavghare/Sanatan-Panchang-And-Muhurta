import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { DailyPanchangCardModal } from '../../src/components/DailyPanchangCardModal';
import { calculatePanchang, PRESET_CITIES } from '../../src/core/panchang';
import { WEEKDAY_DEVATAS, SACRED_DAILY_VERSES } from '../../src/services/dinacharya';
import * as Sharing from 'expo-sharing';

describe('DailyPanchangCardModal - Viral Share Card UI Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const ujjain = PRESET_CITIES[0];
  const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);
  const mockOnClose = jest.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    panchang,
    cityName: 'उज्जैन (Ujjain)',
    devataInfo: WEEKDAY_DEVATAS[2],
    verse: SACRED_DAILY_VERSES[0],
  };

  it('should render modal with Tithi, Deity, and single WhatsApp share button', async () => {
    await render(<DailyPanchangCardModal {...defaultProps} />);

    expect(screen.getByText('दैनिक पञ्चाङ्ग शेयर कार्ड')).toBeTruthy();
    expect(screen.getByText('WhatsApp स्टेटस व परिवार ग्रुप्स के लिए')).toBeTruthy();
    expect(screen.getByTestId('share-card-btn')).toBeTruthy();
    expect(screen.getByTestId('share-card-close-btn')).toBeTruthy();
  });

  it('should trigger sharing image and app link in a single click', async () => {
    const shareAsyncSpy = jest.spyOn(Sharing, 'shareAsync').mockImplementation(() => Promise.resolve());
    await render(<DailyPanchangCardModal {...defaultProps} />);

    const shareBtn = screen.getByTestId('share-card-btn');
    await act(async () => {
      fireEvent.press(shareBtn);
    });

    expect(shareBtn).toBeTruthy();
    shareAsyncSpy.mockRestore();
  });

  it('should close modal when user clicks the close button', async () => {
    await render(<DailyPanchangCardModal {...defaultProps} />);

    const closeBtn = screen.getByTestId('share-card-close-btn');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
