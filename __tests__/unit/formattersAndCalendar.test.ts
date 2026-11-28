import {
  cleanPlanetLord,
  cleanDeityName,
  cleanChoghadiyaQuality,
  cleanPaksha,
  cleanBilingualTitle,
  cleanPanchakaName,
  formatMuhurtaReason,
  formatMuhurtaPrecaution,
  cleanFestivalName,
  cleanAyudha,
  cleanOffering,
  cleanIndianLocation,
  cleanEra,
  cleanDressCode,
  cleanDarshanTimings,
  cleanPujaMuhurta,
  cleanTempleSignificance,
} from '../../src/core/i18n/formatters';
import {
  generateIcsCalendar,
  generateGoogleCalendarUrl,
} from '../../src/core/calendar/ics-generator';
import { getAyanamsa } from '../../src/core/panchang/ayanamsa';
import {
  getAllPrayers,
  getPrayerBySlug,
  filterPrayers,
  getPrayerOfTheDay,
} from '../../src/core/prayers/query';
import { evaluateCategoryRules } from '../../src/core/muhurta-finder/rules';
import { MUHURTA_CATEGORIES } from '../../src/core/muhurta-finder/categories';
import { calculatePanchang, PRESET_CITIES, toJulianDay } from '../../src/core/panchang';
import { getFestivalTimeline } from '../../src/core/festivals/timeline';
import { TOUR_STEPS } from '../../src/constants/tourSteps';
import { getStepSpotlightRect } from '../../src/utils/tourSpotlight';
import { displayProfileName, getAppTheme, MIN_TOUCH_TARGET } from '../../src/utils/theme';

