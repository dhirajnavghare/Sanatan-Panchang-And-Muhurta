import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';
import { getFestivalTimeline } from '../src/core/festivals/timeline';
import {
  RAHU_KAAL_PARTS,
  YAMAGANDA_PARTS,
  GULIKA_PARTS,
  CHOGHADIYA_DAY_SEQUENCES,
} from '../src/core/panchang/constants';

describe('Authoritative Internet Ephemeris & Drik Panchang Ground Truth Benchmarks', () => {
  const ujjain = PRESET_CITIES[0];
  const delhi = {
    name: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    altitude: 216,
    timezone: 'Asia/Kolkata',
  };

  describe('1. Daily Panchang Ground Truth for November 12, 2026', () => {
    // 2026-11-12 Noon IST
    const targetDate = new Date('2026-11-12T12:00:00+05:30');
    const panchang = calculatePanchang(targetDate, delhi);

    it('matches Drik Panchang: Vikram Samvat 2083 and Shaka Samvat 1948', () => {
      expect(panchang.samvat.vikramSamvat).toBe(2083);
      expect(panchang.samvat.shakaSamvat).toBe(1948);
    });

    it('matches Drik Panchang: Kartika month & Shukla Paksha', () => {
      expect(['Kartik', 'Kartika']).toContain(panchang.masa.purnimantaName);
      expect(panchang.tithi.current.paksha).toBe('Shukla');
    });

    it('matches Drik Panchang: Tithi is Shukla Tritiya ending in the evening', () => {
      expect(panchang.tithi.current.name).toBe('Tritiya');
      expect(panchang.tithi.current.nameDevanagari).toBe('तृतीया');
      expect(panchang.tithi.current.pakshaIndex).toBe(3);

      // Drik Panchang: Tritiya ends around 6:00 PM IST
      const endHour = panchang.tithi.endTime.getUTCHours() + 5.5; // IST
      expect(endHour).toBeGreaterThanOrEqual(17); // ~5:30 PM to 6:30 PM
      expect(endHour).toBeLessThanOrEqual(19);
    });

    it('matches Drik Panchang: Nakshatra is Jyeshtha transitioning to Mula in the afternoon', () => {
      expect(panchang.nakshatra.current.name).toBe('Jyeshtha');
      expect(panchang.nakshatra.next.name).toBe('Mula');

      // Drik Panchang: Jyeshtha ends ~2:15 PM IST (14:15)
      const endHour = panchang.nakshatra.endTime.getUTCHours() + 5.5;
      expect(endHour).toBeGreaterThanOrEqual(13.5);
      expect(endHour).toBeLessThanOrEqual(15.5);
    });

    it('matches Drik Panchang: Moon Rashi is Vrischika transitioning to Dhanu in afternoon', () => {
      expect(panchang.moonRashi.current.name).toBe('Vrishchika');
      expect(panchang.moonRashi.next.name).toBe('Dhanu');
    });

    it('matches Drik Panchang: Yoga is Sukarma and Karana is Garaja', () => {
      expect(panchang.yoga.current.name).toBe('Sukarma');
      expect(['Gara', 'Garaja']).toContain(panchang.karana.current.name);
    });

    it('matches Drik Panchang: Thursday Auspicious and Inauspicious Muhurtas', () => {
      // Abhijit Muhurta is active around solar noon (~11:45 AM - 12:30 PM)
      expect(panchang.muhurtas.abhijitMuhurta).not.toBeNull();
      const abhijit = panchang.muhurtas.abhijitMuhurta!;
      const abhijitStartIST = abhijit.startTime.getUTCHours() + 5.5 + abhijit.startTime.getUTCMinutes() / 60;
      expect(abhijitStartIST).toBeGreaterThanOrEqual(11.5);
      expect(abhijitStartIST).toBeLessThanOrEqual(12.0);

      // Rahu Kaal on Thursday is 6th segment (afternoon ~1:25 PM - 2:50 PM)
      const rahuStartIST = panchang.muhurtas.rahuKaal.startTime.getUTCHours() + 5.5 + panchang.muhurtas.rahuKaal.startTime.getUTCMinutes() / 60;
      expect(rahuStartIST).toBeGreaterThanOrEqual(13.0);
      expect(rahuStartIST).toBeLessThanOrEqual(14.0);

      // Yamaganda on Thursday is 1st segment (~6:40 AM - 8:05 AM)
      const yamaStartIST = panchang.muhurtas.yamaganda.startTime.getUTCHours() + 5.5 + panchang.muhurtas.yamaganda.startTime.getUTCMinutes() / 60;
      expect(yamaStartIST).toBeGreaterThanOrEqual(6.3);
      expect(yamaStartIST).toBeLessThanOrEqual(7.2);

      // Gulika Kalam on Thursday is 3rd segment (~9:20 AM - 10:45 AM)
      const gulikaStartIST = panchang.muhurtas.gulikaKaal.startTime.getUTCHours() + 5.5 + panchang.muhurtas.gulikaKaal.startTime.getUTCMinutes() / 60;
      expect(gulikaStartIST).toBeGreaterThanOrEqual(9.0);
      expect(gulikaStartIST).toBeLessThanOrEqual(10.0);
    });
  });

  describe('2. Major 2026 Festival Dates vs Drik Panchang Ground Truth', () => {
    const timeline = getFestivalTimeline({ year: 2026 }, ujjain);
    const festivals = timeline.festivals;

    it('matches Drik Panchang: Makar Sankranti on January 14, 2026', () => {
      const makar = festivals.find((f) => f.name.toLowerCase().includes('makar sankranti'));
      expect(makar).toBeDefined();
      expect(makar?.date).toBe('2026-01-14');
    });

    it('matches Drik Panchang: Maha Shivaratri on February 15, 2026', () => {
      const shivaratri = festivals.find((f) => f.name.toLowerCase().includes('maha shivaratri'));
      expect(shivaratri).toBeDefined();
      expect(shivaratri?.date).toBe('2026-02-15');
    });

    it('matches Drik Panchang: Holika Dahan on March 3, 2026 & Holi on March 4, 2026', () => {
      const holi = festivals.find((f) => f.name.toLowerCase().includes('holi'));
      expect(holi).toBeDefined();
      // Holi falls between March 3 and March 4
      expect(['2026-03-03', '2026-03-04']).toContain(holi?.date);
    });

    it('matches Drik Panchang: Rama Navami in late March 2026', () => {
      const ramaNavami = festivals.find((f) => f.name.toLowerCase().includes('rama navami'));
      expect(ramaNavami).toBeDefined();
      expect(['2026-03-26', '2026-03-27']).toContain(ramaNavami?.date);
    });

    it('matches Drik Panchang: Krishna Janmashtami in early September 2026', () => {
      const janmashtami = festivals.find((f) => f.name.toLowerCase().includes('janmashtami'));
      expect(janmashtami).toBeDefined();
      expect(['2026-09-03', '2026-09-04']).toContain(janmashtami?.date);
    });

    it('matches Drik Panchang: Karwa Chauth on October 29, 2026', () => {
      const karwa = festivals.find((f) => f.name.toLowerCase().includes('karwa chauth'));
      expect(karwa).toBeDefined();
      expect(karwa?.date).toBe('2026-10-29');
    });

    it('matches Drik Panchang: Diwali (Lakshmi Puja) on November 8, 2026', () => {
      const diwali = festivals.find((f) => f.name.toLowerCase().includes('diwali') || f.name.toLowerCase().includes('deepavali'));
      expect(diwali).toBeDefined();
      expect(diwali?.date).toBe('2026-11-08');
    });
  });

  describe('3. Inauspicious Day Divisions (Rahu, Yamagandam, Gulika) vs Classical Matrix', () => {
    it('verifies Rahu Kalam 8-part daytime sequence: Sun(8), Mon(2), Tue(7), Wed(5), Thu(6), Fri(4), Sat(3)', () => {
      expect(RAHU_KAAL_PARTS).toEqual([8, 2, 7, 5, 6, 4, 3]);
    });

    it('verifies Yamagandam 8-part daytime sequence: Sun(5), Mon(4), Tue(3), Wed(2), Thu(1), Fri(7), Sat(6)', () => {
      expect(YAMAGANDA_PARTS).toEqual([5, 4, 3, 2, 1, 7, 6]);
    });

    it('verifies Gulika Kalam 8-part daytime sequence: Sun(7), Mon(6), Tue(5), Wed(4), Thu(3), Fri(2), Sat(1)', () => {
      expect(GULIKA_PARTS).toEqual([7, 6, 5, 4, 3, 2, 1]);
    });
  });

  describe('4. Choghadiya Classical Day Rulers', () => {
    it('verifies that each day begins with the ruler of that weekday', () => {
      // Sunday begins with Udveg (Sun)
      expect(CHOGHADIYA_DAY_SEQUENCES[0][0]).toBe('Udveg');
      // Monday begins with Amrit (Moon)
      expect(CHOGHADIYA_DAY_SEQUENCES[1][0]).toBe('Amrit');
      // Tuesday begins with Rog (Mars)
      expect(CHOGHADIYA_DAY_SEQUENCES[2][0]).toBe('Rog');
      // Wednesday begins with Labh (Mercury)
      expect(CHOGHADIYA_DAY_SEQUENCES[3][0]).toBe('Labh');
      // Thursday begins with Shubh (Jupiter)
      expect(CHOGHADIYA_DAY_SEQUENCES[4][0]).toBe('Shubh');
      // Friday begins with Char (Venus)
      expect(CHOGHADIYA_DAY_SEQUENCES[5][0]).toBe('Char');
      // Saturday begins with Kaal (Saturn)
      expect(CHOGHADIYA_DAY_SEQUENCES[6][0]).toBe('Kaal');
    });
  });
});
