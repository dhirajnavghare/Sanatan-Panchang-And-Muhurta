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
  isCurrent?: boolean;
}

export interface UserSlotPlan {
  taskText: string;
  isCompleted: boolean;
  updatedAt: number;
}

export type DayPlansMap = Record<string, UserSlotPlan>;

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
      titleHi: 'ब्रह्म मुहूर्त',
      startTime: new Date(bm.startTime),
      endTime: new Date(bm.endTime),
      quality: 'Mahashubh',
      suitability: 'Supreme for meditation, pranayama, spiritual study, chanting, and high-clarity creative thinking.',
      suitabilityHi: 'ध्यान, प्राणायाम, मन्त्र जप, वेद-गीता स्वाध्याय एवं आत्म-चिंतन हेतु सर्वोत्तम समय।',
      suggestedTasks: ['Meditation & Japa', 'Gita Study', 'Morning Walk & Yoga'],
      suggestedTasksHi: ['ध्यान व मन्त्र जप', 'गीता स्वाध्याय', 'प्रातः योग व चिंतन'],
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

    switch (ch.quality) {
      case 'Amrit':
        quality = 'Amrit';
        suitability = 'Nectar hours: All auspicious beginnings, education, medicine, spiritual rituals & signing.';
        suitabilityHi = 'अमृत वेला: समस्त शुभ कार्य आरम्भ, विद्या, औषधि सेवन, देव पूजन व महत्वपूर्ण निर्णय।';
        suggestedTasks = ['Start Key Work', 'Medical Intake', 'Important Learning'];
        suggestedTasksHi = ['महत्वपूर्ण कार्य आरम्भ', 'औषधि सेवन', 'विद्याभ्यास'];
        break;
      case 'Shubh':
        quality = 'Shubh';
        suitability = 'Auspicious: Religious ceremonies, meetings, partnerships, and relationship building.';
        suitabilityHi = 'शुभ समय: धार्मिक उत्सव, महत्वपूर्ण बैठक, नए सम्बन्ध निर्माण व कार्य सम्पादन।';
        suggestedTasks = ['Important Meeting', 'Social Engagements', 'Auspicious Plan'];
        suggestedTasksHi = ['महत्वपूर्ण बैठक', 'धार्मिक अनुष्ठान', 'नवीन कार्य योजना'];
        break;
      case 'Labh':
        quality = 'Labh';
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
      titleHi: `${ch.nameDevanagari} (${ch.quality === 'Amrit' ? 'अमृत' : ch.quality === 'Shubh' ? 'शुभ' : ch.quality === 'Labh' ? 'लाभ' : ch.quality === 'Char' ? 'चर' : 'सामान्य'})`,
      startTime: start,
      endTime: end,
      quality,
      suitability,
      suitabilityHi,
      suggestedTasks,
      suggestedTasksHi,
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
      titleHi: 'अभिजित मुहूर्त (महाशुभ)',
      startTime: start,
      endTime: end,
      quality: 'Mahashubh',
      suitability: 'Supreme window ruled by Lord Vishnu. Destroys all doshas; ideal for vital launches, agreements & decisions.',
      suitabilityHi: 'भगवान विष्णु का परम प्रिय काल। समस्त दोषों का शमन; अति महत्वपूर्ण निर्णय, अनुबंध व विजय कार्य।',
      suggestedTasks: ['Decisive Decision', 'Sign Agreement', 'Major Launch'],
      suggestedTasksHi: ['निर्णायक निर्णय', 'अनुबंध हस्ताक्षर', 'प्रमुख कार्य शुभारम्भ'],
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
      titleHi: 'राहु काल (आरम्भ वर्जित)',
      startTime: start,
      endTime: end,
      quality: 'Ashubh',
      suitability: 'Caution: Strictly avoid starting new ventures, signing contracts, travel, or financial speculation.',
      suitabilityHi: 'त्याज्य समय: नया उद्यम आरम्भ, धन निवेश, यात्रा या शुभ कार्य कदापि न करें। केवल विश्राम करें।',
      suggestedTasks: ['Rest & Meditation', 'Desk Cleanup', 'Internal Reflection'],
      suggestedTasksHi: ['विश्राम व शान्ति', 'दैनिक सामान्य कार्य', 'आत्म-निरीक्षण'],
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
      titleHi: 'विजय मुहूर्त',
      startTime: start,
      endTime: end,
      quality: 'Shubh',
      suitability: 'Bestows triumph: Highly effective for resolving disputes, competitive preparation, exams & tasks.',
      suitabilityHi: 'विजय प्रदायक: विवाद समाधान, कठिन चुनौतियों, परीक्षा तैयारी व साहसिक कार्य हेतु उपयुक्त।',
      suggestedTasks: ['Tackle Hard Task', 'Competitive Prep', 'Resolve Issues'],
      suggestedTasksHi: ['कठिन कार्य निष्पादन', 'अध्ययन व तैयारी', 'विवाद समाधान'],
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
      titleHi: 'गोधूलि वेला व सायं दीप',
      startTime: godhuliStart,
      endTime: godhuliEnd,
      quality: 'Shubh',
      suitability: 'Sacred dusk: Lighting evening lamp at Tulsi/Altar, Aarti, Hanuman Chalisa, family togetherness.',
      suitabilityHi: 'गोधूलि वेला: तुलसी व मन्दिर में दीप प्रज्वलन, सायं आरती, हनुमान चालीसा व परिवार संग शान्ति।',
      suggestedTasks: ['Light Evening Lamp', 'Hanuman Chalisa', 'Family Harmony'],
      suggestedTasksHi: ['तुलसी दीप प्रज्वलन', 'श्री हनुमान चालीसा', 'परिवार संग समय'],
      isCurrent: isCurrentTime(godhuliStart, godhuliEnd),
    });
  }

  // Sort all slots chronologically by startTime
  slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return slots;
}
