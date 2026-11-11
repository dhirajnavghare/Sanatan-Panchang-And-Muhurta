import AsyncStorage from '@react-native-async-storage/async-storage';
import { PanchangData } from '@/src/core/panchang/types';

export interface DayPlannerSlot {
  id: string; // unique key e.g. 'brahma_muhurta', 'choghadiya_day_0', 'abhijit_muhurta', 'rahu_kaal'
  title: string;
  titleHi: string;
  startTime: Date;
  endTime: Date;
  quality: 'Mahashubh' | 'Shubh' | 'Labh' | 'Amrit' | 'Char' | 'Ashubh' | 'Neutral';
  suitability: string;
  suitabilityHi: string;
  suggestedTasks: string[];
  suggestedTasksHi: string[];
  isCore?: boolean;
  isCurrent?: boolean;
}

export interface UserSlotPlan {
  taskText: string;
  isCompleted: boolean;
  updatedAt: number;
}

export type DayPlansMap = Record<string, UserSlotPlan>;

export interface LiveCosmicStatus {
  statusType: 'mahashubh' | 'shubh' | 'neutral' | 'caution';
  titleHi: string;
  titleEn: string;
  windowHi: string;
  windowEn: string;
  badgeHi: string;
  badgeEn: string;
  descriptionHi: string;
  descriptionEn: string;
  accentColor: string;
  badgeBg: string;
  startTime: Date;
  endTime: Date;
}

const STORAGE_PREFIX = '@sanatan_dayplan_';

export async function getDayPlans(dateKey: string): Promise<DayPlansMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveSlotPlan(
  dateKey: string,
  slotId: string,
  taskText: string,
  isCompleted: boolean = false
): Promise<DayPlansMap> {
  try {
    const current = await getDayPlans(dateKey);
    const trimmed = taskText.trim();
    if (!trimmed) {
      delete current[slotId];
    } else {
      current[slotId] = {
        taskText: trimmed,
        isCompleted,
        updatedAt: Date.now(),
      };
    }
    await AsyncStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(current));
    return current;
  } catch {
    return {};
  }
}

export async function toggleSlotCompletion(
  dateKey: string,
  slotId: string
): Promise<DayPlansMap> {
  try {
    const current = await getDayPlans(dateKey);
    if (current[slotId]) {
      current[slotId].isCompleted = !current[slotId].isCompleted;
      current[slotId].updatedAt = Date.now();
      await AsyncStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(current));
    }
    return current;
  } catch {
    return {};
  }
}

/**
 * Returns the live cosmic state for the current exact moment.
 * Instantly answers the user's primary daily question:
 * "Can I do my auspicious work right now?"
 */
