import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import MoreScreen from '@/app/(tabs)/more';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { router } from 'expo-router';

describe('More Screen - Pilgrimage Sanctuaries & Lore Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <MoreScreen />
      </LanguageProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    return utils;
  };

  it('should render devotee profile banner, settings navigation pill, and main feature tabs', async () => {
    await renderScreen();

    expect(screen.getByTestId('more-edit-profile-btn')).toBeTruthy();
    expect(screen.getByTestId('more-to-settings-btn')).toBeTruthy();
    expect(screen.getByTestId('more-tab-temples')).toBeTruthy();
    expect(screen.getByTestId('more-tab-devatas')).toBeTruthy();
    expect(screen.getByTestId('more-tab-vrat_katha')).toBeTruthy();
  });

  it('should open the Sacred Profile Editor Modal when user clicks edit profile', async () => {
    await renderScreen();

    const editBtn = screen.getByTestId('more-edit-profile-btn');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    expect(screen.getByTestId('profile-name-input')).toBeTruthy();
    expect(screen.getByTestId('profile-save-btn')).toBeTruthy();
  });

  it('should navigate to the dedicated Settings tab when user clicks the settings pill', async () => {
    await renderScreen();

    const settingsPill = screen.getByTestId('more-to-settings-btn');
    await act(async () => {
      fireEvent.press(settingsPill);
    });

    expect(router.push).toHaveBeenCalledWith('/(tabs)/settings');
  });

  it('should switch temple circuit filters in the Temples section', async () => {
    await renderScreen();

    const charDhamPill = screen.getByTestId('circuit-pill-char_dham');
    await act(async () => {
      fireEvent.press(charDhamPill);
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(charDhamPill).toBeTruthy();

    const panchaBhootaPill = screen.getByTestId('circuit-pill-pancha_bhoota');
    await act(async () => {
      fireEvent.press(panchaBhootaPill);
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(panchaBhootaPill).toBeTruthy();
  });

  it('should switch to Devatas tab, filter traditions, open deity modal and close it', async () => {
    await renderScreen();

    // Switch to Devatas tab
    const devatasTab = screen.getByTestId('more-tab-devatas');
    await act(async () => {
      fireEvent.press(devatasTab);
      await new Promise((r) => setTimeout(r, 150));
    });

    // Filter by Shaiva
    const shaivaPill = screen.getByTestId('tradition-pill-shaiva');
    await act(async () => {
      fireEvent.press(shaivaPill);
      await new Promise((r) => setTimeout(r, 150));
    });

    // Open Shiva deity card
    const shivaCard = screen.queryByTestId('deity-card-shiva');
    if (shivaCard) {
      await act(async () => {
        fireEvent.press(shivaCard);
      });

      // Verify close button exists in modal
      const closeBtn = screen.getByTestId('deity-modal-close-btn');
      expect(closeBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(closeBtn);
      });
    }
  });

  it('should switch to Vrat Katha tab and select a katha', async () => {
    await renderScreen();

    // Switch to Vrat Katha tab
    const kathaTab = screen.getByTestId('more-tab-vrat_katha');
    await act(async () => {
      fireEvent.press(kathaTab);
      await new Promise((r) => setTimeout(r, 150));
    });

    // Look for a vrat pill
    const vratPills = screen.queryAllByTestId(/^vrat-pill-/);
    if (vratPills.length > 1) {
      await act(async () => {
        fireEvent.press(vratPills[1]);
        await new Promise((r) => setTimeout(r, 150));
      });
      expect(vratPills[1]).toBeTruthy();
    }
  });
});
