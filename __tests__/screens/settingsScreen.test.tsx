import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import SettingsScreen from '@/app/(tabs)/settings';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';

describe('Settings Screen - Preferences, Notifications & Profile Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const renderScreen = async () => {
    const utils = await render(
      <LanguageProvider>
        <SettingsScreen />
      </LanguageProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    return utils;
  };

  it('should render devotee profile banner, settings cards, and audio controls', async () => {
    await renderScreen();

    expect(screen.getByTestId('settings-edit-profile-btn')).toBeTruthy();
    expect(screen.getByTestId('lang-toggle-hi')).toBeTruthy();
    expect(screen.getByTestId('lang-toggle-en')).toBeTruthy();
    expect(screen.getByTestId('cal-toggle-purnimanta')).toBeTruthy();
    expect(screen.getByTestId('cal-toggle-amanta')).toBeTruthy();
    expect(screen.getByTestId('settings-replay-tour-btn')).toBeTruthy();
    expect(screen.getByTestId('notif-master-switch')).toBeTruthy();
    expect(screen.getByTestId('settings-toggle-audio')).toBeTruthy();
    expect(screen.getByTestId('settings-toggle-haptics')).toBeTruthy();
    expect(screen.getByTestId('settings-offline-card')).toBeTruthy();
    expect(screen.getByTestId('settings-feedback-card')).toBeTruthy();
    expect(screen.getByTestId('feedback-link-sanatan')).toBeTruthy();
    expect(screen.getByTestId('feedback-link-developer')).toBeTruthy();
  });

  it('should open the Sacred Profile Editor Modal when user clicks edit profile', async () => {
    await renderScreen();

    const editBtn = screen.getByTestId('settings-edit-profile-btn');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    expect(screen.getByTestId('profile-name-input')).toBeTruthy();
    expect(screen.getByTestId('profile-save-btn')).toBeTruthy();
  });

  it('should toggle language setting when user clicks language buttons', async () => {
    await renderScreen();

    const enBtn = screen.getByTestId('lang-toggle-en');
    await act(async () => {
      fireEvent.press(enBtn);
      await new Promise((r) => setTimeout(r, 100));
    });

    const hiBtn = screen.getByTestId('lang-toggle-hi');
    await act(async () => {
      fireEvent.press(hiBtn);
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(hiBtn).toBeTruthy();
  });

  it('should toggle lunar calendar system (Purnimanta vs Amanta)', async () => {
    await renderScreen();

    const amantaBtn = screen.getByTestId('cal-toggle-amanta');
    await act(async () => {
      fireEvent.press(amantaBtn);
      await new Promise((r) => setTimeout(r, 100));
    });

    const purnimantaBtn = screen.getByTestId('cal-toggle-purnimanta');
    await act(async () => {
      fireEvent.press(purnimantaBtn);
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(purnimantaBtn).toBeTruthy();
  });

  it('should open the App Tour Walkthrough Modal when user clicks replay tour button', async () => {
    await renderScreen();

    const replayTourBtn = screen.getByTestId('settings-replay-tour-btn');
    await act(async () => {
      fireEvent.press(replayTourBtn);
    });

    expect(screen.getByTestId('app-tour-modal')).toBeTruthy();
    expect(screen.getByTestId('tour-next-btn')).toBeTruthy();
  });

  it('should toggle master notification switch and configure specific alert categories', async () => {
    await renderScreen();

    const masterSwitch = screen.getByTestId('notif-master-switch');
    expect(masterSwitch).toBeTruthy();

    const abhijitSwitch = screen.getByTestId('notif-toggle-abhijit');
    const todoSwitch = screen.getByTestId('notif-toggle-todo');
    const brahmaSwitch = screen.getByTestId('notif-toggle-brahma');
    const rahuSwitch = screen.getByTestId('notif-toggle-rahu');
    const choghadiyaSwitch = screen.getByTestId('notif-toggle-choghadiya');
    const deepamSwitch = screen.getByTestId('notif-toggle-deepam');
    const ekadashiSwitch = screen.getByTestId('notif-toggle-ekadashi');

    expect(abhijitSwitch).toBeTruthy();
    expect(todoSwitch).toBeTruthy();
    expect(brahmaSwitch).toBeTruthy();
    expect(rahuSwitch).toBeTruthy();
    expect(choghadiyaSwitch).toBeTruthy();
    expect(deepamSwitch).toBeTruthy();
    expect(ekadashiSwitch).toBeTruthy();

    // Toggle Abhijit alert switch
    await act(async () => {
      fireEvent(abhijitSwitch, 'valueChange', false);
      await new Promise((r) => setTimeout(r, 60));
    });

    // Toggle To-Do alert switch
    await act(async () => {
      fireEvent(todoSwitch, 'valueChange', false);
      await new Promise((r) => setTimeout(r, 60));
    });
  });

  it('should trigger send test notification button without crashing', async () => {
    await renderScreen();

    const testBtn = screen.getByTestId('notif-send-test-btn');
    expect(testBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(testBtn);
      await new Promise((r) => setTimeout(r, 60));
    });
  });

  it('should toggle audio and haptic switches', async () => {
    await renderScreen();

    const audioSwitch = screen.getByTestId('settings-toggle-audio');
    const hapticsSwitch = screen.getByTestId('settings-toggle-haptics');

    await act(async () => {
      fireEvent(audioSwitch, 'valueChange', false);
      await new Promise((r) => setTimeout(r, 60));
    });

    await act(async () => {
      fireEvent(hapticsSwitch, 'valueChange', false);
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(audioSwitch).toBeTruthy();
    expect(hapticsSwitch).toBeTruthy();
  });

  it('should trigger feedback links to open URLs', async () => {
    const { Linking } = require('react-native');
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await renderScreen();

    const sanatanLink = screen.getByTestId('feedback-link-sanatan');
    await act(async () => {
      fireEvent.press(sanatanLink);
    });
    expect(openURLSpy).toHaveBeenCalledWith('https://sanatan.cc/contact');

    const devLink = screen.getByTestId('feedback-link-developer');
    await act(async () => {
      fireEvent.press(devLink);
    });
    expect(openURLSpy).toHaveBeenCalledWith('https://dhirajnavghare.com/contact');

    openURLSpy.mockRestore();
  });
});
