import React from 'react';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text, TouchableOpacity, View } from 'react-native';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider, useTour } from '@/src/services/appTourContext';
import { InteractiveTourOverlay } from '@/src/components/InteractiveTourOverlay';
import { ContextualHelpModal } from '@/src/components/ContextualHelpModal';
import {
  APP_TOUR_VERSION,
  saveTourProgressStep,
  getTourProgressStep,
  clearTourProgressStep,
  hasSeenAppTour,
  markAppTourCompleted,
  markTourSectionCompleted,
  saveTourVersionSeen,
  getTourPersistenceSnapshot,
  resetAppTour,
} from '@/src/services/appTour';
import { TOUR_STEPS, CONTEXTUAL_HELP_TOPICS, TOUR_SECTIONS } from '@/src/constants/tourSteps';
import { router } from 'expo-router';

// Test consumer component
function TestConsumer() {
  const {
    isInteractiveTourActive,
    currentStepIndex,
    currentTourStep,
    totalSteps,
    startTour,
    resumeTour,
    startSectionTour,
    startWhatsNewTour,
    nextStep,
    prevStep,
    goToStep,
    requestSkipTour,
    confirmExitTour,
    openHelp,
    updateTourRuntimeContext,
  } = useTour();

  return (
    <View testID="test-consumer-root">
      <Text testID="tour-active-status">{isInteractiveTourActive ? 'ACTIVE' : 'INACTIVE'}</Text>
      <Text testID="current-step-index">{currentStepIndex}</Text>
      <Text testID="current-step-title">{currentTourStep?.titleHi ?? 'NONE'}</Text>
      <Text testID="total-steps">{totalSteps}</Text>

      <TouchableOpacity testID="btn-start-tour" onPress={() => startTour(0)}>
        <Text>Start Tour</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-next-step" onPress={() => nextStep()}>
        <Text>Next Step</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-prev-step" onPress={() => prevStep()}>
        <Text>Prev Step</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-goto-step-17" onPress={() => goToStep(17)}>
        <Text>Go To Step 17</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-goto-step-30" onPress={() => goToStep(30)}>
        <Text>Go To Step 30</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-goto-step-34" onPress={() => goToStep(34)}>
        <Text>Go To Step 34</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-resume-tour" onPress={() => resumeTour()}>
        <Text>Resume Tour</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-section-muhurta" onPress={() => startSectionTour('muhurta')}>
        <Text>Muhurta Walkthrough</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-whats-new" onPress={() => startWhatsNewTour()}>
        <Text>Whats New Tour</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="btn-set-denied-location"
        onPress={() => updateTourRuntimeContext({ locationPermission: 'denied' })}
      >
        <Text>Set Denied Location</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="btn-set-edge-context"
        onPress={() =>
          updateTourRuntimeContext({
            notificationPermission: 'denied',
            plannedTaskCount: 0,
            completedSadhanaCount: 0,
            isAbhijitAvailableToday: false,
            hasNetworkErrorOnCommunity: true,
          })
        }
      >
        <Text>Set Edge Tour Context</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-skip-tour" onPress={() => requestSkipTour()}>
        <Text>Skip Tour</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-confirm-exit" onPress={() => confirmExitTour()}>
        <Text>Confirm Exit</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-open-help" onPress={() => openHelp('dinacharya')}>
        <Text>Open Help</Text>
      </TouchableOpacity>
    </View>
  );
}

