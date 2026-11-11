import {
  MUHURTA_CATEGORIES,
  detectSpecialYogas,
  getPanchakaType,
  evaluateCategoryRules,
  findMuhurtas,
} from '../src/core/muhurta-finder';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('Muhurta Finder Engine - Shastric Auspicious Timing Tests', () => {
  const ujjain = PRESET_CITIES[0];

  describe('Category Registry Integrity', () => {
    it('should provide comprehensive metadata for all life ceremonies', () => {
      expect(MUHURTA_CATEGORIES.length).toBeGreaterThanOrEqual(6);

      for (const cat of MUHURTA_CATEGORIES) {
        expect(cat.id).toBeDefined();
        expect(cat.title).toBeDefined();
        expect(cat.titleDevanagari).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(cat.description).toBeDefined();
        expect(cat.traditionalReference).toBeDefined();
      }
    });
  });

  describe('Special Auspicious Yogas & Panchaka Determinations', () => {
    it('should detect Sarvartha Siddhi Yoga on valid Weekday + Nakshatra combinations', () => {
      // Sunday (0) + Hasta (12)
      const yogas = detectSpecialYogas(0, 12, 1);
      expect(Array.isArray(yogas)).toBe(true);
      expect(yogas.some((y) => y.includes('Sarvartha Siddhi'))).toBe(true);
    });

    it('should detect Ravi Pushya Yoga on Sunday + Pushya nakshatra', () => {
      // Sunday (0) + Pushya (7)
      const yogas = detectSpecialYogas(0, 7, 1);
      expect(yogas.some((y) => y.includes('Ravi Pushya') || y.includes('Pushya'))).toBe(true);
    });

    it('should detect Guru Pushya Yoga on Thursday + Pushya nakshatra', () => {
      // Thursday (4) + Pushya (7)
      const yogas = detectSpecialYogas(4, 7, 1);
      expect(yogas.some((y) => y.includes('Guru Pushya') || y.includes('Pushya'))).toBe(true);
    });

    it('should evaluate Panchaka correctly based on lunar position', () => {
      // Test nakshatras in Dhanishta to Revati range (last 5 nakshatras: 22 to 26)
      const panchakaResult = getPanchakaType(23, 1, 1); // Shatabhisha
      expect(['Rog', 'Agni', 'Raj', 'Chora', 'Mrityu', 'None']).toContain(panchakaResult);
    });
  });

  describe('Range Evaluator and Rule Scoring', () => {
    it('should evaluate category rules and return a bounded score [0, 100]', () => {
      const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);
      const evaluation = evaluateCategoryRules('griha_pravesh', panchang, ['Sarvartha Siddhi Yoga'], 'None');
      expect(evaluation.score).toBeGreaterThanOrEqual(0);
      expect(evaluation.score).toBeLessThanOrEqual(100);
      expect(['Optimal', 'Good', 'Average', 'Inauspicious']).toContain(evaluation.suitability);
    });

    it('should find favorable Muhurta windows in a 30-day range without errors', () => {
      const startDate = new Date('2026-11-10T00:00:00Z');

      const results = findMuhurtas(
        { category: 'vehicle_purchase', daysCount: 30, minimumSuitability: 'All' },
        ujjain,
        startDate
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(30);
      for (const res of results) {
        expect(res.date).toBeInstanceOf(Date);
        expect(res.score).toBeGreaterThanOrEqual(0);
        expect(res.score).toBeLessThanOrEqual(100);
      }
    });
  });
});

