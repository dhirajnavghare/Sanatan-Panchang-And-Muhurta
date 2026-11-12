import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PanchangData } from '@/src/core/panchang/types';
import { UserSacredProfile } from './userProfile';
import { DayPlansMap, buildDayPlannerSlots } from './dayplanner';

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
 * Schedules dynamic Panchang and To-Do task reminders based on astronomical coordinates,
 * active Day Planner slots, and user notification preferences.
 */
export async function scheduleDailySacredReminders(
  panchang: PanchangData,
  profile: UserSacredProfile,
  dayPlans?: DayPlansMap,
  timezone: string = 'Asia/Kolkata'
): Promise<void> {
  if (Platform.OS === 'web' || !profile.notificationsEnabled) {
    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch {
        // Safe catch
      }
    }
    return;
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Clear previously scheduled daily reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const nowMs = now.getTime();

    const formatTime = (d: Date | string | null): string => {
      if (!d) return '';
      const date = typeof d === 'string' ? new Date(d) : d;
      try {
        return new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: timezone,
        }).format(date);
      } catch {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    };

    // Helper to extract pending tasks text for a slot
    const getSlotTaskText = (slotId: string): string => {
      if (!dayPlans || !dayPlans[slotId]) return '';
      const plan = dayPlans[slotId];
      const pendingTodos = plan.todos
        ? plan.todos.filter((t) => !t.isCompleted)
        : plan.taskText && !plan.isCompleted
        ? [{ text: plan.taskText }]
        : [];
      if (pendingTodos.length === 0) return '';
      return `\n🎯 आपके कार्य: ${pendingTodos.map((t, idx) => `${idx + 1}. ${t.text}`).join(' • ')}`;
    };

    // 1. Abhijit Muhurta Alert (Supreme Victory Hour)
    if (profile.notifications.abhijitAlert && panchang.muhurtas.abhijitMuhurta) {
      const ab = panchang.muhurtas.abhijitMuhurta;
      const abStart = new Date(ab.startTime);
      const abEnd = new Date(ab.endTime);
      if (abStart.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((abStart.getTime() - nowMs) / 1000));
        const timeWindow = `${formatTime(abStart)} - ${formatTime(abEnd)}`;
        const taskText = getSlotTaskText('abhijit_muhurta');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🌟 अभिजित मुहूर्त सक्रिय है (${timeWindow})`,
            body: `भगवान विष्णु का परम प्रिय विजय काल • समस्त शुभ कार्य, महत्वपूर्ण निर्णय व आरम्भ हेतु सर्वोत्तम।${taskText}`,
            data: { type: 'abhijit', slotId: 'abhijit_muhurta' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 2. Brahma Muhurta Reminder (Dawn Ambrosial Hour)
    if (profile.notifications.brahmaMuhurtaAlert && panchang.muhurtas.brahmaMuhurta) {
      const bm = panchang.muhurtas.brahmaMuhurta;
      const bmStart = new Date(bm.startTime);
      const bmEnd = new Date(bm.endTime);
      if (bmStart.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((bmStart.getTime() - nowMs) / 1000));
        const timeWindow = `${formatTime(bmStart)} - ${formatTime(bmEnd)}`;
        const taskText = getSlotTaskText('brahma_muhurta');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕊️ ब्रह्म मुहूर्त (अमृत वेला) आरम्भ 🌅 (${timeWindow})`,
            body: `सृष्टि की शुद्धतम सात्विक ऊर्जा • आत्म-चिंतन, ध्यान, मन्त्र जप व प्राणायाम से दिन का आरम्भ करें।${taskText}`,
            data: { type: 'brahma', slotId: 'brahma_muhurta' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 3. Rahu Kaal Pre-Warning (Caution Window)
    if (profile.notifications.rahuKaalAlert && panchang.muhurtas.rahuKaal) {
      const rk = panchang.muhurtas.rahuKaal;
      const rkStart = new Date(rk.startTime);
      const rkEnd = new Date(rk.endTime);
      const warningTime = new Date(rkStart.getTime() - 10 * 60000);
      if (warningTime.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((warningTime.getTime() - nowMs) / 1000));
        const timeWindow = `${formatTime(rkStart)} - ${formatTime(rkEnd)}`;
        const taskText = getSlotTaskText('rahu_kaal');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⚠️ राहु काल चेतावनी (10 मिनट में शुरू)`,
            body: `आज राहु काल ${timeWindow} तक रहेगा। नया उद्यम आरम्भ, धन निवेश या यात्रा टालें • केवल नियमित कार्य जारी रखें।${taskText}`,
            data: { type: 'rahu', slotId: 'rahu_kaal' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 4. Evening Sandhya & Deepa Jyoti Reminder (at Sunset)
    if (profile.notifications.sandhyaDeepamAlert && panchang.sunTimes.sunset) {
      const sunset = new Date(panchang.sunTimes.sunset);
      if (sunset.getTime() > nowMs) {
        const secondsUntil = Math.max(10, Math.floor((sunset.getTime() - nowMs) / 1000));
        const taskText = getSlotTaskText('godhuli_sandhya');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🪔 गोधूलि वेला व सायं दीप प्रज्वलन (${formatTime(sunset)})`,
            body: `गोधूलि वेला आरम्भ हो चुकी है। घर के मन्दिर व तुलसी जी के समीप घी का दीप प्रज्वलित करें, हनुमान चालीसा व आरती करें।${taskText}`,
            data: { type: 'deepam', slotId: 'godhuli_sandhya' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
            repeats: false,
          },
        });
      }
    }

    // 5. Amrit & Shubh Choghadiya Shifts
    if (profile.notifications.choghadiyaAlert && panchang.choghadiya?.day) {
      for (let idx = 0; idx < panchang.choghadiya.day.length; idx++) {
        const ch = panchang.choghadiya.day[idx];
        if (ch.quality === 'Amrit' || ch.quality === 'Shubh') {
          const chStart = new Date(ch.startTime);
          const chEnd = new Date(ch.endTime);
          if (chStart.getTime() > nowMs) {
            const secondsUntil = Math.max(10, Math.floor((chStart.getTime() - nowMs) / 1000));
            const timeWindow = `${formatTime(chStart)} - ${formatTime(chEnd)}`;
            const taskText = getSlotTaskText(`choghadiya_day_${idx}`);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `✨ ${ch.nameDevanagari} चौघड़िया आरम्भ (${timeWindow})`,
                body: `${ch.quality === 'Amrit' ? 'सर्वश्रेष्ठ अमृत वेला: व्यापार, नवीन कार्य आरम्भ, क्रय-विक्रय व विद्याभ्यास करें।' : 'शुभ काल: धार्मिक कार्य, महत्वपूर्ण बैठक व शुभ कार्यों हेतु श्रेष्ठ समय।'}${taskText}`,
                data: { type: 'choghadiya', choghadiyaName: ch.name },
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
    }

    // 6. Planned To-Do Task Reminders (For slots that are not covered above)
    if (profile.notifications.todoTasksAlert && dayPlans) {
      const allSlots = buildDayPlannerSlots(panchang, now);
      const alreadyCoveredIds = ['abhijit_muhurta', 'brahma_muhurta', 'rahu_kaal', 'godhuli_sandhya'];

      for (const slot of allSlots) {
        if (!alreadyCoveredIds.includes(slot.id)) {
          const plan = dayPlans[slot.id];
          if (plan) {
            const pendingTodos = plan.todos
              ? plan.todos.filter((t) => !t.isCompleted)
              : plan.taskText && !plan.isCompleted
              ? [{ text: plan.taskText }]
              : [];

            if (pendingTodos.length > 0 && slot.startTime.getTime() > nowMs) {
              const secondsUntil = Math.max(10, Math.floor((slot.startTime.getTime() - nowMs) / 1000));
              const timeWindow = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `📝 ${slot.titleHi} (${timeWindow})`,
                  body: `🎯 आपके नियोजित कार्य: ${pendingTodos.map((t, idx) => `${idx + 1}. ${t.text}`).join(' • ')}`,
                  data: { type: 'todo', slotId: slot.id },
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
      }
    }

    // 7. Ekadashi / Fasting Reminder
    if (profile.notifications.ekadashiAlert) {
      const isDashami = panchang.tithi.current.pakshaIndex === 10;
      if (isDashami) {
        const eveningReminder = new Date();
        eveningReminder.setHours(19, 0, 0, 0);
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

/**
 * Presents an immediate notification on the phone's notification panel (useful for instant preview/testing).
 */
export async function presentTestNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || { type: 'test' },
      },
      trigger: null, // null trigger delivers immediately!
    });
    return true;
  } catch {
    return false;
  }
}
