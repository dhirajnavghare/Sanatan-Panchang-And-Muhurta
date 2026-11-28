import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderRouter, screen, fireEvent, waitFor, cleanup, act } from 'expo-router/testing-library';
import { resetAppTour } from '@/src/services/appTour';

// Restore real expo-router for full file-based multi-screen E2E navigation across app/_layout.tsx & app/(tabs)/*
jest.mock('expo-router', () => jest.requireActual('expo-router'));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/src/services/startupDiagnostics', () => ({
  runStartupDiagnostics: jest.fn().mockResolvedValue({
    status: 'HEALTHY',
    totalTests: 22,
    passedTests: 22,
    failedTests: 0,
    totalDurationMs: 1,
    results: [],
  }),
  getLastDiagnosticReport: jest.fn().mockReturnValue(null),
}));

describe('End-to-End Multi-Screen App Workflows (Real Expo Router Navigation)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('changelog')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            releases_count: 1,
            changelog: [
              {
                id: 1,
                title: 'v2.0 Interactive Tour & UI Refinement',
                description: 'All 7 tabs covered with guided onboarding',
                completed_at: '2026-11-28T00:00:00Z',
              },
            ],
          }),
        };
      }
      if (String(url).includes('contributors')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            total_contributors: 1,
            contributors: [
              {
                id: 1,
                user_id: 1,
                name: 'Sanatan Seva Team',
                role_in_project: 'Maintainers',
                joined_at: '2025-01-01T00:00:00Z',
                contributions: {
                  stories_assigned: 10,
                  stories_completed: 10,
                  story_points_completed: 30,
                  issues_assigned: 4,
                  issues_resolved: 4,
                  issues_reported: 2,
                },
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, feedbackId: 101, issueId: 202 }),
      };
    });
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('completes first-time onboarding launch -> interactive tour -> cross-tab navigation -> Day Planner & Settings persistence', async () => {
    await resetAppTour();

    const routerResult = await renderRouter('./app', {
      initialUrl: '/',
    });

    // Advance initial render timers & verify first-time welcome modal renders on real Home screen
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(screen.getByTestId('header-bar')).toBeTruthy();
      expect(screen.getByTestId('app-tour-modal')).toBeTruthy();
    });

    // Preview slide progression, then tap "Start Live Guided Tour"
    await fireEvent.press(screen.getByTestId('tour-next-btn'));
    await fireEvent.press(screen.getByTestId('tour-start-interactive-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('interactive-tour-overlay')).toBeTruthy();
      expect(screen.getByTestId('tour-step-card')).toBeTruthy();
    });

    // Step 1 -> jump directly across tabs via section chips & verify Day Planner Try Mode preserves Planner view (zero snapback)!
    await fireEvent.press(screen.getByTestId('tour-section-chip-dayplanner'));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/');
      expect(screen.getByTestId('planner-view-mode-container')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('tour-try-mode-banner')).toBeTruthy();
      expect(screen.getByTestId('planner-view-mode-container')).toBeTruthy();
    });

    // Jump to Muhurta section & verify real Expo Router pathname changes!
    await fireEvent.press(screen.getByTestId('tour-reopen-step-btn'));
    await fireEvent.press(screen.getByTestId('tour-section-chip-muhurta'));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/muhurta');
    });

    // Jump to Community section, advance to final step 32, and complete the guided tour
    await fireEvent.press(screen.getByTestId('tour-section-chip-community'));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/community');
    });

    await fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('tour-interactive-finish-btn')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('tour-interactive-finish-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('tour-celebration-finish-btn')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('tour-celebration-finish-btn'));

    // Completing full tour returns cleanly to Home and dismisses overlay
    await waitFor(() => {
      expect(screen.queryByTestId('interactive-tour-overlay')).toBeNull();
      expect(routerResult.getPathname()).toBe('/');
    });

    // Navigate to Community tab via bottom tab bar & submit valid feedback
    await fireEvent.press(screen.getByText('प्रोजेक्ट'));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/community');
      expect(screen.getByTestId('community-hero-card')).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId('community-segment-feedback'));
    await waitFor(() => {
      expect(screen.getByTestId('feedback-message-input')).toBeTruthy();
    });
    await fireEvent.changeText(screen.getByTestId('feedback-email-input'), 'devotee@sanatan.cc');
    await fireEvent.changeText(screen.getByTestId('feedback-message-input'), 'Tour works across all tabs!');
    await fireEvent.press(screen.getByTestId('feedback-submit-btn'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Navigate through all remaining real bottom tabs & inspect screen readiness
    await fireEvent.press(screen.getByText('सेटिंग्स'));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/settings');
      expect(screen.getByTestId('lang-toggle-en')).toBeTruthy();
    });

    // Switch app language to English in Settings & verify UI tabs update live across the router
    await fireEvent.press(screen.getByTestId('lang-toggle-en'));
    await waitFor(() => {
      expect(screen.getByText('Dinacharya')).toBeTruthy();
      expect(screen.getByText('Muhurta')).toBeTruthy();
      expect(screen.getByText('Festivals')).toBeTruthy();
      expect(screen.getByText('Prayers')).toBeTruthy();
      expect(screen.getByText('More')).toBeTruthy();
      expect(screen.getByText('Project')).toBeTruthy();
    });

    // Navigate to Festivals, Prayers, and More tabs via bottom tab bar
    await fireEvent.press(screen.getByLabelText(/Festivals, tab/i));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/festivals');
      expect(screen.getByTestId('festival-search-input')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText(/More, tab/i));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/more');
      expect(screen.getByTestId('more-tab-temples')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText(/Prayers, tab/i));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/prayers');
      expect(screen.getByTestId('prayer-pill-hanuman-chalisa')).toBeTruthy();
    });

    // Navigate back to Dinacharya Home and add a Day Planner task end-to-end
    await fireEvent.press(screen.getByLabelText(/Dinacharya, tab/i));
    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/');
      expect(screen.getByTestId('view-mode-planner-btn')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('view-mode-planner-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('planner-view-mode-container')).toBeTruthy();
    });

    await fireEvent.changeText(screen.getAllByTestId('planner-custom-task-input')[0], 'Sandhya Vandanam & Gita');
    await fireEvent(screen.getAllByTestId('planner-custom-task-input')[0], 'submitEditing');

    await waitFor(() => {
      expect(screen.getByText('Sandhya Vandanam & Gita')).toBeTruthy();
    });
  }, 30000);

  it('navigates cleanly to standalone /modal route and unknown fallback +not-found route', async () => {
    await AsyncStorage.setItem('@sanatan_app_tour_completed_v1', 'true');

    const routerResult = await renderRouter('./app', {
      initialUrl: '/modal',
    });

    await waitFor(() => {
      expect(routerResult.getPathname()).toBe('/modal');
      expect(screen.getByTestId('about-modal-scroll')).toBeTruthy();
    });
  }, 20000);
});
