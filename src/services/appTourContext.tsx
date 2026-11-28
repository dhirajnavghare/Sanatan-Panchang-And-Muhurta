import React, { createContext, useContext, useState, useCallback, useRef, useMemo, ReactNode } from 'react';
import { router } from 'expo-router';
import { TOUR_STEPS, TOUR_SECTIONS } from '../constants/tourSteps';
import {
  TourStep,
  SpotlightRect,
  TourRuntimeContext,
  TourTabRoute,
  TourTargetRegistration,
} from '../types/tour';
import {
  APP_TOUR_VERSION,
  TourPersistenceSnapshot,
  markAppTourCompleted,
  markTourSectionCompleted,
  saveTourProgressStep,
  getTourProgressStep,
  clearTourProgressStep,
  saveTourVersionSeen,
  getTourPersistenceSnapshot,
} from './appTour';
import { triggerHaptic } from './sacredAudio';

const defaultRuntimeContext: TourRuntimeContext = {
  plannedTaskCount: 0,
  completedSadhanaCount: 0,
  isAbhijitAvailableToday: true,
  locationPermission: 'unknown',
  notificationPermission: 'unknown',
  hasNetworkErrorOnCommunity: false,
};

export interface TourContextValue {
  isInteractiveTourActive: boolean;
  isTryModeActive: boolean;
  currentStepIndex: number;
  currentTourStep: TourStep | null;
  totalSteps: number;
  activeSectionId: string | null;
  sectionStepRange: { start: number; end: number } | null;
  isCompleted: boolean;
  isExitConfirmVisible: boolean;
  isHelpModalVisible: boolean;
  activeHelpTopicId: string | null;
  targetRects: Record<string, SpotlightRect>;
  savedProgressStep: number;
  completedSections: string[];
  needsWhatsNewOnly: boolean;
  tourRuntimeContext: TourRuntimeContext;
  registerTargetRect: (targetId: string, rect: SpotlightRect) => void;
  unregisterTargetRect: (targetId: string) => void;
  registerTarget: (registration: TourTargetRegistration) => () => void;
  hasRegisteredTarget: (targetId: string) => boolean;
  requestActiveTargetMeasure: (tab?: TourTabRoute, allowScrollAdjust?: boolean) => void;
  notifyTabFocused: (tab: TourTabRoute) => void;
  registerScrollContainer: (
    tab: TourTabRoute,
    scrollFn: (rect: SpotlightRect) => boolean | void
  ) => () => void;
  ensureTargetVisible: (tab: TourTabRoute, rect: SpotlightRect) => boolean;
  updateTourRuntimeContext: (patch: Partial<TourRuntimeContext>) => void;
  refreshTourPersistence: () => Promise<TourPersistenceSnapshot>;
  startTour: (startStep?: number) => Promise<void>;
  resumeTour: () => Promise<void>;
  startSectionTour: (sectionId: string) => Promise<void>;
  startWhatsNewTour: () => Promise<void>;
  dismissWhatsNew: () => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  goToStep: (index: number) => Promise<void>;
  enterTryMode: () => void;
  continueTourFromTryMode: () => Promise<void>;
  exitTryMode: () => void;
  requestSkipTour: () => void;
  confirmExitTour: () => Promise<void>;
  cancelExitTour: () => void;
  finishTour: () => Promise<void>;
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

const defaultTourContext: TourContextValue = {
  isInteractiveTourActive: false,
  isTryModeActive: false,
  currentStepIndex: 0,
  currentTourStep: null,
  totalSteps: TOUR_STEPS.length,
  activeSectionId: null,
  sectionStepRange: null,
  isCompleted: false,
  isExitConfirmVisible: false,
  isHelpModalVisible: false,
  activeHelpTopicId: null,
  targetRects: {},
  savedProgressStep: 0,
  completedSections: [],
  needsWhatsNewOnly: false,
  tourRuntimeContext: defaultRuntimeContext,
  registerTargetRect: () => {},
  unregisterTargetRect: () => {},
  registerTarget: () => () => {},
  hasRegisteredTarget: () => false,
  requestActiveTargetMeasure: () => {},
  notifyTabFocused: () => {},
  registerScrollContainer: () => () => {},
  ensureTargetVisible: () => false,
  updateTourRuntimeContext: () => {},
  refreshTourPersistence: async () => ({
    hasCompletedTour: false,
    savedProgressStep: 0,
    lastCompletedVersion: 0,
    completedSections: [],
    needsWhatsNewOnly: false,
  }),
  startTour: async () => {},
  resumeTour: async () => {},
  startSectionTour: async () => {},
  startWhatsNewTour: async () => {},
  dismissWhatsNew: async () => {},
  nextStep: async () => {},
  prevStep: async () => {},
  goToStep: async () => {},
  enterTryMode: () => {},
  continueTourFromTryMode: async () => {},
  exitTryMode: () => {},
  requestSkipTour: () => {},
  confirmExitTour: async () => {},
  cancelExitTour: () => {},
  finishTour: async () => {},
  openHelp: () => {},
  closeHelp: () => {},
};

export const TourContext = createContext<TourContextValue>(defaultTourContext);

export const useTour = () => useContext(TourContext);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isInteractiveTourActive, setIsInteractiveTourActive] = useState(false);
  const [isTryModeActive, setIsTryModeActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<string | null>(null);
  const [targetRects, setTargetRects] = useState<Record<string, SpotlightRect>>({});
  const [savedProgressStep, setSavedProgressStep] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [needsWhatsNewOnly, setNeedsWhatsNewOnly] = useState(false);
  const [tourRuntimeContext, setTourRuntimeContext] =
    useState<TourRuntimeContext>(defaultRuntimeContext);

  const currentStepIndexRef = useRef(0);
  const isInteractiveTourActiveRef = useRef(false);
  const isTryModeActiveRef = useRef(false);
  const lastNavigatedTabRef = useRef<TourTabRoute | null>(null);

  const targetRegistryRef = useRef<Record<string, TourTargetRegistration>>({});
  const scrollHandlersRef = useRef<
    Partial<Record<TourTabRoute, Set<(rect: SpotlightRect) => boolean | void>>>
  >({});

  const sectionStepRange = useMemo(() => {
    const sec = activeSectionId
      ? TOUR_SECTIONS.find((s) => s.id === activeSectionId) ?? null
      : null;
    return sec ? { start: sec.startStep, end: sec.endStep } : null;
  }, [activeSectionId]);

  const registerTargetRect = useCallback((targetId: string, rect: SpotlightRect) => {
    setTargetRects((prev) => {
      const existing = prev[targetId];
      if (
        existing &&
        Math.abs(existing.x - rect.x) <= 0.5 &&
        Math.abs(existing.y - rect.y) <= 0.5 &&
        Math.abs(existing.width - rect.width) <= 0.5 &&
        Math.abs(existing.height - rect.height) <= 0.5 &&
        existing.borderRadius === rect.borderRadius &&
        existing.shape === rect.shape
      ) {
        return prev;
      }
      return {
        ...prev,
        [targetId]: rect,
      };
    });
  }, []);

  const unregisterTargetRect = useCallback((targetId: string) => {
    setTargetRects((prev) => {
      if (!prev[targetId]) return prev;
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  }, []);

  const registerTarget = useCallback((registration: TourTargetRegistration) => {
    const { targetId } = registration;
    targetRegistryRef.current[targetId] = registration;

    // If this target is currently active in the tour, measure it immediately on mount/update
    const activeStep = isInteractiveTourActiveRef.current
      ? TOUR_STEPS[currentStepIndexRef.current]
      : null;
    const activeTargetId = activeStep ? activeStep.targetTestID || activeStep.id : null;
    if (
      isInteractiveTourActiveRef.current &&
      !isTryModeActiveRef.current &&
      activeTargetId === targetId
    ) {
      requestAnimationFrame(() => {
        if (targetRegistryRef.current[targetId] === registration) {
          registration.measureNow(true);
        }
      });
    }

    return () => {
      if (targetRegistryRef.current[targetId] === registration) {
        delete targetRegistryRef.current[targetId];
      }
    };
  }, []);

  const hasRegisteredTarget = useCallback((targetId: string) => {
    return Boolean(targetRegistryRef.current[targetId]);
  }, []);

  const requestActiveTargetMeasure = useCallback(
    (tab?: TourTabRoute, allowScrollAdjust = true) => {
      if (!isInteractiveTourActiveRef.current || isTryModeActiveRef.current) return;
      const step = TOUR_STEPS[currentStepIndexRef.current];
      if (!step) return;
      if (tab && step.tab !== tab) return;
      const tid = step.targetTestID || step.id;
      const entry = targetRegistryRef.current[tid];
      if (entry) {
        entry.measureNow(allowScrollAdjust);
      }
    },
    []
  );

  const notifyTabFocused = useCallback(
    (tab: TourTabRoute) => {
      lastNavigatedTabRef.current = tab;
      if (!isInteractiveTourActiveRef.current || isTryModeActiveRef.current) return;
      const step = TOUR_STEPS[currentStepIndexRef.current];
      if (!step || step.tab !== tab) return;
      requestAnimationFrame(() => {
        requestActiveTargetMeasure(tab, true);
      });
    },
    [requestActiveTargetMeasure]
  );

  const registerScrollContainer = useCallback(
    (tab: TourTabRoute, scrollFn: (rect: SpotlightRect) => boolean | void) => {
      if (!scrollHandlersRef.current[tab]) {
        scrollHandlersRef.current[tab] = new Set();
      }
      scrollHandlersRef.current[tab]!.add(scrollFn);
      return () => {
        const set = scrollHandlersRef.current[tab];
        if (set) {
          set.delete(scrollFn);
          if (set.size === 0) {
            delete scrollHandlersRef.current[tab];
          }
        }
      };
    },
    []
  );

  const ensureTargetVisible = useCallback((tab: TourTabRoute, rect: SpotlightRect): boolean => {
    const handlers = scrollHandlersRef.current[tab];
    if (!handlers || handlers.size === 0) return false;
    let scrolled = false;
    handlers.forEach((handler) => {
      if (handler(rect) === true) {
        scrolled = true;
      }
    });
    return scrolled;
  }, []);

  const updateTourRuntimeContext = useCallback((patch: Partial<TourRuntimeContext>) => {
    setTourRuntimeContext((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  const refreshTourPersistence = useCallback(async () => {
    const snapshot = await getTourPersistenceSnapshot();
    setSavedProgressStep(snapshot.savedProgressStep);
    setCompletedSections(snapshot.completedSections);
    setNeedsWhatsNewOnly(snapshot.needsWhatsNewOnly);
    return snapshot;
  }, []);

  const currentTourStep =
    isInteractiveTourActive && TOUR_STEPS[currentStepIndex]
      ? TOUR_STEPS[currentStepIndex]
      : null;

  // Navigate only when destination tab differs from current tab
  const navigateToStepTab = useCallback((step: TourStep, force = false) => {
    try {
      if (step.tab && (force || lastNavigatedTabRef.current !== step.tab)) {
        lastNavigatedTabRef.current = step.tab;
        router.navigate(step.tab as any);
      }
    } catch {
      // Safe catch if router not ready yet
    }
  }, []);

  const clearTargetCache = useCallback(
    (step: TourStep, onlyWhenCrossTab = false, prevTab?: TourTabRoute) => {
      if (onlyWhenCrossTab && prevTab === step.tab) {
        return;
      }
      const tid = step.targetTestID || step.id;
      unregisterTargetRect(tid);
    },
    [unregisterTargetRect]
  );

  const startTour = useCallback(
    async (startStep?: number) => {
      triggerHaptic('tap').catch(() => {});
      const stepIdx = typeof startStep === 'number'
        ? Math.max(0, Math.min(startStep, TOUR_STEPS.length - 1))
        : 0;
      const targetStep = TOUR_STEPS[stepIdx];
      currentStepIndexRef.current = stepIdx;
      isInteractiveTourActiveRef.current = true;
      isTryModeActiveRef.current = false;

      setActiveSectionId(null);
      if (targetStep) {
        clearTargetCache(targetStep, false);
        navigateToStepTab(targetStep, true);
        setSavedProgressStep(stepIdx);
        saveTourProgressStep(stepIdx).catch(() => {});
      }
      setCurrentStepIndex(stepIdx);
      setIsInteractiveTourActive(true);
      setIsTryModeActive(false);
      setIsCompleted(false);
      setIsExitConfirmVisible(false);
    },
    [navigateToStepTab, clearTargetCache]
  );

  const resumeTour = useCallback(async () => {
    const saved = await getTourProgressStep();
    const validStep = saved > 0 && saved < TOUR_STEPS.length ? saved : 0;
    await startTour(validStep);
  }, [startTour]);

  const startSectionTour = useCallback(
    async (sectionId: string) => {
      const section = TOUR_SECTIONS.find((s) => s.id === sectionId);
      if (!section) {
        await startTour(0);
        return;
      }
      triggerHaptic('tap').catch(() => {});
      const startIdx = section.startStep;
      const targetStep = TOUR_STEPS[startIdx];
      currentStepIndexRef.current = startIdx;
      isInteractiveTourActiveRef.current = true;
      isTryModeActiveRef.current = false;

      setActiveSectionId(section.id);
      setIsHelpModalVisible(false);
      setActiveHelpTopicId(null);
      if (targetStep) {
        clearTargetCache(targetStep, false);
        navigateToStepTab(targetStep, true);
      }
      setCurrentStepIndex(startIdx);
      setIsInteractiveTourActive(true);
      setIsTryModeActive(false);
      setIsCompleted(false);
      setIsExitConfirmVisible(false);
    },
    [clearTargetCache, navigateToStepTab, startTour]
  );

  const startWhatsNewTour = useCallback(async () => {
    const newSection = TOUR_SECTIONS.find((s) => (s.addedInVersion ?? 1) >= APP_TOUR_VERSION);
    setNeedsWhatsNewOnly(false);
    saveTourVersionSeen(APP_TOUR_VERSION).catch(() => {});
    if (newSection) {
      await startSectionTour(newSection.id);
    } else {
      await startTour(0);
    }
  }, [startSectionTour, startTour]);

  const dismissWhatsNew = useCallback(async () => {
    setNeedsWhatsNewOnly(false);
    await saveTourVersionSeen(APP_TOUR_VERSION);
  }, []);

  const nextStep = useCallback(async () => {
    triggerHaptic('tap').catch(() => {});
    isTryModeActiveRef.current = false;
    setIsTryModeActive(false);

    const activeIdx = currentStepIndexRef.current;
    const prevStepObj = TOUR_STEPS[activeIdx];
    const maxIndex = sectionStepRange ? sectionStepRange.end : TOUR_STEPS.length - 1;
    if (activeIdx >= maxIndex) {
      // Completed the tour or focused section walkthrough
      setIsCompleted(true);
      if (activeSectionId) {
        const updated = await markTourSectionCompleted(activeSectionId);
        setCompletedSections(updated);
        await saveTourVersionSeen(APP_TOUR_VERSION);
      } else {
        await markAppTourCompleted();
        await clearTourProgressStep();
        setSavedProgressStep(0);
        setNeedsWhatsNewOnly(false);
      }
    } else {
      const nextIdx = activeIdx + 1;
      const targetStep = TOUR_STEPS[nextIdx];
      currentStepIndexRef.current = nextIdx;
      if (targetStep) {
        clearTargetCache(targetStep, true, prevStepObj?.tab);
        navigateToStepTab(targetStep);
        if (!activeSectionId) {
          setSavedProgressStep(nextIdx);
          saveTourProgressStep(nextIdx).catch(() => {});
        }
      }
      setCurrentStepIndex(nextIdx);
    }
  }, [
    sectionStepRange,
    activeSectionId,
    navigateToStepTab,
    clearTargetCache,
  ]);

  const prevStep = useCallback(async () => {
    triggerHaptic('tap').catch(() => {});
    isTryModeActiveRef.current = false;
    setIsTryModeActive(false);

    const activeIdx = currentStepIndexRef.current;
    const nextStepObj = TOUR_STEPS[activeIdx];
    const minIndex = sectionStepRange ? sectionStepRange.start : 0;
    if (activeIdx > minIndex) {
      const prevIdx = activeIdx - 1;
      const targetStep = TOUR_STEPS[prevIdx];
      currentStepIndexRef.current = prevIdx;
      if (targetStep) {
        clearTargetCache(targetStep, true, nextStepObj?.tab);
        navigateToStepTab(targetStep);
        if (!activeSectionId) {
          setSavedProgressStep(prevIdx);
          saveTourProgressStep(prevIdx).catch(() => {});
        }
      }
      setCurrentStepIndex(prevIdx);
    }
  }, [sectionStepRange, activeSectionId, navigateToStepTab, clearTargetCache]);

  const goToStep = useCallback(
    async (stepIdx: number) => {
      triggerHaptic('tap').catch(() => {});
      isTryModeActiveRef.current = false;
      setIsTryModeActive(false);

      const safeIdx = Math.max(0, Math.min(stepIdx, TOUR_STEPS.length - 1));
      const prevStepObj = TOUR_STEPS[currentStepIndexRef.current];
      currentStepIndexRef.current = safeIdx;
      if (
        sectionStepRange &&
        (safeIdx < sectionStepRange.start || safeIdx > sectionStepRange.end)
      ) {
        setActiveSectionId(null);
      }
      const targetStep = TOUR_STEPS[safeIdx];
      if (targetStep) {
        clearTargetCache(targetStep, true, prevStepObj?.tab);
        navigateToStepTab(targetStep);
        setSavedProgressStep(safeIdx);
        saveTourProgressStep(safeIdx).catch(() => {});
      }
      setCurrentStepIndex(safeIdx);
    },
    [sectionStepRange, navigateToStepTab, clearTargetCache]
  );

  const enterTryMode = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    isTryModeActiveRef.current = true;
    setIsTryModeActive(true);
  }, []);

  const exitTryMode = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    isTryModeActiveRef.current = false;
    setIsTryModeActive(false);
  }, []);

  const continueTourFromTryMode = useCallback(async () => {
    isTryModeActiveRef.current = false;
    setIsTryModeActive(false);
    await nextStep();
  }, [nextStep]);

  const confirmExitTour = useCallback(async () => {
    triggerHaptic('tap').catch(() => {});
    const wasSectionTour = Boolean(activeSectionId);
    isInteractiveTourActiveRef.current = false;
    isTryModeActiveRef.current = false;
    setIsInteractiveTourActive(false);
    setIsTryModeActive(false);
    setIsExitConfirmVisible(false);
    setIsCompleted(false);
    setActiveSectionId(null);
    if (!wasSectionTour) {
      setSavedProgressStep(0);
      setNeedsWhatsNewOnly(false);
      await markAppTourCompleted();
    }
  }, [activeSectionId]);

  const requestSkipTour = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    isTryModeActiveRef.current = false;
    setIsTryModeActive(false);
    const localProgress = sectionStepRange
      ? currentStepIndexRef.current - sectionStepRange.start
      : currentStepIndexRef.current;
    if (localProgress >= 2 && !isCompleted) {
      setIsExitConfirmVisible(true);
    } else {
      confirmExitTour();
    }
  }, [sectionStepRange, isCompleted, confirmExitTour]);

  const cancelExitTour = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    setIsExitConfirmVisible(false);
  }, []);

  const finishTour = useCallback(async () => {
    triggerHaptic('malaComplete').catch(() => {});
    const finishedSectionId = activeSectionId;
    isInteractiveTourActiveRef.current = false;
    isTryModeActiveRef.current = false;
    setIsInteractiveTourActive(false);
    setIsTryModeActive(false);
    setIsCompleted(false);
    setActiveSectionId(null);
    if (finishedSectionId) {
      const updated = await markTourSectionCompleted(finishedSectionId);
      setCompletedSections(updated);
      await saveTourVersionSeen(APP_TOUR_VERSION);
    } else {
      setSavedProgressStep(0);
      setNeedsWhatsNewOnly(false);
      await markAppTourCompleted();
      await clearTourProgressStep();
      lastNavigatedTabRef.current = '/(tabs)';
      router.navigate('/(tabs)' as any);
    }
  }, [activeSectionId]);

  const openHelp = useCallback((topicId: string) => {
    triggerHaptic('tap').catch(() => {});
    setActiveHelpTopicId(topicId);
    setIsHelpModalVisible(true);
  }, []);

  const closeHelp = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    setIsHelpModalVisible(false);
    setActiveHelpTopicId(null);
  }, []);

  const contextValue = useMemo<TourContextValue>(
    () => ({
      isInteractiveTourActive,
      isTryModeActive,
      currentStepIndex,
      currentTourStep,
      totalSteps: TOUR_STEPS.length,
      activeSectionId,
      sectionStepRange,
      isCompleted,
      isExitConfirmVisible,
      isHelpModalVisible,
      activeHelpTopicId,
      targetRects,
      savedProgressStep,
      completedSections,
      needsWhatsNewOnly,
      tourRuntimeContext,
      registerTargetRect,
      unregisterTargetRect,
      registerTarget,
      hasRegisteredTarget,
      requestActiveTargetMeasure,
      notifyTabFocused,
      registerScrollContainer,
      ensureTargetVisible,
      updateTourRuntimeContext,
      refreshTourPersistence,
      startTour,
      resumeTour,
      startSectionTour,
      startWhatsNewTour,
      dismissWhatsNew,
      nextStep,
      prevStep,
      goToStep,
      enterTryMode,
      continueTourFromTryMode,
      exitTryMode,
      requestSkipTour,
      confirmExitTour,
      cancelExitTour,
      finishTour,
      openHelp,
      closeHelp,
    }),
    [
      isInteractiveTourActive,
      isTryModeActive,
      currentStepIndex,
      currentTourStep,
      activeSectionId,
      sectionStepRange,
      isCompleted,
      isExitConfirmVisible,
      isHelpModalVisible,
      activeHelpTopicId,
      targetRects,
      savedProgressStep,
      completedSections,
      needsWhatsNewOnly,
      tourRuntimeContext,
      registerTargetRect,
      unregisterTargetRect,
      registerTarget,
      hasRegisteredTarget,
      requestActiveTargetMeasure,
      notifyTabFocused,
      registerScrollContainer,
      ensureTargetVisible,
      updateTourRuntimeContext,
      refreshTourPersistence,
      startTour,
      resumeTour,
      startSectionTour,
      startWhatsNewTour,
      dismissWhatsNew,
      nextStep,
      prevStep,
      goToStep,
      enterTryMode,
      continueTourFromTryMode,
      exitTryMode,
      requestSkipTour,
      confirmExitTour,
      cancelExitTour,
      finishTour,
      openHelp,
      closeHelp,
    ]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};
