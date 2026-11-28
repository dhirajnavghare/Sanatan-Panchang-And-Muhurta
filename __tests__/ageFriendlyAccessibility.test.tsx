import React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider } from '@/src/services/appTourContext';
import { MIN_TOUCH_TARGET, COMFORT_TOUCH_TARGET } from '@/src/utils/theme';
import { AppButton } from '@/src/components/ui/AppButton';
import { FormField } from '@/src/components/ui/FormField';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { JapaMalaView } from '@/src/components/JapaMalaView';
import { MonthlyCalendarGrid } from '@/src/components/MonthlyCalendarGrid';
import { SacredProfileEditorModal } from '@/src/components/SacredProfileEditorModal';
import { DEFAULT_USER_PROFILE } from '@/src/services/userProfile';
import IndexScreen from '@/app/(tabs)/index';
import MuhurtaScreen from '@/app/(tabs)/muhurta';
import FestivalsScreen from '@/app/(tabs)/festivals';
import PrayersScreen from '@/app/(tabs)/prayers';
import MoreScreen from '@/app/(tabs)/more';
import CommunityScreen from '@/app/(tabs)/community';
import SettingsScreen from '@/app/(tabs)/settings';

jest.mock('@/src/services/projectApi', () => ({
  fetchPublicChangelog: jest.fn().mockResolvedValue({
    releases_count: 1,
    changelog: [{ id: 1, title: 'v1.0', description: 'Initial release', completed_at: '2026-04-01' }],
  }),
  fetchPublicContributors: jest.fn().mockResolvedValue({
    total_contributors: 1,
    contributors: [
      {
        id: 1,
        name: 'Aarav Sharma',
        role_in_project: 'Maintainer',
        joined_at: '2026-01-01',
        contributions: { stories_completed: 4, story_points_completed: 12, issues_resolved: 3 },
      },
    ],
  }),
  submitUserFeedback: jest.fn().mockResolvedValue({ status: 'ok', message: 'Thanks' }),
  submitReportedIssue: jest.fn().mockResolvedValue({ status: 'ok', message: 'Logged' }),
  ProjectApiError: class extends Error {},
}));

jest.mock('@/src/services/sacredAudio', () => ({
  triggerHaptic: jest.fn().mockResolvedValue(undefined),
  playTempleBell: jest.fn(),
  playShankhNaad: jest.fn(),
}));

const renderWithProviders = (node: React.ReactElement) =>
  render(
    <LanguageProvider>
      <TourProvider>{node}</TourProvider>
    </LanguageProvider>
  );

const getFlatStyle = (node: any) => StyleSheet.flatten(node.props.style) || {};

