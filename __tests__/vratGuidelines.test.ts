import { getTodayVratGuidance } from '../src/services/vratGuidelines';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('Vrat Guidelines & Fasting Assistant Service', () => {
  const ujjain = PRESET_CITIES[0];

  it('should detect Sankashti Chaturthi on Krishna Paksha 4th Tithi with Moonrise & Arghya Mantra', () => {
    const basePanchang = calculatePanchang(new Date('2026-11-20T12:00:00Z'), ujjain);
    const sankashtiPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          index: 18,
          pakshaIndex: 4,
          paksha: 'Krishna' as const,
          pakshaDevanagari: 'कृष्ण',
          name: 'Chaturthi',
          nameDevanagari: 'चतुर्थी',
        },
      },
      moonTimes: {
        ...basePanchang.moonTimes,
        moonrise: new Date('2026-11-20T21:18:00Z'),
      },
    };

    const vrat = getTodayVratGuidance(sankashtiPanchang, new Date('2026-11-20T15:00:00Z'), 'Asia/Kolkata');
    expect(vrat).not.toBeNull();
    expect(vrat?.vratId).toBe('sankashti');
    expect(vrat?.arghyaMantraSanskrit).toContain('क्षीरोदार्णव सम्भूत');
    expect(vrat?.permissibleFoodsHi).toContain('साबूदाना खिचड़ी/खीर');
    expect(vrat?.prohibitedFoodsHi.length).toBeGreaterThan(0);
    expect(vrat?.moonriseTime).toBeTruthy();
  });

  it('should detect Angarki Chaturthi when Krishna Chaturthi falls on Tuesday', () => {
    const basePanchang = calculatePanchang(new Date('2026-11-20T12:00:00Z'), ujjain);
    const sankashtiPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          pakshaIndex: 4,
          paksha: 'Krishna' as const,
        },
      },
    };

    // Tuesday = day 2
    const tuesdayDate = new Date('2026-11-17T12:00:00Z'); // Nov 17 2026 is Tuesday
    const vrat = getTodayVratGuidance(sankashtiPanchang, tuesdayDate, 'Asia/Kolkata');
    expect(vrat).not.toBeNull();
    expect(vrat?.titleHi).toContain('अङ्गारकी');
  });

  it('should detect Ekadashi Vrat with strict grain-prohibition rules and permissible foods', () => {
    const basePanchang = calculatePanchang(new Date('2026-11-20T12:00:00Z'), ujjain);
    const ekadashiPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          index: 10,
          pakshaIndex: 11,
          paksha: 'Shukla' as const,
          name: 'Ekadashi',
          nameDevanagari: 'एकादशी',
        },
      },
    };

    const vrat = getTodayVratGuidance(ekadashiPanchang, new Date('2026-11-20T12:00:00Z'), 'Asia/Kolkata');
    expect(vrat).not.toBeNull();
    expect(vrat?.vratId).toBe('ekadashi');
    expect(vrat?.prohibitedFoodsHi).toEqual(expect.arrayContaining([expect.stringContaining('चावल')]));
    expect(vrat?.permissibleFoodsHi).toEqual(expect.arrayContaining([expect.stringContaining('साबूदाना')]));
  });

  it('should detect Pradosha Vrat on Trayodashi (13th Tithi)', () => {
    const basePanchang = calculatePanchang(new Date('2026-11-20T12:00:00Z'), ujjain);
    const pradoshPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          index: 12,
          pakshaIndex: 13,
          name: 'Trayodashi',
          nameDevanagari: 'त्रयोदशी',
        },
      },
    };

    const vrat = getTodayVratGuidance(pradoshPanchang, new Date('2026-11-20T12:00:00Z'), 'Asia/Kolkata');
    expect(vrat).not.toBeNull();
    expect(vrat?.vratId).toBe('pradosh');
    expect(vrat?.deityHi).toContain('सदाशिव');
  });
});
