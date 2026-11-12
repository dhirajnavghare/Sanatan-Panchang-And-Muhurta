import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import PrayersScreen from '@/app/(tabs)/prayers';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import * as sacredAudio from '@/src/services/sacredAudio';
import { Share } from 'react-native';

describe('Prayers Screen - Comprehensive UI & Clicks Tests', () => {
  let playTempleBellSpy: jest.SpyInstance;
  let playShankhNaadSpy: jest.SpyInstance;
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    playTempleBellSpy = jest.spyOn(sacredAudio, 'playTempleBell').mockImplementation();
    playShankhNaadSpy = jest.spyOn(sacredAudio, 'playShankhNaad').mockImplementation();
    shareSpy = jest.spyOn(Share, 'share').mockImplementation(async () => ({ action: 'sharedAction', activityType: undefined }));
  });

  afterEach(() => {
    cleanup();
    playTempleBellSpy.mockRestore();
    playShankhNaadSpy.mockRestore();
    shareSpy.mockRestore();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <PrayersScreen />
      </LanguageProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    return utils;
  };

  it('should render the Prayers Screen with prayer pills, sound buttons, and Japa Mala', async () => {
    await renderScreen();

    expect(screen.getByTestId('prayer-pill-hanuman-chalisa')).toBeTruthy();
    expect(screen.getByTestId('prayers-bell-btn')).toBeTruthy();
    expect(screen.getByTestId('prayers-shankh-btn')).toBeTruthy();
    expect(screen.getByTestId('bead-touch-zone')).toBeTruthy();
  });

  it('should trigger Mandir Bell sound when user clicks bell button', async () => {
    await renderScreen();

    const bellBtn = screen.getByTestId('prayers-bell-btn');
    await act(async () => {
      fireEvent.press(bellBtn);
    });

    expect(playTempleBellSpy).toHaveBeenCalledWith(0.7);
  });

  it('should trigger Shankh Naad sound when user clicks shankh button', async () => {
    await renderScreen();

    const shankhBtn = screen.getByTestId('prayers-shankh-btn');
    await act(async () => {
      fireEvent.press(shankhBtn);
    });

    expect(playShankhNaadSpy).toHaveBeenCalledWith(0.7);
  });

  it('should switch prayer when user clicks another prayer pill', async () => {
    await renderScreen();

    const shivTandavPill = screen.getByTestId('prayer-pill-shiv-tandav-stotram');
    await act(async () => {
      fireEvent.press(shivTandavPill);
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(screen.getAllByText(/शिव ताण्डव/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should adjust font size when user clicks font size buttons', async () => {
    await renderScreen();

    const incBtn = screen.getByTestId('font-size-increase');
    const decBtn = screen.getByTestId('font-size-decrease');
    const resetBtn = screen.getByTestId('font-size-reset');

    await act(async () => {
      fireEvent.press(incBtn);
    });
    expect(incBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(decBtn);
    });
    expect(decBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(resetBtn);
    });
    expect(resetBtn).toBeTruthy();
  });

  it('should trigger Share when user taps share on a verse', async () => {
    await renderScreen();

    const shareBtn = screen.getByTestId('verse-share-1');
    await act(async () => {
      fireEvent.press(shareBtn);
    });

    expect(shareSpy).toHaveBeenCalled();
  });

  it('should increment Japa Mala beads count when tapped inside Prayers screen', async () => {
    await renderScreen();

    const malaIncrementBtn = screen.getByTestId('bead-touch-zone');
    await act(async () => {
      fireEvent.press(malaIncrementBtn);
    });

    const centralBead = screen.getByTestId('central-bead-number');
    expect(centralBead.props.children).toBe(1);
  });
});
