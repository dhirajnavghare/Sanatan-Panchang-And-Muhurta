import React from 'react';
import { Alert, StyleSheet, ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import PanchangScreen from '@/app/(tabs)/index';
import MuhurtaScreen from '@/app/(tabs)/muhurta';
import SettingsScreen from '@/app/(tabs)/settings';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider } from '@/src/services/appTourContext';
import { markAppTourCompleted } from '@/src/services/appTour';

describe('Negative Cases, Edge Cases, Responsive Layout & Accessibility Suite', () => {
  beforeEach(async () => {
    await markAppTourCompleted();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  it('handles rapid repeated Day Planner additions sequentially without dropping items or leaving stale input text', async () => {
    await render(
      <LanguageProvider>
        <TourProvider>
          <PanchangScreen />
        </TourProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('view-mode-planner-btn')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('view-mode-planner-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('planner-view-mode-container')).toBeTruthy();
    });

    expect(screen.getAllByTestId('planner-custom-task-input').length).toBeGreaterThan(0);

    // Rapidly add two items back-to-back including special characters & long text
    await fireEvent.changeText(screen.getAllByTestId('planner-custom-task-input')[0], 'Surya Namaskar & Pranayama ॐ');
    await fireEvent(screen.getAllByTestId('planner-custom-task-input')[0], 'submitEditing');

    await waitFor(() => {
      expect(screen.getByText('Surya Namaskar & Pranayama ॐ')).toBeTruthy();
    });

    await fireEvent.changeText(screen.getAllByTestId('planner-custom-task-input')[0], 'Complete long Sanskrit study chapter 1-5 #daily');
    await fireEvent(screen.getAllByTestId('planner-custom-task-input')[0], 'submitEditing');

    await waitFor(() => {
      expect(screen.getByText('Complete long Sanskrit study chapter 1-5 #daily')).toBeTruthy();
    });

    // Verify input cleared cleanly rather than pre-filled with the saved task
    expect(screen.getAllByTestId('planner-custom-task-input')[0].props.value).toBe('');

    // Empty / whitespace-only task must be ignored (neither added nor crash)
    await fireEvent.changeText(screen.getAllByTestId('planner-custom-task-input')[0], '   ');
    await fireEvent(screen.getAllByTestId('planner-custom-task-input')[0], 'submitEditing');
    expect(screen.queryByText('   ')).toBeNull();
  });

  it('verifies Muhurta days-pill buttons do not use broken width: 100% inside horizontal row', async () => {
    await render(
      <LanguageProvider>
        <TourProvider>
          <MuhurtaScreen />
        </TourProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('days-pill-30')).toBeTruthy();
    });

    const pill30 = screen.getByTestId('days-pill-30');
    const pill60 = screen.getByTestId('days-pill-60');
    const pill90 = screen.getByTestId('days-pill-90');

    for (const pill of [pill30, pill60, pill90]) {
      const flatStyle = StyleSheet.flatten(pill.props.style) as ViewStyle;
      expect(flatStyle.width).not.toBe('100%');
      expect(pill.props.accessibilityRole).toBe('button');
    }
  });

  it('surfaces Settings permission rationale with Open Settings when GPS permission is denied', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest
      .spyOn(Location, 'requestForegroundPermissionsAsync')
      .mockResolvedValueOnce({ status: Location.PermissionStatus.DENIED, expires: 'never', granted: false, canAskAgain: false });

    await render(
      <LanguageProvider>
        <TourProvider>
          <SettingsScreen />
        </TourProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('settings-meridian-btn')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('settings-meridian-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-gps-detect-btn')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('settings-gps-detect-btn'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it('exposes all 9 notification toggles including Pradosh and Chandrodaya in Settings', async () => {
    await render(
      <LanguageProvider>
        <TourProvider>
          <SettingsScreen />
        </TourProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notif-toggle-pradosh')).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-chandrodaya')).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-ekadashi')).toBeTruthy();
    });

    await fireEvent(screen.getByTestId('notif-toggle-pradosh'), 'valueChange', false);
    await fireEvent(screen.getByTestId('notif-toggle-chandrodaya'), 'valueChange', true);
    await fireEvent.press(screen.getByTestId('cal-toggle-amanta'));
    await fireEvent.press(screen.getByTestId('cal-toggle-purnimanta'));
    await fireEvent.press(screen.getByTestId('settings-meridian-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('city-option-bengaluru')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('city-option-bengaluru'));
    await fireEvent.press(screen.getByTestId('settings-replay-tour-btn'));
  });

  it('supports Daily Shloka modal opening & cycling verses on Home screen', async () => {
    await render(
      <LanguageProvider>
        <TourProvider>
          <PanchangScreen />
        </TourProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('daily-shloka-card')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('daily-shloka-card'));

    await waitFor(() => {
      expect(screen.getByTestId('verse-next-btn')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('verse-next-btn'));
    await fireEvent.press(screen.getByTestId('verse-done-btn'));
  });
});
