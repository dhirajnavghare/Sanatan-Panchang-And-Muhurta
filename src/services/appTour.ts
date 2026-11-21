import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_TOUR_KEY = '@sanatan_app_tour_completed_v1';
const APP_TOUR_PROGRESS_KEY = '@sanatan_app_tour_progress_step_v1';

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
export async function markAppTourCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_TOUR_KEY, 'true');
    await AsyncStorage.removeItem(APP_TOUR_PROGRESS_KEY);
  } catch {
    // Ignore storage errors safely
  }
}

/**
 * Saves current step progress in case user temporarily leaves the app.
 */
export async function saveTourProgressStep(step: number): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_TOUR_PROGRESS_KEY, String(step));
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
    return val ? parseInt(val, 10) || 0 : 0;
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
 * Resets the tour state (useful for testing or manual user replay).
 */
export async function resetAppTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_TOUR_KEY);
    await AsyncStorage.removeItem(APP_TOUR_PROGRESS_KEY);
  } catch {
    // Ignore storage errors safely
  }
}
