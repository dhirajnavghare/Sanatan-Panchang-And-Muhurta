import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourProvider, useTour } from '@/src/services/appTourContext';
import { InteractiveTourOverlay } from '@/src/components/InteractiveTourOverlay';
import { ContextualHelpModal } from '@/src/components/ContextualHelpModal';
import {
  saveTourProgressStep,
  getTourProgressStep,
  clearTourProgressStep,
  hasSeenAppTour,
  markAppTourCompleted,
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
    nextStep,
    prevStep,
    goToStep,
    requestSkipTour,
    confirmExitTour,
    openHelp,
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
      <TouchableOpacity testID="btn-goto-step-16" onPress={() => goToStep(16)}>
        <Text>Go To Step 16</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="btn-goto-step-29" onPress={() => goToStep(29)}>
        <Text>Go To Step 29</Text>
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

  afterEach(() => {
    cleanup();
  });

  const renderWithProviders = async (ui: React.ReactElement) => {
    return render(
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
    it('defines 7 contiguous sections covering all 30 steps with valid metadata', () => {
      expect(TOUR_SECTIONS.length).toBe(7);
      expect(TOUR_SECTIONS[0].startStep).toBe(0);
      expect(TOUR_SECTIONS[TOUR_SECTIONS.length - 1].endStep).toBe(29);

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

    it('should define all 30 comprehensive tour steps covering 6 bottom navigation sections', () => {
      expect(TOUR_STEPS.length).toBe(30);

      const dinacharyaSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)' && s.viewMode !== 'planner');
      const dayPlannerSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)' && s.viewMode === 'planner');
      const muhurtaSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/muhurta');
      const festivalSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/festivals');
      const prayerSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/prayers');
      const moreSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/more');
      const settingsSteps = TOUR_STEPS.filter((s) => s.tab === '/(tabs)/settings');

      expect(dinacharyaSteps.length).toBeGreaterThanOrEqual(6);
      expect(dayPlannerSteps.length).toBeGreaterThanOrEqual(5);
      expect(muhurtaSteps.length).toBeGreaterThanOrEqual(3);
      expect(festivalSteps.length).toBeGreaterThanOrEqual(2);
      expect(prayerSteps.length).toBeGreaterThanOrEqual(3);
      expect(moreSteps.length).toBeGreaterThanOrEqual(2);
      expect(settingsSteps.length).toBeGreaterThanOrEqual(3);
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

      // Jump directly to step 16 (Muhurta Finder section)
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-goto-step-16'));
      });
      expect(screen.getByTestId('current-step-index').props.children).toBe(16);
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

      // Tap on Muhurta chip to jump to Muhurta section (step 16)
      await act(async () => {
        fireEvent.press(screen.getByTestId('tour-section-chip-muhurta'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(16);
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

      // Tap spotlight target directly
      await act(async () => {
        fireEvent.press(interactiveTarget);
      });

      // Micro-toast confirmation appears
      expect(screen.getByTestId('tour-try-success-toast')).toBeTruthy();
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

      // Jump to step 29 (last step)
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-goto-step-29'));
      });

      expect(screen.getByTestId('current-step-index').props.children).toBe(29);
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
  });
});
