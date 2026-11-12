import { ALL_RASHIS, getDailyRashiOutlook } from '../src/services/rashiBhavishya';

describe('Daily Satvik Rashi & Gochara Service', () => {
  it('should define all 12 Rashis with authentic Vedic attributes', () => {
    expect(ALL_RASHIS.length).toBe(12);
    expect(ALL_RASHIS[0].nameHi).toBe('मेष');
    expect(ALL_RASHIS[0].symbol).toBe('♈');
    expect(ALL_RASHIS[11].nameHi).toBe('मीन');
    expect(ALL_RASHIS[11].symbol).toBe('♓');

    ALL_RASHIS.forEach((r) => {
      expect(r.lordHi).toBeTruthy();
      expect(r.luckyColorHi).toBeTruthy();
      expect(r.luckyNumber).toBeGreaterThan(0);
      expect(r.ishtadevHi).toBeTruthy();
      expect(r.seedMantra).toBeTruthy();
    });
  });

  it('should calculate 1st house transit when Moon is in the natal sign', () => {
    // Mesha = 0, Moon in Mesha = 0 -> 1st house
    const outlook = getDailyRashiOutlook(0, 0, new Date('2026-11-20T12:00:00Z'));
    expect(outlook.transitHouse).toBe(1);
    expect(outlook.houseTitleHi).toContain('चन्द्र आपकी ही राशि में');
    expect(outlook.energyLevelHi).toContain('95%');
  });

  it('should calculate 11th house transit (Supreme Gains) accurately', () => {
    // Mesha = 0, Moon in Kumbha = 10 -> 11th house
    const outlook = getDailyRashiOutlook(0, 10, new Date('2026-11-20T12:00:00Z'));
    expect(outlook.transitHouse).toBe(11);
    expect(outlook.houseTitleHi).toContain('एकादश भाव');
    expect(outlook.energyLevelHi).toContain('98%');
  });

  it('should provide actionable daily Satvik Upay based on weekday lord', () => {
    // Sunday = 0 -> Surya Upay
    const sunday = new Date('2026-11-15T12:00:00Z'); // Nov 15 2026 is Sunday
    const outlook = getDailyRashiOutlook(0, 0, sunday);
    expect(outlook.satvikActionHi).toContain('भगवान सूर्य');

    // Tuesday = 2 -> Hanuman Upay
    const tuesday = new Date('2026-11-17T12:00:00Z'); // Nov 17 2026 is Tuesday
    const outlookTuesday = getDailyRashiOutlook(0, 0, tuesday);
    expect(outlookTuesday.satvikActionHi).toContain('हनुमान');
  });
});
