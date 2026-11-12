import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation } from '../core/panchang/types';
import { PRESET_CITIES } from '../core/panchang/constants';

export interface UserNotificationPreferences {
  abhijitAlert: boolean; // 🌟 Abhijit Muhurta & Supreme Auspicious Windows
  brahmaMuhurtaAlert: boolean; // 🕊️ Brahma Muhurta (Amrit Vela)
  rahuKaalAlert: boolean; // ⚠️ Rahu Kaal Caution Warnings
  sandhyaDeepamAlert: boolean; // 🪔 Godhuli & Evening Sandhya Deepam
  choghadiyaAlert: boolean; // ✨ Amrit & Shubh Choghadiya Shifts
  todoTasksAlert: boolean; // 📝 Planned To-Do Task Reminders
  ekadashiAlert: boolean; // 🌸 Ekadashi Fasting Alerts
  pradoshAlert: boolean; // 🔱 Pradosha Vrat Alerts
  chandrodayaAlert: boolean; // 🌙 Moonrise Alerts
}

export interface UserSacredProfile {
  name: string;
  gotra: string;
  ishtaDevata: string;
  kuldeviOrDevata: string;
  city: string;
  audioEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notifications: UserNotificationPreferences;
}

export const POPULAR_GOTRAS = [
  'Kashyapa (कश्यप)',
  'Bharadvaja (भारद्वाज)',
  'Vashistha (वशिष्ठ)',
  'Vishvamitra (विश्वामित्र)',
  'Gautama (गौतम)',
  'Jamadagni (जमदग्नि)',
  'Atri (अत्रि)',
  'Agastya (अगस्त्य)',
  'Shandilya (शाण्डिल्य)',
  'Gargya / Garg (गर्ग)',
  'Parashara (पाराशर)',
  'Harita (हारीत)',
  'Kaushika (कौशिक)',
  'Vatsa (वत्स)',
  'Mudgala (मुद्गल)',
  'Angirasa (अंगिरस)',
  'Kaundinya (कौण्डिन्य)',
  'Upamanyu (उपमन्यु)',
  'Shiva / Vishnu Gotra (शिव/विष्णु गोत्र)',
];

export const POPULAR_ISHTA_DEVATAS = [
  { id: 'shiva', name: 'Lord Shiva / Mahadeva', nameHi: 'भगवान शिव / महादेव', icon: '🔱' },
  { id: 'hanuman', name: 'Sri Hanuman Ji', nameHi: 'श्री संकटमोचन हनुमान', icon: '🚩' },
  { id: 'krishna', name: 'Lord Sri Krishna', nameHi: 'भगवान श्री कृष्ण', icon: '🦚' },
  { id: 'rama', name: 'Bhagwan Sri Rama', nameHi: 'मर्यादा पुरुषोत्तम श्री राम', icon: '🏹' },
  { id: 'durga', name: 'Maa Durga / Shakti', nameHi: 'माता दुर्गा / भगवती शक्ति', icon: '🦁' },
  { id: 'ganesha', name: 'Lord Sri Ganesha', nameHi: 'प्रथम पूज्य श्री गणेश', icon: '🐘' },
  { id: 'lakshmi', name: 'Maa Mahalakshmi', nameHi: 'माता महालक्ष्मी', icon: '🪷' },
  { id: 'vishnu', name: 'Lord Sri Hari Vishnu', nameHi: 'भगवान श्री हरि विष्णु', icon: '🐚' },
  { id: 'venkateshwara', name: 'Sri Tirupati Balaji', nameHi: 'श्री तिरुपति बालाजी', icon: '👑' },
  { id: 'murugan', name: 'Lord Murugan / Kartikeya', nameHi: 'भगवान मुरुगन / कार्तिकेय', icon: '🪶' },
  { id: 'surya', name: 'Lord Surya Narayana', nameHi: 'प्रत्यक्ष देव सूर्य नारायण', icon: '☀️' },
  { id: 'saraswati', name: 'Maa Saraswati', nameHi: 'विद्यादायिनी माँ सरस्वती', icon: '🪕' },
];

export const DEFAULT_USER_PROFILE: UserSacredProfile = {
  name: 'साधक',
  gotra: 'कश्यप',
  ishtaDevata: 'Lord Shiva / Mahadeva',
  kuldeviOrDevata: '',
  city: 'Ujjain, India (Standard Meridian)',
  audioEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  notifications: {
    abhijitAlert: true,
    brahmaMuhurtaAlert: true,
    rahuKaalAlert: true,
    sandhyaDeepamAlert: true,
    choghadiyaAlert: true,
    todoTasksAlert: true,
    ekadashiAlert: true,
    pradoshAlert: true,
    chandrodayaAlert: false,
  },
};

const PROFILE_STORAGE_KEY = '@sanatan_user_sacred_profile_v1';

export async function loadUserProfile(): Promise<UserSacredProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROFILE,
      ...parsed,
      notifications: {
        ...DEFAULT_USER_PROFILE.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export async function saveUserProfile(profile: UserSacredProfile): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

const LOCATION_STORAGE_KEY = '@sanatan_user_location_v1';

/**
 * Loads persisted user location from device storage, defaulting to Ujjain offline.
 */
export async function loadUserLocation(): Promise<GeoLocation> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return PRESET_CITIES[0];
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return parsed;
    }
    return PRESET_CITIES[0];
  } catch {
    return PRESET_CITIES[0];
  }
}

/**
 * Saves user selected city or GPS coordinates to device storage for 100% offline persistence.
 */
export async function saveUserLocation(location: GeoLocation): Promise<boolean> {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    return true;
  } catch {
    return false;
  }
}
