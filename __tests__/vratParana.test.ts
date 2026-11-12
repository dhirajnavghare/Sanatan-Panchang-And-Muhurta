import { calculateEkadashiParana } from '../src/services/vratParana';
import { calculatePanchang, PRESET_CITIES } from '../src/core/panchang';

describe('Vrat Parana & Ekadashi Fast-Breaking Calculator', () => {
  const ujjain = PRESET_CITIES[0];

  it('should return null when date is not Ekadashi or Dwadashi', () => {
    // 2026-11-10 is Shukla Pratipada / Dwitiya
    const panchang = calculatePanchang(new Date('2026-11-10T12:00:00Z'), ujjain);
    const parana = calculateEkadashiParana(panchang, ujjain, new Date('2026-11-10T12:00:00Z'));
    expect(parana).toBeNull();
  });

  it('should calculate valid Parana window on Ekadashi', () => {
    // Mock an Ekadashi tithi panchang
    const basePanchang = calculatePanchang(new Date('2026-11-20T12:00:00Z'), ujjain);
    const ekadashiPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          index: 11,
          pakshaIndex: 11,
          paksha: 'Shukla' as const,
          pakshaDevanagari: 'शुक्ल',
          name: 'Ekadashi',
          nameDevanagari: 'एकादशी',
        },
      },
    };

    const parana = calculateEkadashiParana(ekadashiPanchang, ujjain, new Date('2026-11-20T12:00:00Z'));
    expect(parana).not.toBeNull();
    if (parana) {
      expect(parana.isEkadashi).toBe(true);
      expect(parana.isDwadashi).toBe(false);
      expect(parana.startTime).toBeInstanceOf(Date);
      expect(parana.endTime).toBeInstanceOf(Date);
      expect(parana.endTime.getTime()).toBeGreaterThan(parana.startTime.getTime());
      expect(typeof parana.startTimeFormatted).toBe('string');
      expect(typeof parana.endTimeFormatted).toBe('string');
      expect(parana.guidanceHi).toContain('द्वादशी');
    }
  });

  it('should calculate valid Parana window on Dwadashi', () => {
    const basePanchang = calculatePanchang(new Date('2026-11-21T12:00:00Z'), ujjain);
    const dwadashiPanchang = {
      ...basePanchang,
      tithi: {
        ...basePanchang.tithi,
        current: {
          ...basePanchang.tithi.current,
          index: 12,
          pakshaIndex: 12,
          paksha: 'Shukla' as const,
          pakshaDevanagari: 'शुक्ल',
          name: 'Dwadashi',
          nameDevanagari: 'द्वादशी',
        },
      },
    };

    const parana = calculateEkadashiParana(dwadashiPanchang, ujjain, new Date('2026-11-21T12:00:00Z'));
    expect(parana).not.toBeNull();
    if (parana) {
      expect(parana.isEkadashi).toBe(false);
      expect(parana.isDwadashi).toBe(true);
      expect(parana.startTime).toBeInstanceOf(Date);
      expect(parana.endTime).toBeInstanceOf(Date);
      expect(parana.endTime.getTime()).toBeGreaterThan(parana.startTime.getTime());
      expect(parana.guidanceHi).toContain('आज');
    }
  });
});
