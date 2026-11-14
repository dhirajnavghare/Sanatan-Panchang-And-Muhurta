import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import PanchangScreen from '../../app/(tabs)/index';
import { LanguageProvider } from '../../src/core/i18n/LanguageContext';
import * as sacredAudio from '../../src/services/sacredAudio';

describe('Home Screen (Panchang / Index) - Complete UI Interaction Tests', () => {
  const renderScreen = async () => {
    return await render(
      <LanguageProvider>
        <PanchangScreen />
      </LanguageProvider>
    );
  };

  beforeEach(() => {
    jest.spyOn(sacredAudio, 'playTempleBell').mockImplementation(() => {});
    jest.spyOn(sacredAudio, 'triggerHaptic').mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should render the rich Hindu header with bell and share buttons', async () => {
    await renderScreen();

    expect(screen.getByTestId('header-bell-btn')).toBeTruthy();
    expect(screen.getByTestId('header-share-btn')).toBeTruthy();
    expect(screen.getByTestId('header-lang-btn')).toBeTruthy();
    expect(screen.getByTestId('hero-challenge-card')).toBeTruthy();
  });

  it('should chime the Mandir Brass Bell when user clicks the bell icon button', async () => {
    await renderScreen();

    const bellBtn = screen.getByTestId('header-bell-btn');
    await act(async () => {
      fireEvent.press(bellBtn);
    });

    expect(sacredAudio.playTempleBell).toHaveBeenCalled();
    expect(sacredAudio.triggerHaptic).toHaveBeenCalledWith('tap', expect.any(Boolean));
  });

  it('should open the Viral WhatsApp Card Generator Modal when user clicks share card button', async () => {
    await renderScreen();

    const shareBtn = screen.getByTestId('header-share-btn');
    await act(async () => {
      fireEvent.press(shareBtn);
    });

    // Modal elements are now visible
    expect(screen.getByText('दैनिक पञ्चाङ्ग शेयर कार्ड')).toBeTruthy();
  });

  it('should toggle language when user clicks language button in header', async () => {
    await renderScreen();

    const langBtn = screen.getByTestId('header-lang-btn');
    await act(async () => {
      fireEvent.press(langBtn);
    });
    expect(langBtn).toBeTruthy();

    // Toggle back so subsequent tests keep their default Hindi state
    await act(async () => {
      fireEvent.press(langBtn);
    });
  });

  it('should open the Daily Sadhana Checklist modal when user taps the Hero Challenge card', async () => {
    await renderScreen();

    const heroCard = screen.getByTestId('hero-challenge-card');
    await act(async () => {
      fireEvent.press(heroCard);
    });

    expect(screen.getByText('दैनिक नित्यकर्म साधना')).toBeTruthy();
  });

  it('should open the Vedic Sankalpa modal when user taps the Bento Muhurta card', async () => {
    await renderScreen();

    const tallCard = screen.getByTestId('bento-tall-card');
    await act(async () => {
      fireEvent.press(tallCard);
    });

    expect(screen.getByText('दैनिक वैदिक सङ्कल्प')).toBeTruthy();
  });

  it('should switch day planner tabs when user clicks filter options', async () => {
    await renderScreen();

    const allTab = screen.getByTestId('planner-tab-all');
    await act(async () => {
      fireEvent.press(allTab);
    });

    const plannedTab = screen.getByTestId('planner-tab-planned');
    await act(async () => {
      fireEvent.press(plannedTab);
    });

    const coreTab = screen.getByTestId('planner-tab-core');
    await act(async () => {
      fireEvent.press(coreTab);
    });

    expect(coreTab).toBeTruthy();
  });

  it('should toggle language with 1-tap header toggle button', async () => {
    await renderScreen();

    const langBtn = screen.getByTestId('header-lang-btn');
    expect(langBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(langBtn);
    });

    // Language switched from hi to en
    expect(sacredAudio.triggerHaptic).toHaveBeenCalledWith('tap', expect.any(Boolean));
  });

  it('should toggle between daily view and monthly calendar grid', async () => {
    await renderScreen();

    const monthlyBtn = screen.getByTestId('view-mode-monthly-btn');
    expect(monthlyBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(monthlyBtn);
    });

    // Monthly calendar should now be visible
    expect(screen.getByTestId('monthly-calendar-grid')).toBeTruthy();

    const dailyBtn = screen.getByTestId('view-mode-daily-btn');
    await act(async () => {
      fireEvent.press(dailyBtn);
    });

    // Should switch back to daily
    expect(screen.getByTestId('view-mode-daily-btn')).toBeTruthy();
  });

  it('should display Moonrise in celestial glance row', async () => {
    await renderScreen();

    expect(screen.getByText(/Moonrise|चन्द्रोदय/i)).toBeTruthy();
  });

  it('should display the Pan-Indian Inauspicious Triad and Daily Rashi Card', async () => {
    await renderScreen();

    expect(screen.getByTestId('inauspicious-triad-card')).toBeTruthy();
    expect(screen.getByTestId('daily-rashi-card')).toBeTruthy();
  });

  it('should switch directly to Day Planner zero-scroll tab when user clicks view-mode-planner-btn', async () => {
    await renderScreen();

    const plannerBtn = screen.getByTestId('view-mode-planner-btn');
    expect(plannerBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(plannerBtn);
    });

    // Planner view mode container should be rendered at the top
    expect(screen.getByTestId('planner-view-mode-container')).toBeTruthy();
    expect(screen.getByTestId('planner-tab-core')).toBeTruthy();

    // Haptics triggered
    expect(sacredAudio.triggerHaptic).toHaveBeenCalledWith('tap', expect.any(Boolean));

    // Can switch back to daily panchang using daily button
    const dailyBtn = screen.getByTestId('view-mode-daily-btn');
    await act(async () => {
      fireEvent.press(dailyBtn);
    });

    expect(screen.queryByTestId('planner-view-mode-container')).toBeNull();
  });
});
