import {
  FESTIVAL_METADATA_MAP,
  getFestivalTimeline,
  RITU_DATA,
} from '../src/core/festivals';
import { generateIcsCalendar } from '../src/core/calendar/ics-generator';
import { calculateUpcomingFestivals } from '../src/core/panchang/festivals';
import { PRESET_CITIES } from '../src/core/panchang';

describe('Festivals, Vrats & iCalendar Engine Tests', () => {
  const ujjain = PRESET_CITIES[0];

  describe('Festival Metadata Knowledge Base', () => {
    it('should have extensive metadata for major Hindu festivals', () => {
      const keys = Object.keys(FESTIVAL_METADATA_MAP);
      expect(keys.length).toBeGreaterThanOrEqual(10);

      // Verify known festivals in metadata map
      const foundMakar = Object.keys(FESTIVAL_METADATA_MAP).find((k) => k.includes('Makar Sankranti'));
      expect(foundMakar).toBeDefined();

      if (foundMakar) {
        const meta = FESTIVAL_METADATA_MAP[foundMakar];
        expect(meta.nameDevanagari).toBeDefined();
        expect(meta.deity).toBeDefined();
        expect(meta.significance).toBeDefined();
        expect(meta.rituals.length).toBeGreaterThan(0);
      }
    });

    it('should provide authentic 6 Ritus mapped across the year', () => {
      expect(Object.keys(RITU_DATA).length).toBe(12);
      expect(RITU_DATA[0].nameDevanagari).toContain('वसन्त');
    });
  });

  describe('Festival Timeline & Upcoming Vrats', () => {
    it('should calculate upcoming festivals for a 30-day window', () => {
      const startDate = new Date('2026-11-10T00:00:00Z');
      const upcoming = calculateUpcomingFestivals(startDate, ujjain, 30);

      expect(Array.isArray(upcoming)).toBe(true);
      expect(upcoming.length).toBeGreaterThan(0);

      for (const item of upcoming) {
        expect(item.date).toBeInstanceOf(Date);
        expect(item.daysRemaining).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(item.festivals)).toBe(true);
        for (const fest of item.festivals) {
          expect(typeof fest.name).toBe('string');
          expect(typeof fest.nameDevanagari).toBe('string');
        }
      }
    });

    it('should generate timeline items with category filtering', () => {
      const timeline = getFestivalTimeline({ year: 2026, category: 'all' }, ujjain);

      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline.festivals)).toBe(true);
      expect(timeline.totalCount).toBe(timeline.festivals.length);
    });
  });

  describe('RFC 5545 iCalendar (.ics) Generator', () => {
    it('should generate standard compliant iCalendar formatted string', () => {
      const timeline = getFestivalTimeline({ year: 2026, category: 'all' }, ujjain);
      const icsString = generateIcsCalendar(timeline.festivals.slice(0, 3), ujjain, {
        title: 'Sanatan Hindu Calendar',
        language: 'hi',
      });

      expect(typeof icsString).toBe('string');
      expect(icsString).toContain('BEGIN:VCALENDAR');
      expect(icsString).toContain('VERSION:2.0');
      expect(icsString).toContain('PRODID:-//sanatan.cc//Vedic Ephemeris & Festivals//EN');
      expect(icsString).toContain('END:VCALENDAR');
    });
  });
});
