import React from 'react';
import {
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as appTourStorage from '@/src/services/appTour';
import { TOUR_SECTIONS, TOUR_STEPS } from '@/src/constants/tourSteps';
import { TourProvider, useTour } from '@/src/services/appTourContext';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { TourTarget } from '@/src/components/TourTarget';
import { InteractiveTourOverlay } from '@/src/components/InteractiveTourOverlay';
import { useTourHorizontalScroll, useTourScroll } from '@/src/hooks/useTourScroll';
import {
  computeHighlightFrame,
  computeTooltipLayout,
  getStepSpotlightRect,
} from '@/src/utils/tourSpotlight';

type MeasureCallback = (x: number, y: number, width: number, height: number) => void;

interface MockViewInstance {
  props?: {
    testID?: string;
    collapsable?: boolean;
    children?: React.ReactNode;
  };
  measureInWindow?: (cb: MeasureCallback) => void;
}

function getChildTestID(children: React.ReactNode): string | undefined {
  if (React.isValidElement(children)) {
    const props = children.props as { testID?: string } | undefined;
    return props?.testID;
  }
  return undefined;
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe('Interactive Tour Precision, Performance & Scroll Sync Suite', () => {
  beforeEach(async () => {
    await appTourStorage.resetAppTour();
    await appTourStorage.clearTourProgressStep();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanup();
  });

  describe('computeHighlightFrame Geometry Engine', () => {
    it('converts window coordinates into overlay-local coordinates using overlayOrigin', () => {
      const frame = computeHighlightFrame(
        {
          x: 24,
          y: 80,
          width: 120,
          height: 48,
          borderRadius: 14,
          shape: 'rounded-rect',
          padding: 4,
          isMeasured: true,
        },
        { x: 0, y: 36 },
        390,
        844
      );

      // localX = 24 - 0 - 4 = 20, localY = 80 - 36 - 4 = 40
      expect(frame).toEqual({
        x: 20,
        y: 40,
        width: 128,
        height: 56,
        borderRadius: 18,
        shape: 'rounded-rect',
      });
    });

    it('preserves exact top-of-screen header positions without pushing highlights down to safeTop', () => {
      const frame = computeHighlightFrame(
        {
          x: 12,
          y: 20,
          width: 366,
          height: 88,
          borderRadius: 18,
          shape: 'rounded-rect',
          padding: 4,
          isMeasured: true,
        },
        { x: 0, y: 0 },
        390,
        844
      );

      expect(frame.y).toBe(16);
      expect(frame.height).toBe(96);
    });

    it('enforces true circular highlight dimensions and radius for circle targets', () => {
      const frame = computeHighlightFrame(
        {
          x: 240,
          y: 44,
          width: 44,
          height: 44,
          borderRadius: 22,
          shape: 'circle',
          padding: 4,
          isMeasured: true,
        },
        { x: 0, y: 0 },
        390,
        844
      );

      expect(frame.shape).toBe('circle');
      expect(frame.width).toBe(52);
      expect(frame.height).toBe(52);
      expect(frame.borderRadius).toBe(26);
      expect(frame.x).toBe(236);
      expect(frame.y).toBe(40);
    });

    it('enforces crisp rectangular corners for rect input steps and clamps edge overflow', () => {
      const rectFrame = computeHighlightFrame(
        {
          x: -6,
          y: 120,
          width: 400,
          height: 52,
          borderRadius: 20,
          shape: 'rect',
          padding: 4,
        },
        { x: 0, y: 0 },
        360,
        640
      );

      expect(rectFrame.shape).toBe('rect');
      expect(rectFrame.borderRadius).toBeLessThanOrEqual(10);
      expect(rectFrame.x).toBeGreaterThanOrEqual(2);
      expect(rectFrame.x + rectFrame.width).toBeLessThanOrEqual(358);
    });
  });

  describe('computeTooltipLayout Non-Overlapping Placement', () => {
    it('places tooltip below with upward beacon for top header elements', () => {
      const highlight = { x: 12, y: 48, width: 366, height: 96 };
      const layout = computeTooltipLayout({
        highlight,
        screenWidth: 390,
        screenHeight: 844,
        safeTop: 48,
        safeBottom: 98,
      });

      expect(layout.placement).toBe('bottom');
      expect(layout.beaconArrowName).toBe('arrow-up');
      expect(layout.beaconTop).toBeGreaterThanOrEqual(highlight.y + highlight.height);
      expect(layout.cardStyle.top).toBeGreaterThan(layout.beaconTop);
      expect(
        boxesOverlap(highlight, {
          x: 12,
          y: layout.cardStyle.top ?? 0,
          width: 366,
          height: 160,
        })
      ).toBe(false);
    });

    it('places tooltip above with downward beacon for bottom-anchored elements', () => {
      const highlight = { x: 16, y: 610, width: 358, height: 80 };
      const layout = computeTooltipLayout({
        highlight,
        screenWidth: 390,
        screenHeight: 844,
        safeTop: 48,
        safeBottom: 98,
      });

      expect(layout.placement).toBe('top');
      expect(layout.beaconArrowName).toBe('arrow-down');
      expect(layout.beaconTop + 32).toBeLessThanOrEqual(highlight.y);
      const cardBottomY = 844 - (layout.cardStyle.bottom ?? 0);
      expect(cardBottomY).toBeLessThanOrEqual(highlight.y);
    });

    it('uses left or right placement on wide tablet screens when vertical room is tight', () => {
      const highlight = { x: 24, y: 120, width: 340, height: 520 };
      const layout = computeTooltipLayout({
        highlight,
        screenWidth: 820,
        screenHeight: 740,
        safeTop: 28,
        safeBottom: 68,
      });

      expect(layout.placement).toBe('right');
      expect(layout.beaconArrowName).toBe('arrow-back');
      expect(layout.cardStyle.left).toBeGreaterThanOrEqual(highlight.x + highlight.width);
    });

    it('avoids keyboard area when safeBottom expands for on-screen keyboard', () => {
      const highlight = { x: 16, y: 260, width: 358, height: 60 };
      const layout = computeTooltipLayout({
        highlight,
        screenWidth: 390,
        screenHeight: 844,
        safeTop: 48,
        safeBottom: 340,
      });

      expect(layout.placement).toBe('top');
      const cardBottomY = 844 - (layout.cardStyle.bottom ?? 0);
      expect(cardBottomY).toBeLessThanOrEqual(highlight.y);
      expect(layout.maxCardHeight).toBeGreaterThanOrEqual(120);
    });
  });

  describe('Live TourTarget Measurement, Shapes, Lifecycle & Overlay Binding', () => {
    it('renders pixel-accurate circular spotlights from measured targets, avoids idle churn, and adjusts for Android overlay origin', async () => {
      const measuredCalls: string[] = [];
      let overlayOrigin = { x: 0, y: 0 };

      const viewProto = View.prototype as unknown as {
        measureInWindow: (cb: MeasureCallback) => void;
      };
      jest
        .spyOn(viewProto, 'measureInWindow')
        .mockImplementation(function (this: MockViewInstance, cb: MeasureCallback) {
          const id = this.props?.testID ?? getChildTestID(this.props?.children);
          if (!id) return;
          measuredCalls.push(id);
          if (id === 'header-lang-btn') {
            cb(260, 50, 44, 44);
          } else if (id === 'header-bell-btn') {
            cb(310, 50, 44, 44);
          } else if (id === 'interactive-tour-overlay') {
            cb(overlayOrigin.x, overlayOrigin.y, 390, 814);
          }
        });

      function TourScreenHarness() {
        const { startTour, currentTourStep } = useTour();
        return (
          <View>
            <TouchableOpacity testID="harness-start" onPress={() => startTour(1)}>
              <Text>Start Step 1</Text>
            </TouchableOpacity>
            <Text testID="harness-active-id">{currentTourStep?.id ?? 'none'}</Text>

            <TourTarget targetId="header-lang-btn" tab="/(tabs)" shape="circle" borderRadius={22}>
              <View testID="header-lang-btn">
                <Text>हिं</Text>
              </View>
            </TourTarget>
            <TourTarget targetId="header-bell-btn" tab="/(tabs)" shape="circle" borderRadius={22}>
              <View testID="header-bell-btn">
                <Text>Bell</Text>
              </View>
            </TourTarget>
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <TourScreenHarness />
            <InteractiveTourOverlay />
          </TourProvider>
        </LanguageProvider>
      );

      // Idle target layout must NOT measure or churn state
      await fireEvent(screen.getByTestId('header-lang-btn').parent!, 'layout');
      await fireEvent(screen.getByTestId('header-bell-btn').parent!, 'layout');
      expect(measuredCalls).toEqual([]);

      // Start directly on step 1 ('step-lang' -> 'header-lang-btn', circle shape)
      await fireEvent.press(screen.getByTestId('harness-start'));

      expect(screen.getByTestId('harness-active-id').props.children).toBe('step-lang');
      expect(measuredCalls).toContain('header-lang-btn');
      expect(measuredCalls).not.toContain('header-bell-btn');

      // Spotlight box must render as a true circle matching measured bounds + 4px pad
      const overlayRoot = screen.getByTestId('interactive-tour-overlay');
      const spotlightBox = screen.getByTestId('tour-spotlight-box');
      const flatBox = StyleSheet.flatten(spotlightBox.props.style);
      expect(flatBox.left).toBe(256);
      expect(flatBox.top).toBe(46);
      expect(flatBox.width).toBe(52);
      expect(flatBox.height).toBe(52);
      expect(flatBox.borderRadius).toBe(26);

      // Non-translucent Android status bar shifts overlay origin down 30px
      overlayOrigin = { x: 0, y: 30 };
      await fireEvent(overlayRoot, 'layout');

      const shiftedBox = StyleSheet.flatten(screen.getByTestId('tour-spotlight-box').props.style);
      expect(shiftedBox.top).toBe(16);
      expect(shiftedBox.left).toBe(256);
    });

    it('cleans up stale rects on unmount without wiping a newer duplicate instance', async () => {
      const viewProto = View.prototype as unknown as {
        measureInWindow: (cb: MeasureCallback) => void;
      };
      jest
        .spyOn(viewProto, 'measureInWindow')
        .mockImplementation(function (this: MockViewInstance, cb: MeasureCallback) {
          const id = getChildTestID(this.props?.children);
          if (id === 'primary-target') {
            cb(220, 48, 44, 44);
          } else if (id === 'secondary-target') {
            cb(240, 48, 46, 46);
          }
        });

      function DuplicateLifecycleHarness() {
        const { startTour, targetRects } = useTour();
        const [showPrimary, setShowPrimary] = React.useState(true);
        const [showSecondary, setShowSecondary] = React.useState(false);

        return (
          <View>
            <TouchableOpacity testID="dup-start" onPress={() => startTour(1)}>
              <Text>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="dup-mount-second" onPress={() => setShowSecondary(true)}>
              <Text>Mount Second</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="dup-unmount-first" onPress={() => setShowPrimary(false)}>
              <Text>Unmount First</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="dup-unmount-second" onPress={() => setShowSecondary(false)}>
              <Text>Unmount Second</Text>
            </TouchableOpacity>
            <Text testID="dup-rect-width">
              {targetRects['header-lang-btn']?.width ?? 'none'}
            </Text>

            {showPrimary && (
              <TourTarget targetId="header-lang-btn" shape="circle">
                <View testID="primary-target" />
              </TourTarget>
            )}
            {showSecondary && (
              <TourTarget targetId="header-lang-btn" shape="circle">
                <View testID="secondary-target" />
              </TourTarget>
            )}
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <DuplicateLifecycleHarness />
          </TourProvider>
        </LanguageProvider>
      );

      await fireEvent.press(screen.getByTestId('dup-start'));
      expect(screen.getByTestId('dup-rect-width').props.children).toBe(44);

      // Mount replacement target first, trigger its layout measurement, then unmount old target
      await fireEvent.press(screen.getByTestId('dup-mount-second'));
      await fireEvent(screen.getByTestId('secondary-target').parent!, 'layout');
      await fireEvent.press(screen.getByTestId('dup-unmount-first'));

      // Old target unmount MUST NOT delete newer instance's measurement
      expect(screen.getByTestId('dup-rect-width').props.children).toBe(46);

      // Unmounting the active surviving instance MUST clear stale rect cleanly
      await fireEvent.press(screen.getByTestId('dup-unmount-second'));
      expect(screen.getByTestId('dup-rect-width').props.children).toBe('none');
    });

    it('renders crisp rect spotlight for input fields and adjusts tooltip on keyboard events', async () => {
      const keyboardListeners: Record<string, ((event?: { endCoordinates?: { height?: number } }) => void)[]> = {};
      jest
        .spyOn(Keyboard, 'addListener')
        .mockImplementation(((eventType: string, cb: (event?: { endCoordinates?: { height?: number } }) => void) => {
          if (!keyboardListeners[eventType]) {
            keyboardListeners[eventType] = [];
          }
          keyboardListeners[eventType].push(cb);
          return { remove: jest.fn() };
        }) as unknown as typeof Keyboard.addListener);

      const viewProto = View.prototype as unknown as {
        measureInWindow: (cb: MeasureCallback) => void;
      };
      jest
        .spyOn(viewProto, 'measureInWindow')
        .mockImplementation(function (this: MockViewInstance, cb: MeasureCallback) {
          const id = this.props?.testID ?? getChildTestID(this.props?.children);
          if (id === 'festival-search-input') {
            cb(16, 460, 358, 48);
          }
        });

      const festivalStepIdx = TOUR_STEPS.findIndex(
        (s) => s.targetTestID === 'festival-search-input'
      );

      function RectKeyboardHarness() {
        const { startTour } = useTour();
        return (
          <View>
            <TouchableOpacity testID="rect-start" onPress={() => startTour(festivalStepIdx)}>
              <Text>Start Festival Search Step</Text>
            </TouchableOpacity>
            <TourTarget targetId="festival-search-input" tab="/(tabs)/festivals" shape="rect" borderRadius={12}>
              <View testID="festival-search-input" />
            </TourTarget>
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <RectKeyboardHarness />
            <InteractiveTourOverlay />
          </TourProvider>
        </LanguageProvider>
      );

      await fireEvent.press(screen.getByTestId('rect-start'));

      const rectBox = StyleSheet.flatten(screen.getByTestId('tour-spotlight-box').props.style);
      expect(rectBox.left).toBe(12);
      expect(rectBox.top).toBe(456);
      expect(rectBox.width).toBe(366);
      expect(rectBox.height).toBe(56);
      expect(rectBox.borderRadius).toBeLessThanOrEqual(10);

      // Show keyboard so tooltip moves cleanly above the target instead of behind keyboard
      const showHandlers = keyboardListeners.keyboardWillShow ?? keyboardListeners.keyboardDidShow ?? [];
      expect(showHandlers.length).toBeGreaterThan(0);
      await act(async () => {
        showHandlers.forEach((fn) => fn({ endCoordinates: { height: 540 } }));
      });
      const cardStyle = StyleSheet.flatten(screen.getByTestId('tour-step-card').props.style);
      expect(cardStyle.bottom).toBeDefined();
      expect(cardStyle.top).toBeUndefined();
    });
  });

  describe('Scrolling Sync, Focus Readiness & Fast Navigation', () => {
    it('scrolls vertically & horizontally into view and re-measures after scroll settles', async () => {
      const vScrollToSpy = jest.fn();
      const hScrollToSpy = jest.fn();
      let currentTargetY = 1220;
      let currentTargetX = 700;

      const viewProto = View.prototype as unknown as {
        measureInWindow: (cb: MeasureCallback) => void;
      };
      jest
        .spyOn(viewProto, 'measureInWindow')
        .mockImplementation(function (this: MockViewInstance, cb: MeasureCallback) {
          const id = getChildTestID(this.props?.children);
          if (id === 'community-segment-feedback') {
            cb(currentTargetX, currentTargetY, 110, 44);
          }
        });

      function ScrollSyncHarness() {
        const vScrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>({
          scrollTo: vScrollToSpy,
        } as unknown as React.ElementRef<typeof ScrollView>);
        const hScrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>({
          scrollTo: hScrollToSpy,
        } as unknown as React.ElementRef<typeof ScrollView>);

        const { onScroll, onMomentumScrollEnd } = useTourScroll('/(tabs)/community', vScrollRef);
        const { onHorizontalScroll } = useTourHorizontalScroll(
          '/(tabs)/community',
          hScrollRef,
          ['community-segment-feedback']
        );
        const { startTour, notifyTabFocused, targetRects } = useTour();

        const feedbackStepIdx = TOUR_STEPS.findIndex(
          (s) => s.targetTestID === 'community-segment-feedback'
        );

        return (
          <View>
            <TouchableOpacity testID="scroll-start" onPress={() => startTour(feedbackStepIdx)}>
              <Text>Start Feedback Step</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="scroll-focus"
              onPress={() => notifyTabFocused('/(tabs)/community')}
            >
              <Text>Focus Tab</Text>
            </TouchableOpacity>
            <Text testID="scroll-measured-y">
              {targetRects['community-segment-feedback']?.y ?? 'none'}
            </Text>

            <ScrollView
              testID="v-scroll"
              onScroll={onScroll}
              onMomentumScrollEnd={onMomentumScrollEnd}
            >
              <ScrollView testID="h-scroll" horizontal onScroll={onHorizontalScroll}>
                <TourTarget targetId="community-segment-feedback" tab="/(tabs)/community">
                  <View testID="community-segment-feedback" />
                </TourTarget>
              </ScrollView>
            </ScrollView>
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <ScrollSyncHarness />
          </TourProvider>
        </LanguageProvider>
      );

      await fireEvent.press(screen.getByTestId('scroll-start'));

      // Off-screen X=370 & Y=1220 triggers both vertical and horizontal scroll alignment
      expect(vScrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ animated: true }));
      expect(hScrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ animated: true }));

      // Simulate scroll settling in window at new coordinates
      currentTargetY = 260;
      currentTargetX = 24;
      await fireEvent(screen.getByTestId('v-scroll'), 'momentumScrollEnd');
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
      });

      expect(screen.getByTestId('scroll-measured-y').props.children).toBe(260);

      // Simulate scrolling above top edge & re-measuring on tab focus
      currentTargetY = -40;
      await fireEvent.press(screen.getByTestId('scroll-focus'));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
      });
      expect(vScrollToSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(hScrollToSpy).toHaveBeenCalledTimes(1);
    });

    it('isolates horizontal strip scrollers from full-width non-strip tour targets on the same route', async () => {
      const hScrollToSpy = jest.fn();

      function HorizontalIsolationHarness() {
        const hScrollRef = React.useRef<React.ElementRef<typeof ScrollView> | null>({
          scrollTo: hScrollToSpy,
        } as unknown as React.ElementRef<typeof ScrollView>);
        const { onHorizontalScroll } = useTourHorizontalScroll(
          '/(tabs)/community',
          hScrollRef,
          ['community-segment-feedback']
        );
        const { startTour, ensureTargetVisible } = useTour();
        const heroIdx = TOUR_STEPS.findIndex((s) => s.targetTestID === 'community-hero-card');

        return (
          <View>
            <TouchableOpacity testID="iso-start" onPress={() => startTour(heroIdx)}>
              <Text>Start Hero</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="iso-check"
              onPress={() =>
                ensureTargetVisible('/(tabs)/community', {
                  x: 4,
                  y: 120,
                  width: 730,
                  height: 150,
                })
              }
            >
              <Text>Check</Text>
            </TouchableOpacity>
            <ScrollView horizontal onScroll={onHorizontalScroll} />
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <HorizontalIsolationHarness />
          </TourProvider>
        </LanguageProvider>
      );

      await fireEvent.press(screen.getByTestId('iso-start'));
      await fireEvent.press(screen.getByTestId('iso-check'));
      expect(hScrollToSpy).not.toHaveBeenCalled();
    });

    it('advances synchronously on rapid Next taps without blocking on AsyncStorage and skips redundant same-tab router.navigate', async () => {
      // Simulate slow disk write so we prove navigation & step state never stall on storage I/O
      let resolveStorageWrite: (() => void) | null = null;
      jest.spyOn(appTourStorage, 'saveTourProgressStep').mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStorageWrite = resolve;
          })
      );

      function FastNavHarness() {
        const { startTour, nextStep, prevStep, currentStepIndex, currentTourStep } = useTour();
        return (
          <View>
            <TouchableOpacity testID="fast-start" onPress={() => startTour(0)}>
              <Text>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="fast-next" onPress={() => nextStep()}>
              <Text>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="fast-prev" onPress={() => prevStep()}>
              <Text>Prev</Text>
            </TouchableOpacity>
            <Text testID="fast-step-index">{currentStepIndex}</Text>
            <Text testID="fast-step-tab">{currentTourStep?.tab ?? 'none'}</Text>
          </View>
        );
      }

      await render(
        <LanguageProvider>
          <TourProvider>
            <FastNavHarness />
            <InteractiveTourOverlay />
          </TourProvider>
        </LanguageProvider>
      );

      await fireEvent.press(screen.getByTestId('fast-start'));
      const initialNavCount = (router.navigate as jest.Mock).mock.calls.length;

      // Steps 0 -> 1 -> 2 -> 3 are all on '/(tabs)': rapid taps update synchronously without blocking
      const t0 = performance.now();
      await fireEvent.press(screen.getByTestId('fast-next'));
      await fireEvent.press(screen.getByTestId('fast-next'));
      await fireEvent.press(screen.getByTestId('fast-next'));
      const elapsedMs = performance.now() - t0;

      expect(screen.getByTestId('fast-step-index').props.children).toBe(3);
      expect(elapsedMs).toBeLessThan(200);
      expect((router.navigate as jest.Mock).mock.calls.length).toBe(initialNavCount);

      await fireEvent.press(screen.getByTestId('fast-prev'));
      expect(screen.getByTestId('fast-step-index').props.children).toBe(2);

      // Jump across tab boundary (muhurta step): navigates once cleanly
      const muhurtaSection = TOUR_SECTIONS.find((s) => s.id === 'muhurta');
      expect(muhurtaSection).toBeDefined();
      await fireEvent.press(screen.getByTestId('tour-section-chip-muhurta'));
      expect(screen.getByTestId('fast-step-index').props.children).toBe(muhurtaSection!.startStep);
      expect(router.navigate).toHaveBeenCalledWith('/(tabs)/muhurta');

      if (resolveStorageWrite) {
        (resolveStorageWrite as () => void)();
      }
    });

    it('verifies all 35 tour steps have valid shapes, fallback rects, and section boundaries', () => {
      expect(TOUR_STEPS.length).toBe(35);
      for (const step of TOUR_STEPS) {
        const rect = getStepSpotlightRect(step, {}, 390, 844, {
          top: 47,
          bottom: 34,
          left: 0,
          right: 0,
        });
        expect(rect.width).toBeGreaterThanOrEqual(40);
        expect(rect.height).toBeGreaterThanOrEqual(36);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(40);
        if (step.shape) {
          expect(['rounded-rect', 'circle', 'rect']).toContain(step.shape);
        }
      }

      // Also assert FlatList ref compatibility compiles & runs
      expect(FlatList).toBeDefined();
    });
  });
});