describe('Formatters, Calendar ICS, Ayanamsa, Prayers Query, Rules & Theme Unit Tests', () => {
  const ujjain = PRESET_CITIES[0];

  describe('Bilingual Formatters (i18n/formatters.ts)', () => {
    it('handles null, undefined, and empty inputs gracefully across all formatters', () => {
      const fns = [
        cleanPlanetLord,
        cleanDeityName,
        cleanChoghadiyaQuality,
        cleanPaksha,
        cleanBilingualTitle,
        cleanPanchakaName,
        formatMuhurtaReason,
        formatMuhurtaPrecaution,
        cleanFestivalName,
        cleanAyudha,
        cleanOffering,
        cleanIndianLocation,
        cleanEra,
        cleanDressCode,
        cleanDarshanTimings,
        cleanPujaMuhurta,
        cleanTempleSignificance,
      ];

      for (const fn of fns) {
        expect(typeof fn(null, true)).toBe('string');
        expect(typeof fn(undefined, false)).toBe('string');
        expect(typeof fn('', true)).toBe('string');
      }
    });

    it('formats Vedic terms accurately in Hindi and English', () => {
      expect(cleanPlanetLord('Sun', true)).not.toBe('');
      expect(cleanPlanetLord('Sun', false)).not.toBe('');
      expect(cleanPlanetLord('Jupiter', true)).not.toBe('');
      expect(cleanDeityName('Shiva', true)).not.toBe('');
      expect(cleanDeityName('Vishnu', false)).not.toBe('');
      expect(cleanChoghadiyaQuality('Amrit', true)).not.toBe('');
      expect(cleanChoghadiyaQuality('Shubh', false)).not.toBe('');
      expect(cleanPaksha('Shukla', true)).toContain('शुक्ल');
      expect(cleanPaksha('Krishna', false)).toContain('Krishna');
      expect(cleanBilingualTitle('Shubh Muhurta (शुभ मुहूर्त)', true)).toContain('शुभ मुहूर्त');
      expect(cleanBilingualTitle('Shubh Muhurta (शुभ मुहूर्त)', false)).toContain('Shubh Muhurta');
      expect(cleanPanchakaName('Agni Panchaka', true)).not.toBe('');
      expect(cleanPanchakaName('Roga Panchaka', false)).not.toBe('');
      expect(formatMuhurtaReason('Purnima Tithi auspicious', true)).not.toBe('');
      expect(formatMuhurtaReason('Purnima Tithi auspicious', false)).toContain('Purnima');
      expect(formatMuhurtaPrecaution('Rahu Kaal active', true)).not.toBe('');
      expect(formatMuhurtaPrecaution('Vishti Karana', false)).toContain('Vishti');
      expect(cleanFestivalName('Maha Shivaratri', true)).not.toBe('');
      expect(cleanAyudha('Trishula', true)).not.toBe('');
      expect(cleanOffering('Bilva Patra', true)).not.toBe('');
      expect(cleanIndianLocation('Varanasi, Uttar Pradesh', true)).not.toBe('');
      expect(cleanEra('Treta Yuga', true)).not.toBe('');
      expect(cleanDressCode('Traditional', true)).not.toBe('');
      expect(cleanDarshanTimings('04:00 AM - 11:00 PM', true)).not.toBe('');
      expect(cleanPujaMuhurta('06:30 PM - 08:15 PM', true)).not.toBe('');
      expect(cleanTempleSignificance('One of the 12 sacred Jyotirlingas of Lord Shiva.', true)).not.toBe('');
    });
  });

  describe('ICS Calendar Generator & Google Calendar Links', () => {
    const timeline = getFestivalTimeline({ year: 2026, category: 'major' }, ujjain);

    it('generates RFC 5545 valid VCALENDAR with alarms in English and Hindi', () => {
      const sample = timeline.festivals.slice(0, 3);
      expect(sample.length).toBeGreaterThan(0);

      const icsEn = generateIcsCalendar(sample, ujjain, { language: 'en', includeAlarms: true });
      expect(icsEn).toContain('BEGIN:VCALENDAR');
      expect(icsEn).toContain('BEGIN:VEVENT');
      expect(icsEn).toContain('BEGIN:VALARM');
      expect(icsEn).toContain('END:VCALENDAR');

      const icsHi = generateIcsCalendar(sample, ujjain, { language: 'hi', includeAlarms: false });
      expect(icsHi).toContain('सनातन व्रत एवं उत्सव');
      expect(icsHi).not.toContain('BEGIN:VALARM');
    });

    it('builds valid Google Calendar URLs for Hindi and English festivals', () => {
      const first = timeline.festivals[0];
      const urlEn = generateGoogleCalendarUrl(first, ujjain, 'en');
      const urlHi = generateGoogleCalendarUrl(first, ujjain, 'hi');

      expect(urlEn).toContain('https://calendar.google.com/calendar/render?');
      expect(urlEn).toContain('action=TEMPLATE');
      expect(urlHi).toContain('https://calendar.google.com/calendar/render?');
    });
  });

  describe('Ayanamsa Systems & Prayers Query Engine', () => {
    it('computes expected ayanamsa values across all supported systems', () => {
      const jd = toJulianDay(new Date('2026-01-01T12:00:00Z'));
      const lahiri = getAyanamsa(jd, 'Lahiri');
      const kp = getAyanamsa(jd, 'KP');
      const raman = getAyanamsa(jd, 'Raman');
      const chitra = getAyanamsa(jd, 'TrueChitra');
      const sayana = getAyanamsa(jd, 'Sayana');

      expect(lahiri).toBeGreaterThan(24);
      expect(kp).toBeLessThan(lahiri);
      expect(raman).toBeLessThan(lahiri);
      expect(chitra).toBeGreaterThan(20);
      expect(sayana).toBe(0);
    });

    it('queries, filters, and resolves daily prayers cleanly', () => {
      const all = getAllPrayers();
      expect(all.length).toBeGreaterThan(5);

      const first = getPrayerBySlug(all[0].slug);
      expect(first?.id).toBe(all[0].id);
      expect(getPrayerBySlug('nonexistent-prayer-xyz')).toBeUndefined();

      const filtered = filterPrayers({ searchQuery: 'Hanuman' });
      expect(filtered.total).toBeGreaterThan(0);
      expect(filtered.prayers.length).toBeGreaterThan(0);

      for (let d = 0; d <= 6; d++) {
        const daily = getPrayerOfTheDay(d);
        expect(daily.id).toBeTruthy();
        expect(daily.verses.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Muhurta Category Rules Evaluation', () => {
    it('evaluates every Muhurta category cleanly within 0-100 score range', () => {
      const panchang = calculatePanchang(new Date('2026-05-14T12:00:00Z'), ujjain);
      for (const cat of MUHURTA_CATEGORIES) {
        const res = evaluateCategoryRules(cat.id, panchang, ['Sarvartha Siddhi Yoga'], 'None');
        expect(res.score).toBeGreaterThanOrEqual(0);
        expect(res.score).toBeLessThanOrEqual(100);
        expect(['Optimal', 'Good', 'Avoid']).toContain(res.suitability);
        expect(Array.isArray(res.reasons)).toBe(true);
        expect(Array.isArray(res.precautions)).toBe(true);
      }
    });
  });

  describe('Theme Helpers & Spotlight Fallbacks', () => {
    it('resolves light and dark theme tokens and deduplicates profile names', () => {
      const light = getAppTheme(false);
      const dark = getAppTheme(true);
      expect(light.bg).not.toBe(dark.bg);
      expect(light.text).not.toBe(dark.text);
      expect(MIN_TOUCH_TARGET).toBe(44);

      expect(displayProfileName('साधक', true)).toBe('साधक');
      expect(displayProfileName('Sadhak', false)).toBe('Sadhak');
      expect(displayProfileName('', false)).toBe('Sadhak');
      expect(displayProfileName('Dhiraj', false)).toBe('Dhiraj');
    });

    it('computes valid bounded fallback and measured spotlight rectangles for all 32 tour steps', () => {
      for (const step of TOUR_STEPS) {
        const fallback = getStepSpotlightRect(step, {}, 390, 844, {
          top: 44,
          bottom: 34,
          left: 0,
          right: 0,
        });
        expect(fallback.width).toBeGreaterThan(0);
        expect(fallback.height).toBeGreaterThan(0);
        expect(fallback.x).toBeGreaterThanOrEqual(0);
        expect(fallback.y).toBeGreaterThanOrEqual(0);
      }

      const firstStep = TOUR_STEPS[0];
      const measuredKey = firstStep.targetTestID || firstStep.id;
      const customRect = { x: 25, y: 120, width: 300, height: 60, borderRadius: 12 };
      const live = getStepSpotlightRect(firstStep, { [measuredKey]: customRect }, 390, 844);
      expect(live).toEqual(customRect);
    });
  });
});
