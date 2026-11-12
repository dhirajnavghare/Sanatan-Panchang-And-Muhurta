import { PanchangData, GeoLocation, calculatePanchang } from '@/src/core/panchang';

export interface VratParanaDetails {
  isEkadashi: boolean;
  isDwadashi: boolean;
  paranaDate: Date;
  startTime: Date;
  endTime: Date;
  startTimeFormatted: string;
  endTimeFormatted: string;
  hariVasaraEndTime?: Date;
  dwadashiEndTime?: Date;
  guidanceHi: string;
  guidanceEn: string;
  vratNameHi: string;
  vratNameEn: string;
}

/**
 * Calculates Shastric Ekadashi Parana (fast breaking) time window.
 * 
 * Rules per Padma Purana & Hari Bhakti Vilasa:
 * 1. Parana must be performed after Sunrise on Dwadashi.
 * 2. Parana must NOT be done during Hari Vasara (first 1/4th of Dwadashi duration).
 * 3. Parana must be done before Dwadashi tithi ends, if Dwadashi ends before noon.
 * 4. If Dwadashi lasts past noon, Parana must be done during Pratah-Kala (morning window).
 */
export function calculateEkadashiParana(
  panchang: PanchangData,
  location: GeoLocation,
  referenceDate: Date = new Date()
): VratParanaDetails | null {
  try {
    const currentTithiIndex = panchang.tithi.current.pakshaIndex; // 1 to 15
    const isTodayEkadashi = currentTithiIndex === 11;
    const isTodayDwadashi = currentTithiIndex === 12;

    if (!isTodayEkadashi && !isTodayDwadashi) {
      return null;
    }

    // If today is Ekadashi, Parana will take place tomorrow (Dwadashi)
    // If today is Dwadashi, Parana takes place today
    const targetDate = isTodayEkadashi
      ? new Date(referenceDate.getTime() + 24 * 3600 * 1000)
      : new Date(referenceDate);

    // Calculate Panchang for the Dwadashi day
    const dwadashiPanchang = isTodayDwadashi
      ? panchang
      : calculatePanchang(targetDate, location);

    const sunrise = new Date(dwadashiPanchang.sunTimes.sunrise);
    const sunset = new Date(dwadashiPanchang.sunTimes.sunset);
    const dayLengthMs = sunset.getTime() - sunrise.getTime();

    // Hari Vasara is the first 1/4 of Dwadashi tithi.
    // If Dwadashi started earlier or around sunrise, calculate Hari Vasara boundary:
    const dwadashiEndTime = dwadashiPanchang.tithi.endTime
      ? new Date(dwadashiPanchang.tithi.endTime)
      : new Date(sunrise.getTime() + 8 * 3600 * 1000);

    // Approximate Hari Vasara end time (if Dwadashi tithi is active at sunrise):
    let hariVasaraEnd = new Date(sunrise.getTime());
    if (dwadashiPanchang.tithi.current.pakshaIndex === 12) {
      // If Dwadashi is ongoing, estimate Hari Vasara ending approximately 2 to 3 hours after sunrise
      // or at 1/4th duration of the tithi:
      const approxTithiDurationMs = 24 * 3600 * 1000;
      const quarterDurationMs = approxTithiDurationMs / 4;
      const estimatedStartMs = dwadashiEndTime.getTime() - approxTithiDurationMs;
      const estimatedHariVasaraEndMs = estimatedStartMs + quarterDurationMs;
      if (estimatedHariVasaraEndMs > sunrise.getTime()) {
        hariVasaraEnd = new Date(estimatedHariVasaraEndMs);
      }
    }

    // Parana Start: whichever is later between Sunrise and Hari Vasara End
    const paranaStart = new Date(Math.max(sunrise.getTime(), hariVasaraEnd.getTime()));

    // Parana End:
    // Pratah-Kala window ends approximately 1/5th into the day (around 8:30 - 9:00 AM)
    const pratahKalaEnd = new Date(sunrise.getTime() + (dayLengthMs / 5));

    // If Dwadashi ends before noon, Parana must be done before Dwadashi ends
    let paranaEnd: Date;
    if (dwadashiEndTime.getTime() < sunrise.getTime() + (dayLengthMs / 2)) {
      paranaEnd = dwadashiEndTime;
    } else {
      paranaEnd = pratahKalaEnd;
    }

    // Ensure paranaEnd is strictly after paranaStart (at least 90 minutes window)
    if (paranaEnd.getTime() <= paranaStart.getTime() + 45 * 60 * 1000) {
      paranaEnd = new Date(paranaStart.getTime() + 90 * 60 * 1000);
    }

    const formatT = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const vratNameHi = `${panchang.tithi.current.pakshaDevanagari} एकादशी`;
    const vratNameEn = `${panchang.tithi.current.paksha} Ekadashi`;

    const guidanceHi = isTodayEkadashi
      ? `कल द्वादशी को सूर्योदय (${formatT(sunrise)}) के पश्चात् एवं हरि वासर समाप्त होने पर पारण करें।`
      : `आज सूर्योदय (${formatT(sunrise)}) के बाद शुभ मुहूर्त में एकादशी व्रत का पारण करें।`;

    const guidanceEn = isTodayEkadashi
      ? `Break fast tomorrow on Dwadashi after Sunrise (${formatT(sunrise)}) and completion of Hari Vasara.`
      : `Break fast today after Sunrise (${formatT(sunrise)}) during the auspicious Dwadashi window.`;

    return {
      isEkadashi: isTodayEkadashi,
      isDwadashi: isTodayDwadashi,
      paranaDate: targetDate,
      startTime: paranaStart,
      endTime: paranaEnd,
      startTimeFormatted: formatT(paranaStart),
      endTimeFormatted: formatT(paranaEnd),
      hariVasaraEndTime: hariVasaraEnd,
      dwadashiEndTime,
      guidanceHi,
      guidanceEn,
      vratNameHi,
      vratNameEn,
    };
  } catch {
    return null;
  }
}
