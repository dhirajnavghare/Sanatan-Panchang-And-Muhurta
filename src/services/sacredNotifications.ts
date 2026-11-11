import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PanchangData } from '@/src/core/panchang/types';
import { UserSacredProfile } from './userProfile';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions gracefully.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedules dynamic Panchang reminders based on astronomical coordinates and user settings.
 */
export async function scheduleDailySacredReminders(
  panchang: PanchangData,
  profile: UserSacredProfile
): Promise<void> {
  if (Platform.OS === 'web' || !profile.notificationsEnabled) return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Clear previously scheduled daily reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const nowMs = now.getTime();

    // 1. Brahma Muhurta Reminder (96m before sunrise)
    if (profile.notifications.brahmaMuhurtaAlert) {
      const brahmaTime = new Date(panchang.muhurtas.brahmaMuhurta.startTime);
      if (brahmaTime.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((brahmaTime.getTime() - nowMs) / 1000));
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'शुभ ब्रह्म मुहूर्त वेला 🌅',
            body: 'अमृत वेला आरम्भ हो चुकी है। आत्म-चिंतन, ध्यान व कर-दर्शन से दिन का शुभ आरम्भ करें।',
            data: { type: 'brahma' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 2. Rahu Kaal Pre-Warning (15 minutes before Rahu Kaal begins)
    if (profile.notifications.rahuKaalAlert) {
      const rahuStart = new Date(panchang.muhurtas.rahuKaal.startTime);
      const rahuWarningTime = new Date(rahuStart.getTime() - 15 * 60000);
      if (rahuWarningTime.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((rahuWarningTime.getTime() - nowMs) / 1000));
        const startStr = rahuStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = new Date(panchang.muhurtas.rahuKaal.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'राहु काल चेतावनी (15 मिनट शेष) ⚠️',
            body: `आज राहु काल ${startStr} से ${endStr} तक रहेगा। महत्वपूर्ण नए कार्य एवं यात्रा टालें।`,
            data: { type: 'rahu' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 3. Evening Sandhya & Deepa Jyoti Reminder (at Sunset)
    if (profile.notifications.sandhyaDeepamAlert) {
      const sunset = new Date(panchang.sunTimes.sunset);
      if (sunset.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((sunset.getTime() - nowMs) / 1000));
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'सायं सांध्य वेला व दीप प्रज्वलन 🪔',
            body: 'गोधूलि वेला आरम्भ हो चुकी है। घर के मन्दिर व तुलसी जी के समीप घी का दीप प्रज्वलित करें।',
            data: { type: 'deepam' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 4. Ekadashi / Fasting Reminder
    if (profile.notifications.ekadashiAlert) {
      const isDashami = panchang.tithi.current.pakshaIndex === 10;
      // If today is Dashami (Tithi 10), tomorrow is Ekadashi!
      if (isDashami) {
        const eveningReminder = new Date();
        eveningReminder.setHours(19, 0, 0, 0); // 7:00 PM on Dashami eve
        if (eveningReminder.getTime() > nowMs) {
          const secondsUntil = Math.max(10, Math.floor((eveningReminder.getTime() - nowMs) / 1000));
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'कल पवित्र एकादशी व्रत है 🌸',
              body: 'कल श्री हरि विष्णु को समर्पित एकादशी है। अन्न का त्याग कर सात्विक व्रत का सङ्कल्प करें।',
              data: { type: 'ekadashi' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: secondsUntil,
              repeats: false,
            },
          });
        }
      }
    }
  } catch {
    // Non-blocking notification scheduling
  }
}
