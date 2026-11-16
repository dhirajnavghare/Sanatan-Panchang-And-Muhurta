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

  it('should trigger WhatsApp share with horoscope and app link when share button is tapped', async () => {
    const shareSpy = jest.spyOn(require('react-native').Share, 'share').mockImplementation(() =>
      Promise.resolve({ action: 'sharedAction' })
    );

    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={0}
        isHi={true}
      />
    );

    const shareBtn = screen.getByTestId('rashi-share-whatsapp-btn');
    expect(shareBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(shareBtn);
    });

    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('https://play.google.com/store/apps/details?id=cc.sanatan.app'),
      })
    );
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('https://sanatan.cc'),
      })
    );

    shareSpy.mockRestore();
  });

  it('should call NativeModules.SanatanShare.shareImageWithText on Android when available', async () => {
    const { Platform, NativeModules } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';
    NativeModules.SanatanShare = {
      shareImageWithText: jest.fn().mockResolvedValue(true),
    };

    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={0}
        isHi={true}
      />
    );

    const shareBtn = screen.getByTestId('rashi-share-whatsapp-btn');
    await act(async () => {
      fireEvent.press(shareBtn);
    });

    expect(NativeModules.SanatanShare.shareImageWithText).toHaveBeenCalledWith(
      'file:///mock/path/panchang.png',
      expect.stringContaining('दैनिक वैदिक राशिफल'),
      'दैनिक राशिफल WhatsApp पर शेयर करें'
    );

    Platform.OS = originalOS;
    delete NativeModules.SanatanShare;
  });

  it('should sync selectedRashi when savedRashiIndex updates asynchronously', async () => {
    const onSaveRashiMock = jest.fn();
    const { rerender } = await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={undefined}
        onSaveRashi={onSaveRashiMock}
        isHi={true}
      />
    );

    expect(screen.getByText(/मेष राशि/i)).toBeTruthy();

    // Asynchronous profile load completes and passes savedRashiIndex = 2 (Mithun)
    await act(async () => {
      rerender(
        <DailyRashiCard
          moonRashiIndex={0}
          savedRashiIndex={2}
          onSaveRashi={onSaveRashiMock}
          isHi={true}
        />
      );
    });

    expect(screen.getByText(/मिथुन राशि/i)).toBeTruthy();
    expect(screen.getByText(/✓ मेरी राशि/i)).toBeTruthy();
  });

  it('should restore selected Rashi from AsyncStorage when savedRashiIndex is undefined', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('@sanatan_selected_rashi_v1', '2');

    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={undefined}
        isHi={true}
      />
    );

    await act(async () => {
      // allow async storage promise to resolve
    });

    expect(screen.getByText(/मिथुन राशि/i)).toBeTruthy();
  });

  it('should persist selected Rashi to AsyncStorage when a pill is tapped', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.clear();

    await render(
      <DailyRashiCard
        moonRashiIndex={0}
        savedRashiIndex={undefined}
        isHi={true}
      />
    );

    const taurusPill = screen.getByTestId('rashi-pill-1');
    await act(async () => {
      fireEvent.press(taurusPill);
    });

    const stored = await AsyncStorage.getItem('@sanatan_selected_rashi_v1');
    expect(stored).toBe('1');
  });
});

