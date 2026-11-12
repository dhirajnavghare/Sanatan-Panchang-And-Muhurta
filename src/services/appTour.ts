import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_TOUR_KEY = '@sanatan_app_tour_completed_v1';

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
  } catch {
    // Ignore storage errors safely
  }
}