export function getLiveCosmicStatus(
  panchang: PanchangData,
  now: Date = new Date(),
  timezone: string = 'Asia/Kolkata'
): LiveCosmicStatus {
  const nowMs = now.getTime();

  const formatShort = (d: Date | string): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(date);
    } catch {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // 1. Check Rahu Kaal (Top Priority Caution)
  if (panchang.muhurtas.rahuKaal) {
    const rkStart = new Date(panchang.muhurtas.rahuKaal.startTime);
    const rkEnd = new Date(panchang.muhurtas.rahuKaal.endTime);
    if (nowMs >= rkStart.getTime() && nowMs <= rkEnd.getTime()) {
      return {
        statusType: 'caution',
        titleHi: 'अभी राहु काल चल रहा है',
        titleEn: 'Rahu Kaal is Active Now',
        windowHi: `${formatShort(rkStart)} से ${formatShort(rkEnd)} तक`,
        windowEn: `${formatShort(rkStart)} - ${formatShort(rkEnd)}`,
        badgeHi: '⚠️ सावधानी काल',
        badgeEn: '⚠️ Caution Window',
        descriptionHi: 'नया कार्य, अनुबंध या यात्रा टालें • नियमित कर्म जारी रखें व शान्त रहें',
        descriptionEn: 'Avoid new ventures, contracts or travel • Continue routine chores',
        accentColor: '#dc2626',
        badgeBg: '#fee2e2',
        startTime: rkStart,
        endTime: rkEnd,
      };
    }
  }

  // 2. Check Abhijit Muhurta (Midday Supreme Victory Window)
  if (panchang.muhurtas.abhijitMuhurta) {
    const abStart = new Date(panchang.muhurtas.abhijitMuhurta.startTime);
    const abEnd = new Date(panchang.muhurtas.abhijitMuhurta.endTime);
    if (nowMs >= abStart.getTime() && nowMs <= abEnd.getTime()) {
      return {
        statusType: 'mahashubh',
        titleHi: 'अभी अभिजित मुहूर्त चल रहा है',
        titleEn: 'Abhijit Muhurta is Active Now',
        windowHi: `${formatShort(abStart)} से ${formatShort(abEnd)} तक`,
        windowEn: `${formatShort(abStart)} - ${formatShort(abEnd)}`,
        badgeHi: '🌟 महाशुभ विजय काल',
        badgeEn: '🌟 Supreme Victory Hour',
        descriptionHi: 'सर्वदोष नाशक विष्णु काल • समस्त शुभ कार्य, महत्वपूर्ण निर्णय व आरम्भ हेतु सर्वोत्तम',
        descriptionEn: 'Auspicious hour of Lord Vishnu • Supreme for vital launches & agreements',
        accentColor: '#16a34a',
        badgeBg: '#dcfce7',
        startTime: abStart,
        endTime: abEnd,
      };
    }
  }

  // 3. Check Brahma Muhurta (Dawn Ambrosial Hour)
  if (panchang.muhurtas.brahmaMuhurta) {
    const bmStart = new Date(panchang.muhurtas.brahmaMuhurta.startTime);
    const bmEnd = new Date(panchang.muhurtas.brahmaMuhurta.endTime);
    if (nowMs >= bmStart.getTime() && nowMs <= bmEnd.getTime()) {
      return {
        statusType: 'mahashubh',
        titleHi: 'अभी ब्रह्म मुहूर्त चल रहा है',
        titleEn: 'Brahma Muhurta is Active Now',
        windowHi: `${formatShort(bmStart)} से ${formatShort(bmEnd)} तक`,
        windowEn: `${formatShort(bmStart)} - ${formatShort(bmEnd)}`,
        badgeHi: '🕊️ अमृत वेला',
        badgeEn: '🕊️ Ambrosial Dawn',
        descriptionHi: 'सृष्टि की शुद्धतम सात्विक ऊर्जा • ध्यान, मन्त्र जप, प्राणायाम व अध्ययन हेतु परम उत्तम',
        descriptionEn: 'Purest spiritual vibration • Supreme for meditation, pranayama & study',
        accentColor: '#7c3aed',
        badgeBg: '#ede9fe',
        startTime: bmStart,
        endTime: bmEnd,
      };
    }
  }

  // 4. Check Active Choghadiya (Day or Night)
  const allChoghadiyas = [...panchang.choghadiya.day, ...panchang.choghadiya.night];
  const activeCh = allChoghadiyas.find((c) => {
    const s = new Date(c.startTime).getTime();
    const e = new Date(c.endTime).getTime();
    return nowMs >= s && nowMs <= e;
  }) || allChoghadiyas[0];

  if (activeCh) {
    const start = new Date(activeCh.startTime);
    const end = new Date(activeCh.endTime);
    const windowHi = `${formatShort(start)} से ${formatShort(end)} तक`;
    const windowEn = `${formatShort(start)} - ${formatShort(end)}`;

    switch (activeCh.quality) {
      case 'Amrit':
        return {
          statusType: 'mahashubh',
          titleHi: 'अभी अमृत चौघड़िया चल रहा है',
          titleEn: 'Amrit Choghadiya is Active',
          windowHi,
          windowEn,
          badgeHi: '✨ अमृत वेला',
          badgeEn: '✨ Nectar Hour',
          descriptionHi: 'सर्वश्रेष्ठ काल • व्यापार, खरीदारी, औषधि सेवन व समस्त शुभ कार्य आरम्भ करें',
          descriptionEn: 'Auspicious hour • Perfect for trade, new ventures, learning & medicine',
          accentColor: '#059669',
          badgeBg: '#d1fae5',
          startTime: start,
          endTime: end,
        };
      case 'Shubh':
        return {
          statusType: 'shubh',
          titleHi: 'अभी शुभ चौघड़िया चल रहा है',
          titleEn: 'Shubh Choghadiya is Active',
          windowHi,
          windowEn,
          badgeHi: '🌿 शुभ काल',
          badgeEn: '🌿 Auspicious Hour',
          descriptionHi: 'धार्मिक कार्य, महत्वपूर्ण बैठक, उत्सव व नवीन सम्बन्ध निर्माण हेतु अनुकूल',
          descriptionEn: 'Favorable for meetings, ceremonies, negotiations & spiritual tasks',
          accentColor: '#2563eb',
          badgeBg: '#dbeafe',
          startTime: start,
          endTime: end,
        };
      case 'Labh':
        return {
          statusType: 'shubh',
          titleHi: 'अभी लाभ चौघड़िया चल रहा है',
          titleEn: 'Labh Choghadiya is Active',
          windowHi,
          windowEn,
          badgeHi: '💎 लाभ काल',
          badgeEn: '💎 Profitable Hour',
          descriptionHi: 'व्यापार, वाणिज्य, निवेश, क्रय-विक्रय व आर्थिक लाभ के कार्यों हेतु श्रेष्ठ',
          descriptionEn: 'Favorable for business, investments, shopping & financial gains',
          accentColor: '#0891b2',
          badgeBg: '#cffafe',
          startTime: start,
          endTime: end,
        };
      case 'Char':
        return {
          statusType: 'neutral',
          titleHi: 'अभी चर चौघड़िया चल रहा है',
          titleEn: 'Char Choghadiya is Active',
          windowHi,
          windowEn,
          badgeHi: '🚗 चर गतिशीलता',
          badgeEn: '🚗 Dynamic Hour',
          descriptionHi: 'यात्रा, वाहन चालन, पत्राचार, संवाद व सामान्य गतिशीलता हेतु उत्तम',
          descriptionEn: 'Good for travel, transit, communication, phone calls & errands',
          accentColor: '#d97706',
          badgeBg: '#fef3c7',
          startTime: start,
          endTime: end,
        };
      default:
        // Rog, Kaal, Udveg
        return {
          statusType: 'caution',
          titleHi: `अभी ${activeCh.nameDevanagari} चौघड़िया चल रहा है`,
          titleEn: `${activeCh.name} Choghadiya is Active`,
          windowHi,
          windowEn,
          badgeHi: '⏳ धैर्य काल',
          badgeEn: '⏳ Routine Only',
          descriptionHi: 'नया कार्य या जोखिम भरा निर्णय टालें • नियमित नित्य कर्म व मौन चिंतन करें',
          descriptionEn: 'Avoid new risky projects • Continue routine work and prayer',
          accentColor: '#ea580c',
          badgeBg: '#ffedd5',
          startTime: start,
          endTime: end,
        };
    }
  }

  // Fallback
  return {
    statusType: 'shubh',
    titleHi: 'शुभ दिनचर्या काल',
    titleEn: 'Auspicious Daily Time',
    windowHi: 'नित्य कर्म',
    windowEn: 'Daily Routine',
    badgeHi: 'सत्कर्म',
    badgeEn: 'Routine',
    descriptionHi: 'ईश्वर स्मरण के साथ अपने नित्य कर्म सम्पन्न करें',
    descriptionEn: 'Carry out daily duties with mindful focus',
    accentColor: '#f59e0b',
    badgeBg: '#fef3c7',
    startTime: now,
    endTime: new Date(now.getTime() + 60 * 60 * 1000),
  };
}

