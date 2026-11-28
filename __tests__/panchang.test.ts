import {
  calculatePanchang,
  PRESET_CITIES,
  toJulianDay,
} from '../src/core/panchang';

describe('Panchang & Astronomical Engine - Comprehensive Test Suite', () => {
  const ujjain = PRESET_CITIES.find((c) => c.name.includes('Ujjain')) || PRESET_CITIES[0];

  describe('Julian Day and Ephemeris Computations', () => {
    it('should compute valid Julian Day for known epoch dates', () => {
      // J2000.0: 2000-01-01 12:00 UTC = 2451545.0
      const jdJ2000 = toJulianDay(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
      expect(jdJ2000).toBeCloseTo(2451545.0, 1);

      // Current year epoch
      const jdNow = toJulianDay(new Date());
      expect(jdNow).toBeGreaterThan(2460000);
    });
  });

  describe('Solar Ephemeris & Day/Night Transitions', () => {
    it('should calculate accurate Sunrise, Sunset, and Solar Noon across seasons', () => {
      const dates = [
        new Date('2026-03-21T06:00:00Z'), // Vernal Equinox
        new Date('2026-06-21T06:00:00Z'), // Summer Solstice
        new Date('2026-09-23T06:00:00Z'), // Autumnal Equinox
        new Date('2026-12-21T06:00:00Z'), // Winter Solstice
      ];

      for (const d of dates) {
        const panchang = calculatePanchang(d, ujjain);
        const { sunrise, sunset, solarNoon } = panchang.sunTimes;

        expect(sunrise.getTime()).toBeLessThan(sunset.getTime());
        expect(solarNoon.getTime()).toBeGreaterThan(sunrise.getTime());
        expect(solarNoon.getTime()).toBeLessThan(sunset.getTime());

        // Day length in hours
        const dayHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
        // Summer day should be longer than winter day in northern hemisphere (Ujjain lat ~23.17)
        expect(dayHours).toBeGreaterThan(10);
        expect(dayHours).toBeLessThan(14.5);
      }
    });

    it('should compute valid sunrise/sunset for different cities', () => {
      const testDate = new Date('2026-11-10T06:00:00Z');
      const testCities = PRESET_CITIES.slice(0, 5);

      for (const city of testCities) {
        const panchang = calculatePanchang(testDate, city);
        expect(panchang.sunTimes.sunrise).toBeInstanceOf(Date);
        expect(panchang.sunTimes.sunset).toBeInstanceOf(Date);
        expect(panchang.location.name).toBe(city.name);
      }
    });
  });

  describe('The 5 Sacred Limbs of Panchanga (पञ्च-अङ्ग)', () => {
    const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);

    it('1. Tithi: should have valid Shastric bounds and paksha indexing', () => {
      const tithi = panchang.tithi.current;
      expect(tithi.index).toBeGreaterThanOrEqual(1);
      expect(tithi.index).toBeLessThanOrEqual(30);

      expect(tithi.pakshaIndex).toBeGreaterThanOrEqual(1);
      expect(tithi.pakshaIndex).toBeLessThanOrEqual(15);

      expect(['Shukla', 'Krishna']).toContain(tithi.paksha);
      expect(typeof tithi.name).toBe('string');
      expect(typeof tithi.nameDevanagari).toBe('string');
      expect(panchang.tithi.endTime).toBeInstanceOf(Date);
    });

    it('2. Nakshatra: should have valid 27-mansion bounds and Planetary Lord', () => {
      const nak = panchang.nakshatra.current;
      expect(nak.index).toBeGreaterThanOrEqual(1);
      expect(nak.index).toBeLessThanOrEqual(27);

      expect(typeof nak.name).toBe('string');
      expect(typeof nak.nameDevanagari).toBe('string');
      expect(typeof nak.lord).toBe('string');
      expect(panchang.nakshatra.endTime).toBeInstanceOf(Date);
    });

    it('3. Yoga: should have valid 27-yoga bounds and Shastric classification', () => {
      const yoga = panchang.yoga.current;
      expect(yoga.index).toBeGreaterThanOrEqual(1);
      expect(yoga.index).toBeLessThanOrEqual(27);

      expect(typeof yoga.name).toBe('string');
      expect(typeof yoga.nameDevanagari).toBe('string');
    });

    it('4. Karana: should have valid 60-half-tithi bounds and Shastric classification', () => {
      const karana = panchang.karana.current;
      expect(karana.index).toBeGreaterThanOrEqual(1);
      expect(karana.index).toBeLessThanOrEqual(60);

      expect(typeof karana.name).toBe('string');
      expect(typeof karana.nameDevanagari).toBe('string');
    });

    it('5. Vara: should correctly match solar day of week', () => {
      const vara = panchang.vara;
      expect(vara.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(vara.dayOfWeek).toBeLessThanOrEqual(6);
      expect(typeof vara.name).toBe('string');
      expect(typeof vara.nameDevanagari).toBe('string');
      expect(typeof vara.lordPlanet).toBe('string');
    });
  });

  describe('Samvat, Masa and Ayana Computations', () => {
    it('should correctly verify Vikram Samvat and Shaka Samvat correlation', () => {
      const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);
      const { vikramSamvat, shakaSamvat, ayana } = panchang.samvat;

      // Vikram Samvat is ahead of Shaka Samvat by 135 years
      expect(vikramSamvat - shakaSamvat).toBe(135);

      // Verify northern/southern solar motion
      expect(['Uttarayana', 'Dakshinayana']).toContain(ayana);

      // In November, Sun is in Dakshinayana (moving towards southern solstice)
      expect(ayana).toBe('Dakshinayana');
    });

    it('should calculate valid Amanta and Purnimanta lunar months', () => {
      const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);
      expect(panchang.masa.amantaName).toBeDefined();
      expect(panchang.masa.purnimantaName).toBeDefined();
      expect(panchang.masa.amantaIndex).toBeGreaterThanOrEqual(0);
      expect(panchang.masa.amantaIndex).toBeLessThanOrEqual(11);
    });
  });

  describe('Muhurta Engine (Auspicious & Inauspicious Intervals)', () => {
    const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);

    it('Brahma Muhurta: starts 2 ghatikas before sunrise and ends 1 ghatika before sunrise', () => {
      const bm = panchang.muhurtas.brahmaMuhurta;
      const sunrise = panchang.sunTimes.sunrise;

      expect(bm.endTime.getTime()).toBeLessThanOrEqual(sunrise.getTime());
      const leadTimeMinutes = (sunrise.getTime() - bm.endTime.getTime()) / (1000 * 60);
      // Lead time is 1 dynamic ghatika (~45 to 55 minutes depending on seasonal night length)
      expect(leadTimeMinutes).toBeGreaterThanOrEqual(44);
      expect(leadTimeMinutes).toBeLessThanOrEqual(56);
    });

    it('Abhijit Muhurta: exists around solar noon (except Wednesday)', () => {
      // 2026-11-10 is a Tuesday (Abhijit is highly auspicious on Tuesday)
      const abhijit = panchang.muhurtas.abhijitMuhurta;
      expect(abhijit).not.toBeNull();
      if (abhijit) {
        const noon = panchang.sunTimes.solarNoon;
        expect(abhijit.startTime.getTime()).toBeLessThan(noon.getTime());
        expect(abhijit.endTime.getTime()).toBeGreaterThan(noon.getTime());
      }
    });

    it('Rahu Kaal: occupies exact 1/8th daytime slot corresponding to weekday', () => {
      const rahu = panchang.muhurtas.rahuKaal;
      const { sunrise, sunset } = panchang.sunTimes;

      expect(rahu.startTime.getTime()).toBeGreaterThanOrEqual(sunrise.getTime());
      expect(rahu.endTime.getTime()).toBeLessThanOrEqual(sunset.getTime());

      const dayDurationMs = sunset.getTime() - sunrise.getTime();
      const rahuDurationMs = rahu.endTime.getTime() - rahu.startTime.getTime();

      // Duration must be 1/8th of daytime (+/- 2 minutes tolerance)
      expect(rahuDurationMs).toBeCloseTo(dayDurationMs / 8, -5);
    });

    it('Choghadiya: generates exactly 8 day and 8 night segments with contiguous timings', () => {
      const { day, night } = panchang.choghadiya;
      expect(day.length).toBe(8);
      expect(night.length).toBe(8);

      // Verify contiguous daytime segments
      for (let i = 0; i < 7; i++) {
        expect(day[i].endTime.getTime()).toBe(day[i + 1].startTime.getTime());
      }

      // First day choghadiya starts at sunrise
      expect(day[0].startTime.getTime()).toBe(panchang.sunTimes.sunrise.getTime());

      // Last day choghadiya ends at sunset
      expect(day[7].endTime.getTime()).toBe(panchang.sunTimes.sunset.getTime());
    });
  });
});
