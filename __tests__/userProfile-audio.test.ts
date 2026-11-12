import {
  loadUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
  POPULAR_GOTRAS,
  POPULAR_ISHTA_DEVATAS,
} from '../src/services/userProfile';
import {
  playTempleBell,
  playShankhNaad,
  triggerHaptic,
  TEMPLE_BELL_HARMONICS,
} from '../src/services/sacredAudio';
import {
  scheduleDailySacredReminders,
  presentTestNotification,
} from '../src/services/sacredNotifications';
import * as Notifications from 'expo-notifications';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('User Profile, Sacred Audio & Notifications Tests', () => {
  const ujjain = PRESET_CITIES[0];
  const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);

  describe('Devotee Profile Persistence & Gotra Registry', () => {
    it('should load default profile if none exists', async () => {
      const profile = await loadUserProfile();
      expect(profile).toBeDefined();
      expect(typeof profile.audioEnabled).toBe('boolean');
      expect(typeof profile.hapticsEnabled).toBe('boolean');
      expect(typeof profile.notificationsEnabled).toBe('boolean');
    });

    it('should save and update user profile attributes', async () => {
      const testProfile = {
        ...DEFAULT_USER_PROFILE,
        name: 'आर्यभट्ट',
        gotra: 'Kashyapa (कश्यप)',
        ishtaDevata: 'Lord Shiva / Mahadeva',
      };

      const saved = await saveUserProfile(testProfile);
      expect(saved).toBe(true);

      const reloaded = await loadUserProfile();
      expect(reloaded.name).toBe('आर्यभट्ट');
      expect(reloaded.gotra).toBe('Kashyapa (कश्यप)');
      expect(reloaded.ishtaDevata).toBe('Lord Shiva / Mahadeva');
    });

    it('should provide comprehensive list of authentic Vedic Gotras and Deities', () => {
      expect(POPULAR_GOTRAS.length).toBeGreaterThanOrEqual(15);
      expect(POPULAR_ISHTA_DEVATAS.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Sacred Audio Engine & Acoustic Harmonics', () => {
    it('should have acoustic brass bell harmonics matching Mandir Ghanti acoustics', () => {
      expect(Array.isArray(TEMPLE_BELL_HARMONICS)).toBe(true);
      expect(TEMPLE_BELL_HARMONICS.length).toBe(5);
      expect(TEMPLE_BELL_HARMONICS[0].freq).toBeCloseTo(587.33, 1);
      expect(TEMPLE_BELL_HARMONICS[1].freq).toBeCloseTo(1174.66, 1);
    });

    it('should execute playTempleBell and playShankhNaad without errors', () => {
      expect(() => playTempleBell(0.8)).not.toThrow();
      expect(() => playShankhNaad(0.8)).not.toThrow();
    });

    it('should trigger tactile haptics smoothly without throwing', async () => {
      await expect(triggerHaptic('bead', true)).resolves.not.toThrow();
      await expect(triggerHaptic('quarter', true)).resolves.not.toThrow();
      await expect(triggerHaptic('malaComplete', true)).resolves.not.toThrow();
      await expect(triggerHaptic('tap', true)).resolves.not.toThrow();
    });
  });

  describe('Proactive Sacred Notification Reminders', () => {
    it('should schedule notifications for daily sacred events without errors', async () => {
      const profile = {
        ...DEFAULT_USER_PROFILE,
        notificationsEnabled: true,
      };

      await expect(
        scheduleDailySacredReminders(panchang, profile)
      ).resolves.not.toThrow();
    });

    it('should schedule notifications for daily sacred events including Abhijit and To-Dos', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const futureDateEnd = new Date(Date.now() + 7200000);

      const customPanchang = {
        ...panchang,
        muhurtas: {
          ...panchang.muhurtas,
          abhijitMuhurta: {
            name: 'Abhijit',
            nameDevanagari: 'अभिजित',
            startTime: futureDate.toISOString(),
            endTime: futureDateEnd.toISOString(),
            isAuspicious: true,
          },
        },
      };

      const mockDayPlans = {
        abhijit_muhurta: {
          todos: [{ id: '1', text: 'नया अनुबंध हस्ताक्षर', isCompleted: false }],
        },
      };

      const profile = {
        ...DEFAULT_USER_PROFILE,
        notificationsEnabled: true,
        notifications: {
          ...DEFAULT_USER_PROFILE.notifications,
          abhijitAlert: true,
          todoTasksAlert: true,
        },
      };

      await scheduleDailySacredReminders(customPanchang, profile, mockDayPlans);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should present immediate test notification for cosmic alerts', async () => {
      const res = await presentTestNotification(
        '🌟 अभिजित मुहूर्त सक्रिय है',
        'भगवान विष्णु का परम प्रिय विजय काल'
      );
      expect(res).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '🌟 अभिजित मुहूर्त सक्रिय है',
          }),
          trigger: null,
        })
      );
    });

    it('should cancel all notifications when notificationsEnabled is false', async () => {
      const profile = {
        ...DEFAULT_USER_PROFILE,
        notificationsEnabled: false,
      };

      await scheduleDailySacredReminders(panchang, profile);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });
});