/**
 * Builds chronological day planning slots from computed Panchang astronomical data.
 */
export function buildDayPlannerSlots(panchang: PanchangData, now: Date = new Date()): DayPlannerSlot[] {
  const slots: DayPlannerSlot[] = [];
  const nowMs = now.getTime();

  const isCurrentTime = (start: Date, end: Date) => {
    return nowMs >= start.getTime() && nowMs <= end.getTime();
  };

  // 1. Brahma Muhurta
  if (panchang.muhurtas.brahmaMuhurta) {
    const bm = panchang.muhurtas.brahmaMuhurta;
    slots.push({
      id: 'brahma_muhurta',
      title: 'Brahma Muhurta',
      titleHi: 'ब्रह्म मुहूर्त (अमृत वेला)',
      startTime: new Date(bm.startTime),
      endTime: new Date(bm.endTime),
      quality: 'Mahashubh',
      suitability: 'Supreme for meditation, pranayama, spiritual study, chanting, and high-clarity creative thinking.',
      suitabilityHi: 'ध्यान, प्राणायाम, मन्त्र जप, वेद-गीता स्वाध्याय एवं आत्म-चिंतन हेतु सर्वोत्तम समय।',
      suggestedTasks: ['Meditation & Japa', 'Gita Study', 'Morning Walk & Yoga'],
      suggestedTasksHi: ['ध्यान व मन्त्र जप', 'गीता स्वाध्याय', 'प्रातः योग व चिंतन'],
      isCore: true,
      isCurrent: isCurrentTime(new Date(bm.startTime), new Date(bm.endTime)),
    });
  }

  // 2. Pratah Sandhya & Sunrise
  if (panchang.sunTimes.sunrise) {
    const sunrise = new Date(panchang.sunTimes.sunrise);
    const sandhyaEnd = new Date(sunrise.getTime() + 60 * 60 * 1000); // 1 hr after sunrise
    slots.push({
      id: 'pratah_sandhya',
      title: 'Pratah Sandhya & Arghya',
      titleHi: 'प्रातः संध्या व सूर्य अर्घ्य',
      startTime: sunrise,
      endTime: sandhyaEnd,
      quality: 'Shubh',
      suitability: 'Offering Surya Arghya, Gayatri Mantra, home temple puja, setting positive intentions.',
      suitabilityHi: 'सूर्य अर्घ्य, गायत्री जप, मन्दिर पूजा, दीप प्रज्वलन एवं दिन के शुभ संकल्प हेतु उपयुक्त।',
      suggestedTasks: ['Surya Arghya', 'Daily Puja', 'Morning Affirmations'],
      suggestedTasksHi: ['सूर्य अर्घ्य व गायत्री', 'दैनिक पूजा व दीप', 'दैनिक संकल्प'],
      isCore: true,
      isCurrent: isCurrentTime(sunrise, sandhyaEnd),
    });
  }

  // 3. Day Choghadiyas (Amrit, Shubh, Labh, Char, Rog, Kaal, Udveg)
  panchang.choghadiya.day.forEach((ch, idx) => {
    const start = new Date(ch.startTime);
    const end = new Date(ch.endTime);
    let quality: DayPlannerSlot['quality'] = 'Neutral';
    let suitability = '';
    let suitabilityHi = '';
    let suggestedTasks: string[] = [];
    let suggestedTasksHi: string[] = [];
    let isCore = false;

    switch (ch.quality) {
      case 'Amrit':
        quality = 'Amrit';
        isCore = true;
        suitability = 'Nectar hours: All auspicious beginnings, education, medicine, spiritual rituals & signing.';
        suitabilityHi = 'अमृत वेला: समस्त शुभ कार्य आरम्भ, विद्या, औषधि सेवन, देव पूजन व महत्वपूर्ण निर्णय।';
        suggestedTasks = ['Start Key Work', 'Medical Intake', 'Important Learning'];
        suggestedTasksHi = ['महत्वपूर्ण कार्य आरम्भ', 'औषधि सेवन', 'विद्याभ्यास'];
        break;
      case 'Shubh':
        quality = 'Shubh';
        isCore = true;
        suitability = 'Auspicious: Religious ceremonies, meetings, partnerships, and relationship building.';
        suitabilityHi = 'शुभ समय: धार्मिक उत्सव, महत्वपूर्ण बैठक, नए सम्बन्ध निर्माण व कार्य सम्पादन।';
        suggestedTasks = ['Important Meeting', 'Social Engagements', 'Auspicious Plan'];
        suggestedTasksHi = ['महत्वपूर्ण बैठक', 'धार्मिक अनुष्ठान', 'नवीन कार्य योजना'];
        break;
      case 'Labh':
        quality = 'Labh';
        isCore = true;
        suitability = 'Profitable: Commerce, investments, sales, accounts, trades, and financial transactions.';
        suitabilityHi = 'लाभ काल: व्यापार, वाणिज्य, आर्थिक निवेश, क्रय-विक्रय व व्यावसायिक सौदों हेतु फलदायी।';
        suggestedTasks = ['Business Negotiations', 'Financial Trade', 'Purchases'];
        suggestedTasksHi = ['व्यापारिक वार्ता', 'आर्थिक लेन-देन', 'व्यापार विस्तार'];
        break;
      case 'Char':
        quality = 'Char';
        suitability = 'Movement: Travel, dynamic shifts, transport, deliveries, communication, and sports.';
        suitabilityHi = 'चर वेला: यात्रा, वाहन चालन, भ्रमण, संचार, सम्प्रेषण व गतिशीलता से जुड़े कार्य।';
        suggestedTasks = ['Travel / Commute', 'Outreach / Calls', 'Logistics'];
        suggestedTasksHi = ['यात्रा व भ्रमण', 'कॉल व पत्राचार', 'गतिशील कार्य'];
        break;
      case 'Rog':
      case 'Kaal':
      case 'Udveg':
        quality = 'Ashubh';
        suitability = 'Inauspicious: Prone to conflict or anxiety. Best for routine chores and quiet focus only.';
        suitabilityHi = 'विघ्नकारी समय: नया कार्य आरम्भ न करें। केवल नियमित दैनिक कार्य व मौन चिंतन करें।';
        suggestedTasks = ['Routine Tasks', 'Personal Rest', 'Japa & Peace'];
        suggestedTasksHi = ['नियमित सामान्य कार्य', 'विश्राम व मौन', 'मन्त्र जप'];
        break;
      default:
        quality = 'Neutral';
        suitability = 'General routine hours.';
        suitabilityHi = 'सामान्य नित्य कार्य।';
        suggestedTasks = ['Routine Work'];
        suggestedTasksHi = ['सामान्य कार्य'];
    }

    slots.push({
      id: `choghadiya_day_${idx}`,
      title: `${ch.name} (${ch.quality})`,
      titleHi: `${ch.nameDevanagari} चौघड़िया (${ch.quality === 'Amrit' ? 'अमृत' : ch.quality === 'Shubh' ? 'शुभ' : ch.quality === 'Labh' ? 'लाभ' : ch.quality === 'Char' ? 'चर' : 'सामान्य'})`,
      startTime: start,
      endTime: end,
      quality,
      suitability,
      suitabilityHi,
      suggestedTasks,
      suggestedTasksHi,
      isCore,
      isCurrent: isCurrentTime(start, end),
    });
  });

  // 4. Abhijit Muhurta (Midday Supreme Window)
  if (panchang.muhurtas.abhijitMuhurta) {
    const ab = panchang.muhurtas.abhijitMuhurta;
    const start = new Date(ab.startTime);
    const end = new Date(ab.endTime);
    slots.push({
      id: 'abhijit_muhurta',
      title: 'Abhijit Muhurta',
      titleHi: 'अभिजित मुहूर्त (महाशुभ विजय काल)',
      startTime: start,
      endTime: end,
      quality: 'Mahashubh',
      suitability: 'Supreme window ruled by Lord Vishnu. Destroys all doshas; ideal for vital launches, agreements & decisions.',
      suitabilityHi: 'भगवान विष्णु का परम प्रिय काल। समस्त दोषों का शमन; अति महत्वपूर्ण निर्णय, अनुबंध व विजय कार्य।',
      suggestedTasks: ['Decisive Decision', 'Sign Agreement', 'Major Launch'],
      suggestedTasksHi: ['निर्णायक निर्णय', 'अनुबंध हस्ताक्षर', 'प्रमुख कार्य शुभारम्भ'],
      isCore: true,
      isCurrent: isCurrentTime(start, end),
    });
  }

  // 5. Rahu Kaal (Caution Window)
  if (panchang.muhurtas.rahuKaal) {
    const rk = panchang.muhurtas.rahuKaal;
    const start = new Date(rk.startTime);
    const end = new Date(rk.endTime);
    slots.push({
      id: 'rahu_kaal',
      title: 'Rahu Kaal (Avoid Beginnings)',
      titleHi: 'राहु काल (सावधानी • आरम्भ वर्जित)',
      startTime: start,
      endTime: end,
      quality: 'Ashubh',
      suitability: 'Caution: Strictly avoid starting new ventures, signing contracts, travel, or financial speculation.',
      suitabilityHi: 'त्याज्य समय: नया उद्यम आरम्भ, धन निवेश, यात्रा या शुभ कार्य कदापि न करें। केवल विश्राम करें।',
      suggestedTasks: ['Rest & Meditation', 'Desk Cleanup', 'Internal Reflection'],
      suggestedTasksHi: ['विश्राम व शान्ति', 'दैनिक सामान्य कार्य', 'आत्म-निरीक्षण'],
      isCore: true,
      isCurrent: isCurrentTime(start, end),
    });
  }

  // 6. Vijaya Muhurta (Afternoon Success Window)
  if (panchang.muhurtas.vijayaMuhurta) {
    const vm = panchang.muhurtas.vijayaMuhurta;
    const start = new Date(vm.startTime);
    const end = new Date(vm.endTime);
    slots.push({
      id: 'vijaya_muhurta',
      title: 'Vijaya Muhurta',
      titleHi: 'विजय मुहूर्त (सफलता काल)',
      startTime: start,
      endTime: end,
      quality: 'Shubh',
      suitability: 'Bestows triumph: Highly effective for resolving disputes, competitive preparation, exams & tasks.',
      suitabilityHi: 'विजय प्रदायक: विवाद समाधान, कठिन चुनौतियों, परीक्षा तैयारी व साहसिक कार्य हेतु उपयुक्त।',
      suggestedTasks: ['Tackle Hard Task', 'Competitive Prep', 'Resolve Issues'],
      suggestedTasksHi: ['कठिन कार्य निष्पादन', 'अध्ययन व तैयारी', 'विवाद समाधान'],
      isCore: true,
      isCurrent: isCurrentTime(start, end),
    });
  }

  // 7. Godhuli & Sayam Sandhya
  if (panchang.sunTimes.sunset) {
    const sunset = new Date(panchang.sunTimes.sunset);
    const godhuliStart = new Date(sunset.getTime() - 24 * 60 * 1000); // 24 min before sunset
    const godhuliEnd = new Date(sunset.getTime() + 24 * 60 * 1000); // 24 min after sunset
    slots.push({
      id: 'godhuli_sandhya',
      title: 'Godhuli Vela & Evening Lamp',
      titleHi: 'गोधूलि वेला व सायं दीप (सन्ध्या काल)',
      startTime: godhuliStart,
      endTime: godhuliEnd,
      quality: 'Shubh',
      suitability: 'Sacred dusk: Lighting evening lamp at Tulsi/Altar, Aarti, Hanuman Chalisa, family togetherness.',
      suitabilityHi: 'गोधूलि वेला: तुलसी व मन्दिर में दीप प्रज्वलन, सायं आरती, हनुमान चालीसा व परिवार संग शान्ति।',
      suggestedTasks: ['Light Evening Lamp', 'Hanuman Chalisa', 'Family Harmony'],
      suggestedTasksHi: ['तुलसी दीप प्रज्वलन', 'श्री हनुमान चालीसा', 'परिवार संग समय'],
      isCore: true,
      isCurrent: isCurrentTime(godhuliStart, godhuliEnd),
    });
  }

  // Sort all slots chronologically by startTime
  slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return slots;
}

