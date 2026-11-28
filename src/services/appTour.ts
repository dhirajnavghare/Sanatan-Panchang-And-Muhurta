import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_TOUR_VERSION = 2;

const APP_TOUR_KEY = '@sanatan_app_tour_completed_v1';
const APP_TOUR_PROGRESS_KEY = '@sanatan_app_tour_progress_step_v1';
const APP_TOUR_VERSION_KEY = '@sanatan_app_tour_version_v1';
const APP_TOUR_SECTIONS_KEY = '@sanatan_app_tour_completed_sections_v1';

export interface TourPersistenceSnapshot {
  hasCompletedTour: boolean;
  savedProgressStep: number;
  lastCompletedVersion: number;
  completedSections: string[];
  needsWhatsNewOnly: boolean;
}

/**
 * Checks if the user has already completed or dismissed the app walkthrough tour.
 */
export async function hasSeenAppTour(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(APP_TOUR_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks the app walkthrough tour as completed so it won't pop up automatically again.
 */
export async function markAppTourCompleted(version: number = APP_TOUR_VERSION): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_TOUR_KEY, 'true');
    await AsyncStorage.setItem(APP_TOUR_VERSION_KEY, String(version));
    await AsyncStorage.removeItem(APP_TOUR_PROGRESS_KEY);
  } catch {
    // Ignore storage errors safely
  }
}

/**
 * Saves current step progress in case user temporarily leaves or interrupts the tour.
 */
export async function saveTourProgressStep(step: number): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_TOUR_PROGRESS_KEY, String(Math.max(0, step)));
  } catch {
    // Ignore storage errors safely
  }
}

/**
 * Retrieves saved tour step progress.
 */
export async function getTourProgressStep(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(APP_TOUR_PROGRESS_KEY);
    const parsed = val ? parseInt(val, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/**
 * Clears saved tour progress.
 */
export async function clearTourProgressStep(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_TOUR_PROGRESS_KEY);
  } catch {
    // Ignore storage errors safely
  }
}

/**
 * Records completion of an individual feature walkthrough section.
 */
export async function markTourSectionCompleted(sectionId: string): Promise<string[]> {
  try {
    const existing = await getCompletedTourSections();
    if (!existing.includes(sectionId)) {
      const updated = [...existing, sectionId];
      await AsyncStorage.setItem(APP_TOUR_SECTIONS_KEY, JSON.stringify(updated));
      return updated;
    }
    return existing;
  } catch {
    return [];
  }
}

export async function getCompletedTourSections(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(APP_TOUR_SECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getLastSeenTourVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(APP_TOUR_VERSION_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function saveTourVersionSeen(version: number = APP_TOUR_VERSION): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_TOUR_VERSION_KEY, String(version));
  } catch {
    // Ignore storage errors safely
  }
}

/**
 * Returns full tour persistence snapshot supporting resume, section tracking,
 * and version-aware updates without unnecessarily restarting the entire tour.
 */
export async function getTourPersistenceSnapshot(): Promise<TourPersistenceSnapshot> {
  const [hasCompletedTour, savedProgressStep, lastCompletedVersion, completedSections] =
    await Promise.all([
      hasSeenAppTour(),
      getTourProgressStep(),
      getLastSeenTourVersion(),
      getCompletedTourSections(),
    ]);

  // If user completed v1 before v2 was released, offer only new sections rather than restarting all 30+ steps
  const needsWhatsNewOnly =
    hasCompletedTour && lastCompletedVersion > 0 && lastCompletedVersion < APP_TOUR_VERSION;

  return {
    hasCompletedTour,
    savedProgressStep,
    lastCompletedVersion,
    completedSections,
    needsWhatsNewOnly,
  };
}

/**
 * Resets the tour state (useful for testing or manual user replay).
 */
export async function resetAppTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_TOUR_KEY);
    await AsyncStorage.removeItem(APP_TOUR_PROGRESS_KEY);
    await AsyncStorage.removeItem(APP_TOUR_VERSION_KEY);
    await AsyncStorage.removeItem(APP_TOUR_SECTIONS_KEY);
  } catch {
    // Ignore storage errors safely
  }
}
