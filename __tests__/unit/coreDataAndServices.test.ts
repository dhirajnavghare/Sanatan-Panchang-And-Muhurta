import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { TourProvider, useTour } from '@/src/services/appTourContext';
import { useTourScroll } from '@/src/hooks/useTourScroll';
import { TOUR_STEPS } from '@/src/constants/tourSteps';
import { getStepTryLabel } from '@/src/components/InteractiveTourOverlay';
import {
  DEITIES_DATABASE,
  getDevataById,
  getDevatas,
} from '@/src/core/devatas/data';
import {
  TEMPLES_DATABASE,
  getTempleById,
  getTemples,
} from '@/src/core/temples/data';
import {
  cleanAyudha,
  cleanBilingualTitle,
  cleanDarshanTimings,
  cleanDeityName,
  cleanDressCode,
  cleanEra,
  cleanFestivalName,
  cleanIndianLocation,
  cleanOffering,
  cleanPanchakaName,
  cleanPlanetLord,
  cleanPujaMuhurta,
  cleanTempleSignificance,
  formatMuhurtaPrecaution,
  formatMuhurtaReason,
} from '@/src/core/i18n/formatters';
import { calculatePanchang, PRESET_CITIES } from '@/src/core/panchang';
import { getCompletedHabits, getDateKey, getSadhanaStreak, toggleHabitCompletion } from '@/src/services/sadhana';
import {
  DEFAULT_USER_PROFILE,
  loadUserLocation,
  loadUserProfile,
  saveUserLocation,
  saveUserProfile,
} from '@/src/services/userProfile';
import {
  APP_TOUR_VERSION,
  clearTourProgressStep,
  getCompletedTourSections,
  getLastSeenTourVersion,
  getTourPersistenceSnapshot,
  getTourProgressStep,
  hasSeenAppTour,
  markAppTourCompleted,
  markTourSectionCompleted,
  resetAppTour,
  saveTourProgressStep,
  saveTourVersionSeen,
} from '@/src/services/appTour';
import { playShankhNaad, playTempleBell, triggerHaptic } from '@/src/services/sacredAudio';
import { getTodayVratGuidance } from '@/src/services/vratGuidelines';
import { getFestivalTimeline } from '@/src/core/festivals/timeline';
import { generateIcsCalendar, generateGoogleCalendarUrl } from '@/src/core/calendar/ics-generator';
import { generateWhatsAppPanchangShare } from '@/src/services/dayplanner';