/**
 * Formats a clean, high-devotion daily Panchang & Shubh Muhurta text
 * designed specifically for 1-tap WhatsApp sharing in family & temple groups.
 * Drives organic virality.
 */
export function generateWhatsAppPanchangShare(
  panchang: PanchangData,
  date: Date,
  locationName: string,
  timezone: string = 'Asia/Kolkata',
  isHi: boolean = true
): string {
  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const dayOfWeekNamesHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const dayNameHi = dayOfWeekNamesHi[date.getDay()];

  const dateFormatted = date.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const abhijitStr = panchang.muhurtas.abhijitMuhurta
    ? `${formatTime(panchang.muhurtas.abhijitMuhurta.startTime)} - ${formatTime(panchang.muhurtas.abhijitMuhurta.endTime)}`
    : '—';

  const rahuStr = panchang.muhurtas.rahuKaal
    ? `${formatTime(panchang.muhurtas.rahuKaal.startTime)} - ${formatTime(panchang.muhurtas.rahuKaal.endTime)}`
    : '—';

  const amritCh = panchang.choghadiya.day.find((c) => c.quality === 'Amrit');
  const amritStr = amritCh
    ? `${formatTime(amritCh.startTime)} - ${formatTime(amritCh.endTime)}`
    : '—';

  const shubhCh = panchang.choghadiya.day.find((c) => c.quality === 'Shubh');
  const shubhStr = shubhCh
    ? `${formatTime(shubhCh.startTime)} - ${formatTime(shubhCh.endTime)}`
    : '—';

  if (!isHi) {
    return `🕉️ *Daily Vedic Panchang & Auspicious Muhurtas* 🕉️
📍 *City:* ${locationName}
📅 *Date:* ${dateFormatted} (${date.toLocaleDateString('en-US', { weekday: 'long' })})

🚩 *Samvat:* Vikram ${panchang.samvat.vikramSamvat}
🌸 *Month:* ${panchang.masa.purnimantaName} (${panchang.tithi.current.paksha} Paksha)
✨ *Tithi:* ${panchang.tithi.current.name} (ends ${formatTime(panchang.tithi.endTime)})
⭐ *Nakshatra:* ${panchang.nakshatra.current.name}
🪐 *Yoga:* ${panchang.yoga.current.name} | *Karana:* ${panchang.karana.current.name}

🌅 *Sunrise:* ${formatTime(panchang.sunTimes.sunrise)} | 🌇 *Sunset:* ${formatTime(panchang.sunTimes.sunset)}

🌟 *Golden Muhurtas (Best for Beginnings):*
• *Abhijit Muhurta:* ${abhijitStr} (Supreme Victory)
• *Amrit Choghadiya:* ${amritStr}
• *Shubh Choghadiya:* ${shubhStr}

⚠️ *Caution Window (Avoid Starting Important Work):*
• *Rahu Kaal:* ${rahuStr}

🎯 *Plan your day according to Vedic Muhurta:*
👉 https://sanatan.cc

_May the Supreme Divine bless your day!_ 🙏`;
  }

  return `🕉️ *श्री गणेशाय नमः | शुभ प्रभात* 🕉️
📜 *दैनिक वैदिक पञ्चाङ्ग एवं शुभ मुहूर्त* 📜
📍 *स्थान:* ${locationName}
📅 *दिनांक:* ${dayNameHi}, ${dateFormatted}

🚩 *सम्वत्:* विक्रम सम्वत् ${panchang.samvat.vikramSamvat}
🌸 *मास:* ${panchang.masa.purnimantaNameDevanagari} मास (${panchang.tithi.current.pakshaDevanagari})
✨ *तिथि:* ${panchang.tithi.current.nameDevanagari} (समाप्ति ${formatTime(panchang.tithi.endTime)})
⭐ *नक्षत्र:* ${panchang.nakshatra.current.nameDevanagari}
🪐 *योग:* ${panchang.yoga.current.nameDevanagari} | *करण:* ${panchang.karana.current.nameDevanagari}

🌅 *सूर्योदय:* ${formatTime(panchang.sunTimes.sunrise)} | 🌇 *सूर्यास्त:* ${formatTime(panchang.sunTimes.sunset)}

🌟 *आज के शुभ मुहूर्त (कार्य आरम्भ हेतु श्रेष्ठ):*
• *अभिजित मुहूर्त:* ${abhijitStr} (सर्वदोष नाशक)
• *अमृत चौघड़िया:* ${amritStr}
• *शुभ चौघड़िया:* ${shubhStr}

⚠️ *अशुभ काल (नए कार्य टालें):*
• *राहु काल:* ${rahuStr}

🎯 *मुहूर्तानुसार आज की दिनचर्या बनाएं:*
👉 https://sanatan.cc

_सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः_ 🙏`;
}
