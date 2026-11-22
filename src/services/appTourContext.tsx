import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { router } from 'expo-router';
import { TOUR_STEPS } from '../constants/tourSteps';
import { TourStep, SpotlightRect } from '../types/tour';
import {
  markAppTourCompleted,
  saveTourProgressStep,
  clearTourProgressStep,
} from './appTour';
import { triggerHaptic } from './sacredAudio';

export interface TourContextValue {
  isInteractiveTourActive: boolean;
  currentStepIndex: number;
  currentTourStep: TourStep | null;
  totalSteps: number;
  isCompleted: boolean;
  isExitConfirmVisible: boolean;
  isHelpModalVisible: boolean;
  activeHelpTopicId: string | null;
  targetRects: Record<string, SpotlightRect>;
  registerTargetRect: (targetId: string, rect: SpotlightRect) => void;
  startTour: (startStep?: number) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  goToStep: (index: number) => Promise<void>;
  requestSkipTour: () => void;
  confirmExitTour: () => Promise<void>;
  cancelExitTour: () => void;
  finishTour: () => Promise<void>;
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

const defaultTourContext: TourContextValue = {
  isInteractiveTourActive: false,
  currentStepIndex: 0,
  currentTourStep: null,
  totalSteps: TOUR_STEPS.length,
  isCompleted: false,
  isExitConfirmVisible: false,
  isHelpModalVisible: false,
  activeHelpTopicId: null,
  targetRects: {},
  registerTargetRect: () => {},
  startTour: async () => {},
  nextStep: async () => {},
  prevStep: async () => {},
  goToStep: async () => {},
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<string | null>(null);
  const [targetRects, setTargetRects] = useState<Record<string, SpotlightRect>>({});

  const registerTargetRect = useCallback((targetId: string, rect: SpotlightRect) => {
    setTargetRects((prev) => ({
      ...prev,
      [targetId]: rect,
    }));
  }, []);

  const currentTourStep = isInteractiveTourActive && TOUR_STEPS[currentStepIndex]
    ? TOUR_STEPS[currentStepIndex]
    : null;

  // Navigate when step changes
  const navigateToStepTab = useCallback((step: TourStep) => {
    try {
      if (step.tab) {
        router.navigate(step.tab as any);
      }
    } catch {
      // Safe catch if router not ready yet
    }
  }, []);

  const startTour = useCallback(async (startStep?: number) => {
    await triggerHaptic('tap').catch(() => {});
    const stepIdx = typeof startStep === 'number' ? startStep : 0;
    const targetStep = TOUR_STEPS[stepIdx];
    if (targetStep) {
      navigateToStepTab(targetStep);
      await saveTourProgressStep(stepIdx);
    }
    setCurrentStepIndex(stepIdx);
    setIsInteractiveTourActive(true);
    setIsCompleted(false);
    setIsExitConfirmVisible(false);
  }, [navigateToStepTab]);

  const nextStep = useCallback(async () => {
    await triggerHaptic('tap').catch(() => {});
    if (currentStepIndex >= TOUR_STEPS.length - 1) {
      // Completed the tour!
      setIsCompleted(true);
      await markAppTourCompleted();
      await clearTourProgressStep();
    } else {
      const nextIdx = currentStepIndex + 1;
      const targetStep = TOUR_STEPS[nextIdx];
      if (targetStep) {
        navigateToStepTab(targetStep);
        await saveTourProgressStep(nextIdx);
      }
      setCurrentStepIndex(nextIdx);
    }
  }, [currentStepIndex, navigateToStepTab]);

  const prevStep = useCallback(async () => {
    await triggerHaptic('tap').catch(() => {});
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      const targetStep = TOUR_STEPS[prevIdx];
      if (targetStep) {
        navigateToStepTab(targetStep);
        await saveTourProgressStep(prevIdx);
      }
      setCurrentStepIndex(prevIdx);
    }
  }, [currentStepIndex, navigateToStepTab]);

  const goToStep = useCallback(async (stepIdx: number) => {
    await triggerHaptic('tap').catch(() => {});
    const safeIdx = Math.max(0, Math.min(stepIdx, TOUR_STEPS.length - 1));
    const targetStep = TOUR_STEPS[safeIdx];
    if (targetStep) {
      navigateToStepTab(targetStep);
      await saveTourProgressStep(safeIdx);
    }
    setCurrentStepIndex(safeIdx);
  }, [navigateToStepTab]);

  const confirmExitTour = useCallback(async () => {
    await triggerHaptic('tap').catch(() => {});
    setIsInteractiveTourActive(false);
    setIsExitConfirmVisible(false);
    setIsCompleted(false);
    await markAppTourCompleted();
  }, []);

  const requestSkipTour = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    // If user has made meaningful progress (past step 2), confirm exit
    if (currentStepIndex >= 2 && !isCompleted) {
      setIsExitConfirmVisible(true);
    } else {
      confirmExitTour();
    }
  }, [currentStepIndex, isCompleted, confirmExitTour]);

  const cancelExitTour = useCallback(() => {
    triggerHaptic('tap').catch(() => {});
    setIsExitConfirmVisible(false);
  }, []);

  const finishTour = useCallback(async () => {
    await triggerHaptic('malaComplete').catch(() => {});
    setIsInteractiveTourActive(false);
    setIsCompleted(false);
    await markAppTourCompleted();
    await clearTourProgressStep();
    // Return to main Dinacharya screen
    router.navigate('/(tabs)' as any);
  }, []);

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

  return (
    <TourContext.Provider
      value={{
        isInteractiveTourActive,
        currentStepIndex,
        currentTourStep,
        totalSteps: TOUR_STEPS.length,
        isCompleted,
        isExitConfirmVisible,
        isHelpModalVisible,
        activeHelpTopicId,
        targetRects,
        registerTargetRect,
        startTour,
        nextStep,
        prevStep,
        goToStep,
        requestSkipTour,
        confirmExitTour,
        cancelExitTour,
        finishTour,
        openHelp,
        closeHelp,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