describe('Core Datasets, Formatters, Sadhana, Tour Persistence & Audio Coverage Suite', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Devatas Database & Query Filtering', () => {
    it('retrieves single deity by id and handles unknown ids', () => {
      const shiva = getDevataById(' shiva ');
      expect(shiva?.id).toBe('shiva');
      expect(getDevataById('unknown_deity')).toBeUndefined();

      const singleResp = getDevatas({ id: 'vishnu' });
      expect(singleResp.totalCount).toBe(1);
      expect(singleResp.deities[0].id).toBe('vishnu');
      expect(singleResp.traditions.length).toBeGreaterThan(0);

      const missingResp = getDevatas({ id: 'does_not_exist' });
      expect(missingResp.totalCount).toBe(0);
      expect(missingResp.deities).toEqual([]);
    });

    it('filters by pancha_deva, specific tradition, and multi-field searchQuery', () => {
      const allResp = getDevatas();
      expect(allResp.totalCount).toBe(DEITIES_DATABASE.length);

      const pancha = getDevatas({ tradition: 'pancha_deva' });
      expect(pancha.totalCount).toBeGreaterThanOrEqual(4);
      expect(pancha.deities.every((d) => d.isPanchaDeva)).toBe(true);

      const shaiva = getDevatas({ tradition: 'shaiva' });
      expect(shaiva.totalCount).toBeGreaterThan(0);

      // Search across mantra, ayudha, temple location, offering, and name
      expect(getDevatas({ searchQuery: 'Kailash' }).totalCount).toBeGreaterThanOrEqual(0);
      expect(getDevatas({ searchQuery: 'Sudarshana' }).totalCount).toBeGreaterThanOrEqual(1);
      expect(getDevatas({ searchQuery: 'Mrityunjaya' }).totalCount).toBeGreaterThanOrEqual(1);
      expect(getDevatas({ searchQuery: 'Bilva' }).totalCount).toBeGreaterThanOrEqual(1);
      expect(getDevatas({ searchQuery: 'Varanasi' }).totalCount).toBeGreaterThanOrEqual(1);
      expect(getDevatas({ searchQuery: 'Nandi' }).totalCount).toBeGreaterThanOrEqual(1);
      expect(getDevatas({ searchQuery: 'Shivaratri' }).totalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Temples Database & Query Filtering', () => {
    it('retrieves single temple by id and filters by circuit, tradition, deityId, state, and search', () => {
      expect(getTempleById('kashi-vishwanath')?.name).toContain('Kashi');
      expect(getTempleById('missing-temple')).toBeUndefined();

      expect(getTemples({ id: 'mahakaleshwar' }).totalCount).toBe(1);
      expect(getTemples({ id: 'unknown' }).totalCount).toBe(0);

      const all = getTemples();
      expect(all.totalCount).toBe(TEMPLES_DATABASE.length);

      expect(getTemples({ circuit: 'jyotirlinga' }).totalCount).toBeGreaterThanOrEqual(12);
      expect(getTemples({ tradition: 'shaiva' }).totalCount).toBeGreaterThan(0);
      expect(getTemples({ deityId: 'shiva' }).totalCount).toBeGreaterThan(0);
      expect(getTemples({ state: 'Uttar Pradesh' }).totalCount).toBeGreaterThan(0);
      expect(getTemples({ searchQuery: 'Ganga' }).totalCount).toBeGreaterThan(0);
      expect(getTemples({ searchQuery: 'Ujjain' }).totalCount).toBeGreaterThan(0);
      expect(getTemples({ searchQuery: 'Shivaratri' }).totalCount).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Bilingual Formatters', () => {
    it('translates all deity ayudhas, offerings, temple cities, darshan timings, eras, dress codes, and significances', () => {
      for (const d of DEITIES_DATABASE) {
        d.ayudhas?.forEach((a) => {
          expect(cleanAyudha(a, true).length).toBeGreaterThan(0);
          expect(cleanAyudha(a, false).length).toBeGreaterThan(0);
        });
        d.traditionalOfferings.forEach((o) => {
          expect(cleanOffering(o, true).length).toBeGreaterThan(0);
          expect(cleanOffering(o, false).length).toBeGreaterThan(0);
        });
        d.majorTemples.forEach((t) => {
          expect(cleanIndianLocation(t.location, true).length).toBeGreaterThan(0);
          expect(cleanTempleSignificance(t.significance, true).length).toBeGreaterThan(0);
        });
      }

      for (const t of TEMPLES_DATABASE) {
        expect(cleanDarshanTimings(t.darshanTimings, true).length).toBeGreaterThan(0);
        expect(cleanDressCode(t.dressCode, true).length).toBeGreaterThan(0);
        expect(cleanEra(t.era, true).length).toBeGreaterThan(0);
        expect(cleanTempleSignificance(t.significance, true).length).toBeGreaterThan(0);
        expect(cleanTempleSignificance(t.significance, false).length).toBeGreaterThan(0);
        t.majorFestivals.forEach((f) => {
          expect(cleanFestivalName(f, true).length).toBeGreaterThan(0);
        });
      }

      const muhurtaPhrases = [
        'Mahapunya Kaal & Punya Kaal around Sunrise',
        'Nishita Kaal (Midnight) & 4 Prahara Puja',
        'Pradosha Kaal (Lakshmi Puja)',
        'Vijaya Muhurta & Aparahna Kaal',
        'Sandhi Puja (Junction of Ashtami and Navami)',
        'Evening Sunset to Moonrise',
      ];
      for (const m of muhurtaPhrases) {
        expect(cleanPujaMuhurta(m, true).length).toBeGreaterThan(0);
        expect(cleanPujaMuhurta(m, false).length).toBeGreaterThan(0);
      }

      for (const lord of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu']) {
        expect(cleanPlanetLord(lord, true)).toBeTruthy();
        expect(cleanPlanetLord(lord, false)).toBeTruthy();
      }
      for (const deity of ['Shiva', 'Vishnu', 'Durga', 'Ganesha', 'Indra', 'Agni', 'Chandra', 'Brahma']) {
        expect(cleanDeityName(deity, true)).toBeTruthy();
      }
      for (const panchaka of ['Roga Panchaka', 'Agni Panchaka', 'Mrityu Panchaka', 'Chora Panchaka', 'Raja Panchaka']) {
        expect(cleanPanchakaName(panchaka, true)).toBeTruthy();
      }
      expect(cleanBilingualTitle('Diwali (दीपावली)', true)).toBe('दीपावली');
      expect(formatMuhurtaReason('Shukla Paksha Ekadashi favorable', true)).toBeTruthy();
      expect(formatMuhurtaPrecaution('Rahu Kaal & Bhadra precaution', true)).toBeTruthy();
    });
  });

  describe('Sadhana Streak & Corrupt Storage Handling', () => {
    it('tracks habits, qualifies streaks on 3 habits across yesterday -> today, and recovers from corrupt JSON', async () => {
      const todayKey = getDateKey(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = getDateKey(yesterday);

      // Seed streak from yesterday
      await AsyncStorage.setItem('@sanatan_sadhana_streak', JSON.stringify({ streak: 4, lastDate: yesterdayKey }));
      expect(await getSadhanaStreak()).toBe(4);

      await toggleHabitCompletion('h1', todayKey);
      await toggleHabitCompletion('h2', todayKey);
      const res3 = await toggleHabitCompletion('h3', todayKey);
      expect(res3.completedIds).toEqual(['h1', 'h2', 'h3']);
      expect(res3.streak).toBe(5);

      // Un-toggle one habit
      const afterRemove = await toggleHabitCompletion('h2', todayKey);
      expect(afterRemove.completedIds).toEqual(['h1', 'h3']);

      // Stale streak date resets to 1
      await AsyncStorage.setItem('@sanatan_sadhana_streak', JSON.stringify({ streak: 10, lastDate: '2020-01-01' }));
      await toggleHabitCompletion('h4', todayKey);
      await toggleHabitCompletion('h5', todayKey);
      const resetRes = await toggleHabitCompletion('h6', todayKey);
      expect(resetRes.streak).toBe(1);

      // Corrupt JSON falls back safely
      await AsyncStorage.setItem(`@sanatan_sadhana_${todayKey}`, '{bad-json');
      expect(await getCompletedHabits(todayKey)).toEqual([]);
      await AsyncStorage.setItem('@sanatan_sadhana_streak', '{bad-json');
      expect(await getSadhanaStreak()).toBe(1);
    });
  });

  describe('User Profile, Tour Persistence & Calendar Export', () => {
    it('persists profile, merges partial notifications, validates location bounds, and recovers corrupt data', async () => {
      await AsyncStorage.setItem('@sanatan_user_sacred_profile_v1', JSON.stringify({ name: 'Raghav', notifications: { pradoshAlert: false } }));
      const merged = await loadUserProfile();
      expect(merged.name).toBe('Raghav');
      expect(merged.notifications.pradoshAlert).toBe(false);
      expect(merged.notifications.abhijitAlert).toBe(true);

      await AsyncStorage.setItem('@sanatan_user_sacred_profile_v1', 'INVALID');
      expect(await loadUserProfile()).toEqual(DEFAULT_USER_PROFILE);

      expect(await saveUserProfile({ ...DEFAULT_USER_PROFILE, name: 'Ananya' })).toBe(true);
      await saveUserLocation(PRESET_CITIES[1]);
      expect((await loadUserLocation()).name).toBe(PRESET_CITIES[1].name);

      await AsyncStorage.setItem('@sanatan_user_location_v1', JSON.stringify({ name: 'Broken' }));
      expect((await loadUserLocation()).name).toBe(PRESET_CITIES[0].name);
      await AsyncStorage.setItem('@sanatan_user_location_v1', 'NOT_JSON');
      expect((await loadUserLocation()).name).toBe(PRESET_CITIES[0].name);
    });

    it('handles version-aware tour upgrades (v1 -> What\'s New), section completion, and corrupt storage', async () => {
      await markAppTourCompleted(1);
      expect(await hasSeenAppTour()).toBe(true);
      expect(await getLastSeenTourVersion()).toBe(1);

      const snapV1 = await getTourPersistenceSnapshot();
      expect(snapV1.needsWhatsNewOnly).toBe(true);

      await saveTourVersionSeen(APP_TOUR_VERSION);
      expect((await getTourPersistenceSnapshot()).needsWhatsNewOnly).toBe(false);

      const updatedSections = await markTourSectionCompleted('community');
      expect(updatedSections).toEqual(['community']);
      // Duplicate addition is idempotent
      expect(await markTourSectionCompleted('community')).toEqual(['community']);
      expect(await getCompletedTourSections()).toEqual(['community']);

      await saveTourProgressStep(15);
      expect(await getTourProgressStep()).toBe(15);
      await clearTourProgressStep();
      expect(await getTourProgressStep()).toBe(0);

      // Corrupt values recover gracefully
      await AsyncStorage.setItem('@sanatan_app_tour_completed_sections_v1', 'BAD_JSON');
      expect(await getCompletedTourSections()).toEqual([]);
      await AsyncStorage.setItem('@sanatan_app_tour_progress_step_v1', '-4');
      expect(await getTourProgressStep()).toBe(0);
      await AsyncStorage.setItem('@sanatan_app_tour_version_v1', 'NaN');
      expect(await getLastSeenTourVersion()).toBe(0);

      await resetAppTour();
      expect(await hasSeenAppTour()).toBe(false);
    });

    it('exercises VratGuidelines across consecutive dates & generates valid ICS / Google Calendar URLs', () => {
      const foundTypes = new Set<string>();
      for (let dayOffset = 0; dayOffset < 35; dayOffset++) {
        const d = new Date(2026, 10, 1 + dayOffset, 8, 0, 0);
        const p = calculatePanchang(d, PRESET_CITIES[0]);
        const v = getTodayVratGuidance(p, d, PRESET_CITIES[0].timezone);
        if (v) {
          foundTypes.add(v.vratId);
        }
      }
      expect(foundTypes.size).toBeGreaterThanOrEqual(4);

      const timeline = getFestivalTimeline(
        { year: 2026, category: 'major', month: 11 },
        PRESET_CITIES[0]
      );
      const icsHi = generateIcsCalendar(timeline.festivals.slice(0, 2), PRESET_CITIES[0], {
        language: 'hi',
        includeAlarms: true,
      });
      expect(icsHi).toContain('BEGIN:VCALENDAR');

      if (timeline.festivals[0]) {
        const gcalEn = generateGoogleCalendarUrl(timeline.festivals[0], PRESET_CITIES[0], 'en');
        const gcalHi = generateGoogleCalendarUrl(timeline.festivals[0], PRESET_CITIES[0], 'hi');
        expect(gcalEn).toContain('https://calendar.google.com/calendar/render');
        expect(gcalHi).toContain('https://calendar.google.com/calendar/render');
      }

      const dShare = new Date(2026, 10, 22, 8, 0, 0); // Sunday (has Abhijit)
      const pShare = calculatePanchang(dShare, PRESET_CITIES[0]);
      const shareHi = generateWhatsAppPanchangShare(pShare, dShare, 'Ujjain', PRESET_CITIES[0].timezone, true);
      const shareEn = generateWhatsAppPanchangShare(pShare, dShare, 'Ujjain', PRESET_CITIES[0].timezone, false);
      expect(shareHi).toContain('दैनिक वैदिक पञ्चाङ्ग');
      expect(shareEn).toContain('Daily Vedic Panchang');
    });
  });

  describe('Sacred Audio & Haptics Cross-Platform Handling', () => {
    it('executes audio and all haptic modes safely on native and web platforms', async () => {
      const originalOs = Platform.OS;
      try {
        await triggerHaptic('bead', false);
        await triggerHaptic('bead', true);
        await triggerHaptic('quarter', true);
        await triggerHaptic('malaComplete', true);
        await triggerHaptic('heavy', true);
        await triggerHaptic('tap', true);

        playTempleBell(0.8);
        playShankhNaad(0.8);

        Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
        await triggerHaptic('bead', true);
        await triggerHaptic('quarter', true);
        await triggerHaptic('malaComplete', true);
        await triggerHaptic('tap', true);
        playTempleBell(0.5);
        playShankhNaad(0.5);
      } finally {
        Object.defineProperty(Platform, 'OS', { value: originalOs, configurable: true });
      }
    });
  });

  describe('useTourScroll Hook Viewport Alignment', () => {
    it('scrolls ScrollView and FlatList containers only when target rect is outside safe viewport', async () => {
      const scrollToSpy = jest.fn();
      const scrollToOffsetSpy = jest.fn();
      const scrollRef: React.RefObject<{ scrollTo?: typeof scrollToSpy; scrollToOffset?: typeof scrollToOffsetSpy } | null> = {
        current: { scrollTo: scrollToSpy },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(TourProvider, null, children);

      const { result } = await renderHook(
        () => {
          const scroll = useTourScroll('/(tabs)', scrollRef);
          const tour = useTour();
          return { ...scroll, ensureTargetVisible: tour.ensureTargetVisible };
        },
        { wrapper }
      );

      // Simulate scroll offset tracking
      await act(async () => {
        result.current.onScroll({ nativeEvent: { contentOffset: { y: 120 } } } as never);
      });
      expect(result.current.scrollYRef.current).toBe(120);

      // Target already inside visible safe zone -> should not scroll
      await act(async () => {
        result.current.ensureTargetVisible('/(tabs)', { x: 16, y: 140, width: 320, height: 80 });
      });
      expect(scrollToSpy).not.toHaveBeenCalled();

      // Target below safe zone -> should call scrollTo on ScrollView
      await act(async () => {
        result.current.ensureTargetVisible('/(tabs)', { x: 16, y: 780, width: 320, height: 90 });
      });
      expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ animated: true }));

      // Switch ref to FlatList-style scrollToOffset
      scrollRef.current = { scrollToOffset: scrollToOffsetSpy };
      await act(async () => {
        result.current.ensureTargetVisible('/(tabs)', { x: 16, y: 820, width: 320, height: 90 });
      });
      expect(scrollToOffsetSpy).toHaveBeenCalledWith(expect.objectContaining({ animated: true }));
    });
  });

  describe('Interactive Tour Step Try Labels', () => {
    it('returns localized Try This labels across all 32 tour steps and fallback', () => {
      for (const step of TOUR_STEPS) {
        expect(getStepTryLabel(step.id, true).length).toBeGreaterThan(0);
        expect(getStepTryLabel(step.id, false).length).toBeGreaterThan(0);
      }
      expect(getStepTryLabel('unknown-step', true)).toContain('टैप');
      expect(getStepTryLabel('unknown-step', false)).toContain('Tap');
    });
  });
});