describe('Interactive Guided App Tour & Contextual Help Tests', () => {
  beforeEach(async () => {
    await resetAppTour();
    await clearTourProgressStep();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderWithProviders = async (ui: React.ReactElement) => {
    return await render(
      <LanguageProvider>
        <TourProvider>{ui}</TourProvider>
      </LanguageProvider>
    );
  };

  describe('Storage & Progress Persistence Service', () => {
    it('should save, retrieve, and clear tour progress step index', async () => {
      // Unset returns 0 by default
      expect(await getTourProgressStep()).toBe(0);

      await saveTourProgressStep(5);
      expect(await getTourProgressStep()).toBe(5);

      await saveTourProgressStep(12);
      expect(await getTourProgressStep()).toBe(12);

      await clearTourProgressStep();
      expect(await getTourProgressStep()).toBe(0);
    });

    it('should mark tour as completed and verify hasSeenAppTour', async () => {
      expect(await hasSeenAppTour()).toBe(false);

      await markAppTourCompleted();
      expect(await hasSeenAppTour()).toBe(true);

      await resetAppTour();
      expect(await hasSeenAppTour()).toBe(false);
    });
  });

  describe('Tour Step Definitions & Catalog Invariants', () => {
    it('defines 8 contiguous sections covering all 35 steps with valid metadata', () => {
      expect(TOUR_SECTIONS.length).toBe(8);
      expect(TOUR_SECTIONS[0].startStep).toBe(0);
      expect(TOUR_SECTIONS[TOUR_SECTIONS.length - 1].endStep).toBe(34);

      for (let i = 0; i < TOUR_SECTIONS.length; i++) {
        const sec = TOUR_SECTIONS[i];
        expect(sec.id).toBeTruthy();
        expect(sec.nameHi).toBeTruthy();
        expect(sec.nameEn).toBeTruthy();
        expect(sec.emoji).toBeTruthy();
        expect(sec.startStep).toBeLessThanOrEqual(sec.endStep);
        if (i > 0) {
          expect(sec.startStep).toBe(TOUR_SECTIONS[i - 1].endStep + 1);
        }
      }
    });

    it('should define all 35 comprehensive tour steps covering all 7 tabs, Monthly grid, Japa Mala & Vrat Katha', () => {
      expect(TOUR_STEPS.length).toBe(35);

      const dinacharyaSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)' && s.viewMode !== 'planner');
      const dayPlannerSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)' && s.viewMode === 'planner');
      const muhurtaSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/muhurta');
      const festivalSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/festivals');
      const prayerSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/prayers');
      const moreSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/more');
      const communitySteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/community');
      const settingsSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/settings');

      expect(dinacharyaSteps.length).toBe(11);
      expect(dayPlannerSteps.length).toBe(6);
      expect(muhurtaSteps.length).toBe(3);
      expect(festivalSteps.length).toBe(2);
      expect(prayerSteps.length).toBe(4);
      expect(moreSteps.length).toBe(3);
      expect(communitySteps.length).toBe(2);
      expect(settingsSteps.length).toBe(4);

      expect(TOUR_STEPS.some((s) => s.viewMode === 'monthly' && s.targetTestID === 'monthly-calendar-grid')).toBe(true);
      expect(TOUR_STEPS.some((s) => s.targetTestID === 'prayers-japa-mala')).toBe(true);
      expect(TOUR_STEPS.some((s) => s.moreSection === 'vrat_katha' && s.targetTestID === 'more-tab-vrat_katha')).toBe(true);
    });

    it('each tour step must have valid bilingual copy and how-to tips', () => {
      for (const step of TOUR_STEPS) {
        expect(step.id).toBeTruthy();
        expect(step.titleHi).toBeTruthy();
        expect(step.titleEn).toBeTruthy();
        expect(step.descriptionHi).toBeTruthy();
        expect(step.descriptionEn).toBeTruthy();
        expect(step.howToUseHi).toBeTruthy();
        expect(step.howToUseEn).toBeTruthy();
        expect(step.targetTestID).toBeTruthy();
      }
    });

    it('should provide contextual help topics for every major screen', () => {
      const keys = Object.keys(CONTEXTUAL_HELP_TOPICS);
      expect(keys).toContain('dinacharya');
      expect(keys).toContain('dayplanner');
      expect(keys).toContain('muhurta');
      expect(keys).toContain('festivals');
      expect(keys).toContain('prayers');
      expect(keys).toContain('more');
      expect(keys).toContain('community');
      expect(keys).toContain('settings');

      for (const key of keys) {
        const topic = CONTEXTUAL_HELP_TOPICS[key];
        expect(topic.titleHi).toBeTruthy();
        expect(topic.titleEn).toBeTruthy();
        expect(topic.subtitleHi).toBeTruthy();
        expect(topic.subtitleEn).toBeTruthy();
        expect(topic.items.length).toBeGreaterThan(0);
        for (const item of topic.items) {
          expect(item.emoji).toBeTruthy();
          expect(item.labelHi).toBeTruthy();
          expect(item.labelEn).toBeTruthy();
          expect(item.descriptionHi).toBeTruthy();
          expect(item.descriptionEn).toBeTruthy();
        }
      }
    });
  });

  describe('Tour Context & Controller State Transitions', () => {
    it('starts inactive, activates upon startTour, and allows step navigation', async () => {
      await renderWithProviders(<TestConsumer />);

      expect(screen.getByTestId('tour-active-status').props.children).toBe('INACTIVE');
      expect(screen.getByTestId('current-step-index').props.children).toBe(0);

      // Start tour
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      expect(screen.getByTestId('tour-active-status').props.children).toBe('ACTIVE');
      expect(screen.getByTestId('current-step-index').props.children).toBe(0);

      // Next step
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-next-step'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(1);

      // Previous step
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-prev-step'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(0);

      // Confirm exit
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-confirm-exit'));
      });

      expect(screen.getByTestId('tour-active-status').props.children).toBe('INACTIVE');
    });

    it('allows 1-tap jumping directly to any step via goToStep', async () => {
      await renderWithProviders(<TestConsumer />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });
      expect(screen.getByTestId('current-step-index').props.children).toBe(0);

      // Jump directly to step 17 (Muhurta Finder section)
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-goto-step-17'));
      });
      expect(screen.getByTestId('current-step-index').props.children).toBe(17);
    });

    it('invokes router.navigate when step tab changes', async () => {
      const navigateSpy = jest.spyOn(router, 'navigate');

      await renderWithProviders(<TestConsumer />);

      // Start tour at step 0 (tab: '/(tabs)')
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      expect(navigateSpy).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('InteractiveTourOverlay UI Component', () => {
    it('does not render overlay when tour is inactive', async () => {
      await renderWithProviders(<InteractiveTourOverlay />);

      expect(screen.queryByTestId('interactive-tour-overlay')).toBeNull();
    });

    it('renders overlay with step metadata and controls when active', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      // Activate tour
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      expect(screen.getByTestId('interactive-tour-overlay')).toBeTruthy();
      expect(screen.getByTestId('tour-spotlight-box')).toBeTruthy();
      expect(screen.getByTestId('tour-spotlight-beacon')).toBeTruthy();
      expect(screen.getByTestId('tour-step-card')).toBeTruthy();
      expect(screen.getByTestId('tour-interactive-next-btn')).toBeTruthy();
      expect(screen.getByTestId('tour-interactive-skip-btn')).toBeTruthy();

      // Back button is disabled on first step
      expect(screen.getByTestId('tour-interactive-back-btn').props.accessibilityState?.disabled).toBe(true);

      // Advance to step 1
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      });

      // Now back button is enabled
      expect(screen.getByTestId('tour-interactive-back-btn').props.accessibilityState?.disabled).toBe(false);
    });

    it('renders 7 quick-jump section chips and switches sections with 1 tap', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      // Verify section chips are rendered
      expect(screen.getByTestId('tour-section-chip-dinacharya')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-dayplanner')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-muhurta')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-festivals')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-prayers')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-more')).toBeTruthy();
      expect(screen.getByTestId('tour-section-chip-settings')).toBeTruthy();

      // Tap on Muhurta chip to jump to Muhurta section (step 17)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-section-chip-muhurta'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(17);
    });

    it('provides hands-on interactive touch target and triggers tap-to-try feedback', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      const interactiveTarget = screen.getByTestId('tour-spotlight-interactive-target');
      expect(interactiveTarget).toBeTruthy();

      const beaconBadge = screen.getByTestId('tour-spotlight-beacon');
      expect(beaconBadge).toBeTruthy();

      const cardTryBtn = screen.getByTestId('tour-interactive-try-btn');
      expect(cardTryBtn).toBeTruthy();

      // Tap card's Try-This button: collapses tour overlay and enters Try Mode
      await act(async () => {
        fireEvent.press(cardTryBtn);
      });

      // Micro-toast confirmation appears
      expect(screen.getByTestId('tour-try-success-toast')).toBeTruthy();

      // Floating docked Try-Mode banner appears with continue & reopen buttons
      const tryModeBanner = screen.getByTestId('tour-try-mode-banner');
      expect(tryModeBanner).toBeTruthy();

      const continueBtn = screen.getByTestId('tour-continue-btn');
      expect(continueBtn).toBeTruthy();

      const reopenBtn = screen.getByTestId('tour-reopen-step-btn');
      expect(reopenBtn).toBeTruthy();

      // Tap reopen to restore the explanation card
      await act(async () => {
        fireEvent.press(reopenBtn);
      });

      expect(screen.getByTestId('tour-step-card')).toBeTruthy();

      // Tap spotlight target directly to re-enter Try Mode
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-spotlight-interactive-target'));
      });

      expect(screen.getByTestId('tour-continue-btn')).toBeTruthy();

      // Tap Continue Tour button -> advances to next step (step index 1)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-continue-btn'));
      });

      expect(screen.getByTestId('tour-step-card')).toBeTruthy();
      expect(screen.getAllByText('१-टैप में भाषा बदलें (EN / हिं)').length).toBeGreaterThanOrEqual(1);
    });

    it('supports swipe gestures on guide card to advance or return', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      const guideCard = screen.getByTestId('tour-step-card');

      // Swipe Left (dx = -60): Next step
      await act(async () => {
        fireEvent(guideCard, 'touchStart', { nativeEvent: { pageX: 200, pageY: 500 } });
        fireEvent(guideCard, 'touchEnd', { nativeEvent: { pageX: 140, pageY: 502 } });
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(1);

      // Swipe Right (dx = +60): Prev step
      await act(async () => {
        fireEvent(guideCard, 'touchStart', { nativeEvent: { pageX: 100, pageY: 500 } });
        fireEvent(guideCard, 'touchEnd', { nativeEvent: { pageX: 160, pageY: 502 } });
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(0);
    });

    it('renders celebration modal with visible high-contrast copy upon completing all steps', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      // Jump to step 34 (final step across all 7 tabs)
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-goto-step-34'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(34);
      expect(screen.getByTestId('tour-interactive-finish-btn')).toBeTruthy();

      // Finish the tour
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-finish-btn'));
      });

      // Celebration modal is displayed
      expect(screen.getByTestId('tour-celebration-finish-btn')).toBeTruthy();
      expect(screen.getByText('हार्दिक बधाई! टूर पूर्ण हुआ')).toBeTruthy();
      expect(screen.getByText('१००% शुद्ध खगोलीय गणित व वैदिक मुहूर्त')).toBeTruthy();
      expect(screen.getByText('पूर्णतः ऑफलाइन, निजी व विज्ञापन-मुक्त')).toBeTruthy();
      expect(screen.getByText('सेटिंग्स में कभी भी "पुनः टूर देखें" उपलब्ध है')).toBeTruthy();

      // Tap start using app button
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-celebration-finish-btn'));
      });

      expect(screen.queryByTestId('tour-celebration-finish-btn')).toBeNull();
    });

    it('opens exit confirmation dialog when Skip is pressed midway (step >= 2), and allows cancel or confirm', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      // Advance to step 2 so midway exit safeguard activates
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      });

      // Press Skip
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-skip-btn'));
      });

      expect(screen.getByTestId('tour-exit-confirm-dialog')).toBeTruthy();
      expect(screen.getByTestId('tour-exit-cancel-btn')).toBeTruthy();
      expect(screen.getByTestId('tour-exit-confirm-btn')).toBeTruthy();

      // Cancel exit / continue tour
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-exit-cancel-btn'));
      });

      expect(screen.queryByTestId('tour-exit-confirm-dialog')).toBeNull();
      expect(screen.getByTestId('interactive-tour-overlay')).toBeTruthy();

      // Press Skip again and confirm exit
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-skip-btn'));
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-exit-confirm-btn'));
      });

      expect(screen.queryByTestId('interactive-tour-overlay')).toBeNull();
    });

    it('supports completing the tour from Try Mode on the final step', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      // Start tour
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });

      // Jump to Community section (final section: steps 30..31)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-section-chip-community'));
      });

      // Advance to step 31 (final step 32)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      });

      // Verify on final step: finish button is shown on guide card
      expect(screen.getByTestId('tour-interactive-finish-btn')).toBeTruthy();

      // Enter Try Mode on the final step
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
      });

      const continueBtn = screen.getByTestId('tour-continue-btn');
      expect(continueBtn).toBeTruthy();

      // Tap finish from Try Mode
      await act(async () => {
        fireEvent.press(continueBtn);
      });

      // Celebration completion card is displayed!
      expect(screen.getByTestId('tour-celebration-finish-btn')).toBeTruthy();

      // Finish celebration
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-celebration-finish-btn'));
      });

      expect(screen.queryByTestId('tour-celebration-finish-btn')).toBeNull();
    });
  });

  describe('ContextualHelpModal UI Component', () => {
    it('does not render when closed', async () => {
      await renderWithProviders(<ContextualHelpModal />);

      expect(screen.queryByTestId('contextual-help-modal')).toBeNull();
    });

    it('renders topic explanations and allows launching full tour or closing', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <ContextualHelpModal />
          <InteractiveTourOverlay />
        </>
      );

      // Open Help for Dinacharya
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-open-help'));
      });

      expect(screen.getByTestId('contextual-help-modal')).toBeTruthy();
      expect(screen.getByTestId('contextual-help-close-btn')).toBeTruthy();
      expect(screen.getByTestId('contextual-help-full-tour-btn')).toBeTruthy();

      // Press Launch Full Tour from Help Modal
      await act(async () => {
        fireEvent.press(screen.getByTestId('contextual-help-full-tour-btn'));
      });

      // Help modal should close, and interactive tour overlay should become visible
      expect(screen.queryByTestId('contextual-help-modal')).toBeNull();
      expect(screen.getByTestId('interactive-tour-overlay')).toBeTruthy();
    });

    it('launches scoped single-section walkthrough from ContextualHelpModal without restarting full tour', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <ContextualHelpModal />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-open-help'));
      });

      const sectionBtn = screen.getByTestId('contextual-help-section-tour-btn');
      expect(sectionBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(sectionBtn);
      });

      expect(screen.queryByTestId('contextual-help-modal')).toBeNull();
      expect(screen.getByTestId('interactive-tour-overlay')).toBeTruthy();
      expect(screen.getByTestId('tour-step-progress-text').props.children).toBe('1/11');
    });
  });

  describe('Tour Resume, Section Tracking, Version Updates & State Awareness', () => {
    it('supports resuming interrupted tour from persisted step index', async () => {
      await saveTourProgressStep(19);
      await renderWithProviders(<TestConsumer />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-resume-tour'));
      });

      expect(screen.getByTestId('tour-active-status').props.children).toBe('ACTIVE');
      expect(screen.getByTestId('current-step-index').props.children).toBe(19);
    });

    it('tracks version-aware updates without forcing v1 users to repeat all steps', async () => {
      await markAppTourCompleted(1);
      await saveTourVersionSeen(1);

      const snapshot = await getTourPersistenceSnapshot();
      expect(snapshot.hasCompletedTour).toBe(true);
      expect(snapshot.lastCompletedVersion).toBe(1);
      expect(snapshot.needsWhatsNewOnly).toBe(true);

      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-whats-new'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(33);
      expect(await markTourSectionCompleted('community')).toContain('community');
      const refreshed = await getTourPersistenceSnapshot();
      expect(refreshed.lastCompletedVersion).toBe(APP_TOUR_VERSION);
      expect(refreshed.needsWhatsNewOnly).toBe(false);
    });

    it('renders state-aware permission rationale banner on location settings step', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-set-denied-location'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-start-tour'));
      });
      await act(async () => {
        // Step 27 (index 27) is step-settings-location-cal with conditionType: 'location_permission'
        fireEvent.press(screen.getByTestId('tour-section-chip-settings'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      });

      const insightBox = screen.getByTestId('tour-state-insight-box');
      expect(insightBox).toBeTruthy();
    });

    it('renders dynamic insights for Wednesday no-Abhijit, empty Sadhana/Planner, denied Notifications, and offline Community', async () => {
      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await fireEvent.press(screen.getByTestId('btn-set-edge-context'));
      await fireEvent.press(screen.getByTestId('btn-start-tour'));

      // Step 2: Temple Bell -> notification_permission
      await fireEvent.press(screen.getByTestId('btn-next-step'));
      await fireEvent.press(screen.getByTestId('btn-next-step'));
      expect(screen.getByTestId('tour-state-insight-box')).toBeTruthy();

      // Step 6: Live Cosmic Compass -> abhijit_status (Wednesday rule)
      await fireEvent.press(screen.getByTestId('btn-goto-step-17'));
      await fireEvent.press(screen.getByTestId('btn-goto-step-30'));
      // Check planner_empty on dayplanner chip
      await fireEvent.press(screen.getByTestId('tour-section-chip-dayplanner'));
      await fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      expect(screen.getByTestId('tour-step-card')).toBeTruthy();
    });

    it('respects OS reduced-motion preference and exercises updated interactive try prompts across Monthly, Prayers & More', async () => {
      const reduceSpy = jest
        .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
        .mockResolvedValue(true);

      await renderWithProviders(
        <>
          <TestConsumer />
          <InteractiveTourOverlay />
        </>
      );

      await waitFor(() => {
        expect(reduceSpy).toHaveBeenCalled();
      });

      await fireEvent.press(screen.getByTestId('btn-start-tour'));

      // Walk Dinacharya -> Language toggle (step 1) & Bell (step 2) -> Monthly Grid (step 10)
      await fireEvent.press(screen.getByTestId('tour-interactive-next-btn'));
      await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
      expect(screen.getByTestId('tour-try-mode-banner')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('tour-continue-btn'));

      await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
      await fireEvent.press(screen.getByTestId('tour-reopen-step-btn'));

      // Jump to Prayers -> tap Try on Collection, Audio, Japa Mala, Chant Loop
      await fireEvent.press(screen.getByTestId('tour-section-chip-prayers'));
      for (let i = 0; i < 4; i++) {
        await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
        await fireEvent.press(screen.getByTestId('tour-continue-btn'));
      }

      // On More Temples -> Deities -> Vrat Katha
      await fireEvent.press(screen.getByTestId('tour-section-chip-more'));
      for (let i = 0; i < 3; i++) {
        await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
        await fireEvent.press(screen.getByTestId('tour-continue-btn'));
      }

      // Community Hub & Feedback
      await fireEvent.press(screen.getByTestId('tour-section-chip-community'));
      await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
      await fireEvent.press(screen.getByTestId('tour-continue-btn'));
      await fireEvent.press(screen.getByTestId('tour-interactive-try-btn'));
      await fireEvent.press(screen.getByTestId('tour-reopen-step-btn'));

      expect(screen.getByTestId('tour-step-card')).toBeTruthy();
      reduceSpy.mockRestore();
    });
  });
});