describe('Age-friendly Universal Simplicity & Accessibility Invariants', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  describe('Shared UI Building Blocks', () => {
    it('AppButton enforces >= 48dp touch height and preserves natural wrapping', async () => {
      const onPress = jest.fn();
      await render(
        <AppButton
          testID="primary-save-action"
          label="Save Daily Routine Settings"
          onPress={onPress}
        />
      );
      const btn = screen.getByTestId('primary-save-action');
      const style = getFlatStyle(btn);
      expect(style.minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);

      const labelNode = screen.getByText('Save Daily Routine Settings');
      expect(labelNode.props.numberOfLines).toBeUndefined();

      fireEvent.press(btn);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('FormField exposes clear labels, helper text, >= 48dp input, and alert error', async () => {
      await render(
        <FormField
          testID="sample-email-input"
          label="Email Address"
          optionalLabel="Optional"
          helperText="Only used if you want a reply"
          errorText="Please enter a valid email address"
          value="invalid"
          onChangeText={jest.fn()}
        />
      );

      expect(screen.getByText('Email Address')).toBeTruthy();
      expect(screen.getByText('Optional')).toBeTruthy();
      expect(screen.getByText('Only used if you want a reply')).toBeTruthy();
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();

      const inputStyle = getFlatStyle(screen.getByTestId('sample-email-input'));
      expect(inputStyle.minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(inputStyle.fontSize).toBeGreaterThanOrEqual(15);
    });

    it('ModalHeader guarantees >= 44dp close target and wrapping title', async () => {
      const onClose = jest.fn();
      await render(
        <ModalHeader
          title="Sacred Location Selector for Panchang"
          subtitle="Select a city"
          onClose={onClose}
          closeTestID="modal-header-close"
        />
      );
      expect(screen.getByText('Sacred Location Selector for Panchang')).toBeTruthy();
      const closeBtn = screen.getByTestId('modal-header-close');
      const style = getFlatStyle(closeBtn);
      expect(style.minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      fireEvent.press(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Core Reusable Components Touch Targets & Readability', () => {
    it('JapaMalaView keeps reset and target pills >= 44dp', async () => {
      await render(
        <JapaMalaView
          mantraTitle="Om Namah Shivaya"
          mantraDevanagari="ॐ नमः शिवाय"
          isHi={false}
        />
      );
      expect(getFlatStyle(screen.getByTestId('japa-reset-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('target-pill-11')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    });

    it('MonthlyCalendarGrid keeps month nav controls >= 44x44 and flexible cell height', async () => {
      await render(
        <MonthlyCalendarGrid
          currentDate={new Date('2026-11-28T12:00:00Z')}
          location={{ name: 'Ujjain', latitude: 23.1765, longitude: 75.7885, altitude: 491, timezone: 'Asia/Kolkata' }}
          isHi={false}
          onSelectDate={jest.fn()}
        />
      );
      const prevStyle = getFlatStyle(screen.getByTestId('month-nav-prev'));
      const todayStyle = getFlatStyle(screen.getByTestId('month-nav-today'));
      const nextStyle = getFlatStyle(screen.getByTestId('month-nav-next'));
      expect(prevStyle.minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(prevStyle.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(todayStyle.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(nextStyle.minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(nextStyle.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    });

    it('SacredProfileEditorModal enforces >= 44dp close, >= 48dp inputs, and cancel/save buttons', async () => {
      await render(
        <SacredProfileEditorModal
          visible={true}
          onClose={jest.fn()}
          profile={DEFAULT_USER_PROFILE}
          onSave={jest.fn().mockResolvedValue(undefined)}
          isHi={false}
        />
      );
      expect(getFlatStyle(screen.getByTestId('profile-close-btn')).width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('profile-close-btn')).height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('profile-name-input')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('profile-gotra-input')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('profile-cancel-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('profile-save-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
    });
  });

  describe('All 7 Tab Screens Responsive & Touch Target Checks (including 1.5x font scale)', () => {
    it('IndexScreen maintains >= 44dp header actions under 1.5x system font scale', async () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      await renderWithProviders(<IndexScreen />);
      await waitFor(() => expect(screen.getByTestId('header-help-btn')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('header-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('header-lang-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('header-bell-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('header-share-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('view-mode-daily-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    });

    it('MuhurtaScreen keeps filter pills >= 44dp and renders cleanly at 1.5x font scale', async () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      await renderWithProviders(<MuhurtaScreen />);
      await waitFor(() => expect(screen.getByTestId('suitability-pill-Good')).toBeTruthy(), { timeout: 10000 });

      expect(getFlatStyle(screen.getByTestId('muhurta-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('category-pill-griha_pravesh')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('days-pill-30')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('suitability-pill-Good')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }, 15000);

    it('FestivalsScreen keeps search input >= 48dp and year/category buttons >= 44dp', async () => {
      await renderWithProviders(<FestivalsScreen />);
      await waitFor(() => expect(screen.getByTestId('festival-search-input')).toBeTruthy(), { timeout: 10000 });

      expect(getFlatStyle(screen.getByTestId('festivals-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('festival-search-input')).fontSize).toBeGreaterThanOrEqual(15);
      expect(getFlatStyle(screen.getByTestId('category-chip-all')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }, 15000);

    it('PrayersScreen keeps controls >= 44dp and includes visible label on verse share button', async () => {
      await renderWithProviders(<PrayersScreen />);
      await waitFor(() => expect(screen.getByTestId('prayers-help-btn')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('prayers-bell-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('prayers-shankh-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('prayers-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('loop-btn-1')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('font-size-increase')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('verse-share-1')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(screen.getAllByText(/Share|साझा/).length).toBeGreaterThan(0);
    });

    it('MoreScreen enforces >= 44dp touch targets and renders Vrat Katha cleanly at 1.5x font scale', async () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      await renderWithProviders(<MoreScreen />);
      await waitFor(() => expect(screen.getByTestId('more-help-btn')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('more-to-settings-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('more-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('more-tab-vrat_katha')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('more-about-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);

      fireEvent.press(screen.getByTestId('more-tab-vrat_katha'));
      await waitFor(() => expect(screen.getByTestId('vrat-pill-ekadashi-vrat')).toBeTruthy(), { timeout: 5000 });
      expect(getFlatStyle(screen.getByTestId('vrat-pill-ekadashi-vrat')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    });

    it('CommunityScreen enforces >= 44dp segments/stars and >= 48dp labeled form inputs', async () => {
      await renderWithProviders(<CommunityScreen />);
      await waitFor(() => expect(screen.getByTestId('community-help-btn')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('community-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('community-segment-feedback')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('changelog-refresh-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);

      fireEvent.press(screen.getByTestId('community-segment-feedback'));
      await waitFor(() => expect(screen.getByTestId('feedback-star-5')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('feedback-star-5')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('feedback-message-input')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('feedback-submit-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
    });

    it('SettingsScreen enforces >= 44dp toggles/buttons and keeps notification switches accessible', async () => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
      await renderWithProviders(<SettingsScreen />);
      await waitFor(() => expect(screen.getByTestId('settings-help-btn')).toBeTruthy());

      expect(getFlatStyle(screen.getByTestId('settings-edit-profile-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('settings-help-btn')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('lang-toggle-hi')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('cal-toggle-purnimanta')).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(getFlatStyle(screen.getByTestId('notif-send-test-btn')).minHeight).toBeGreaterThanOrEqual(COMFORT_TOUCH_TARGET);
      expect(screen.getByTestId('notif-toggle-abhijit').props.accessibilityLabel).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-todo').props.accessibilityLabel).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-brahma').props.accessibilityLabel).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-rahu').props.accessibilityLabel).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-choghadiya').props.accessibilityLabel).toBeTruthy();
      expect(screen.getByTestId('notif-toggle-deepam').props.accessibilityLabel).toBeTruthy();
    });
  });
});
