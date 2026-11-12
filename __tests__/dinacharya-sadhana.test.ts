import {
  WEEKDAY_DEVATAS,
  SACRED_DAILY_VERSES,
  generateDailySankalpa,
  getCurrentSpiritualPeriod,
} from '../src/services/dinacharya';
import {
  DAILY_SADHANA_HABITS,
  getCompletedHabits,
  toggleHabitCompletion,
  getSadhanaStreak,
  getDateKey,
} from '../src/services/sadhana';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('Dinacharya, Daily Sankalpa & Sadhana Habits Tests', () => {
  const ujjain = PRESET_CITIES[0];
  const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);

  describe('Personalized Vedic Sankalpa Generator', () => {
    it('should dynamically weave Gotra and Devotee Name into Sanskrit Sankalpa text', () => {
      const gotra = 'कश्यप';
      const name = 'रामशर्मा';
      const sankalpa = generateDailySankalpa(panchang, 'उज्जैन', name, gotra);

      expect(sankalpa.sanskrit).toContain(gotra);
      expect(sankalpa.sanskrit).toContain(name);
      expect(sankalpa.hindi).toContain(gotra);
      expect(sankalpa.hindi).toContain(name);
      expect(sankalpa.english).toContain(gotra);
      expect(sankalpa.english).toContain(name);
    });

    it('should use sacred devotional fallbacks when Name or Gotra is omitted', () => {
      const sankalpa = generateDailySankalpa(panchang, 'वाराणसी');

      expect(sankalpa.sanskrit).toContain('मम आत्मनः');
      expect(sankalpa.sanskrit).toContain('सङ्कल्पम् अहं करिष्ये');
      expect(sankalpa.hindi).toBeDefined();
      expect(sankalpa.english).toBeDefined();
    });

    it('should embed astronomical parameters (Samvat, Masa, Paksha, Tithi) in the Sankalpa', () => {
      const sankalpa = generateDailySankalpa(panchang, 'उज्जैन');
      expect(sankalpa.sanskrit).toContain(panchang.samvat.vikramSamvat.toString());
      expect(sankalpa.sanskrit).toContain(panchang.tithi.current.nameDevanagari);
    });
  });

  describe('Weekday Devatas (वार अधिष्ठाता)', () => {
    it('should provide authentic devata and mantra for all 7 solar days', () => {
      const days = [0, 1, 2, 3, 4, 5, 6];
      const expectedDeities = [
        'Surya',
        'Shiva',
        'Hanuman',
        'Ganesha',
        'Vishnu',
        'Lakshmi',
        'Shani',
      ];

      for (const day of days) {
        const dev = WEEKDAY_DEVATAS[day];
        expect(dev).toBeDefined();
        expect(dev.deityName).toContain(expectedDeities[day]);
        expect(dev.mantra).toBeDefined();
        expect(dev.mantraDevanagari).toBeDefined();
        expect(dev.bgPastel).toBeDefined();
      }
    });
  });

  describe('Spiritual Periods of the Day (दिनचर्या काल)', () => {
    it('should accurately resolve spiritual periods based on time of day', () => {
      // 5:00 AM - Brahma / Pratah
      const morningTime = new Date('2026-11-10T05:00:00');
      const morningPeriod = getCurrentSpiritualPeriod(morningTime);
      expect(morningPeriod.periodKey).toBe('brahma');
      expect(morningPeriod.greetingHi).toBeDefined();

      // 12:00 PM - Madhyahna
      const noonTime = new Date('2026-11-10T12:00:00');
      const noonPeriod = getCurrentSpiritualPeriod(noonTime);
      expect(noonPeriod.periodKey).toBe('madhyahna');

      // 11:00 PM - Ratri
      const nightTime = new Date('2026-11-10T23:00:00');
      const nightPeriod = getCurrentSpiritualPeriod(nightTime);
      expect(nightPeriod.periodKey).toBe('ratri');
    });
  });

  describe('Daily Sadhana Micro-Habits & Streaks', () => {
    it('should maintain 5 essential Shastric habits', () => {
      expect(DAILY_SADHANA_HABITS.length).toBe(5);
      const habitIds = DAILY_SADHANA_HABITS.map((h) => h.id);
      expect(habitIds).toContain('brahma_smaran');
      expect(habitIds).toContain('surya_arghya');
      expect(habitIds).toContain('deity_puja');
      expect(habitIds).toContain('satvik_karma');
      expect(habitIds).toContain('sayam_sandhya');
    });

    it('should toggle habit completion and persist to storage', async () => {
      const dateKey = getDateKey(new Date());
      const habitId = 'surya_arghya';

      const initialDone = await getCompletedHabits(dateKey);
      const wasDone = initialDone.includes(habitId);

      const res = await toggleHabitCompletion(habitId, dateKey);
      expect(res.completedIds.includes(habitId)).toBe(!wasDone);
    });

    it('should compute valid sadhana streaks', async () => {
      const streak = await getSadhanaStreak();
      expect(streak).toBeGreaterThanOrEqual(0);
    });
  });
});
