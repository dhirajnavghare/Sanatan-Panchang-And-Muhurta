import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  Switch,
  Platform,
  Linking,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import {
  loadUserProfile,
  loadUserLocation,
  saveUserProfile,
  saveUserLocation,
  UserSacredProfile,
  UserNotificationPreferences,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
import { GeoLocation } from '@/src/core/panchang/types';
import { SacredProfileEditorModal } from '@/src/components/SacredProfileEditorModal';
import { AppTourModal } from '@/src/components/AppTourModal';
import { triggerHaptic } from '@/src/services/sacredAudio';
import {
  scheduleDailySacredReminders,
  presentTestNotification,
} from '@/src/services/sacredNotifications';
import { calculatePanchang, PRESET_CITIES } from '@/src/core/panchang';
import { getDayPlans } from '@/src/services/dayplanner';
import { getDateKey } from '@/src/services/sadhana';

export default function SettingsScreen() {
  const { language, setLanguage, calendarSystem, setCalendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [userLocation, setUserLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    loadUserProfile().then(setUserProfile);
    loadUserLocation().then(setUserLocation);
  }, []);

  const handleSelectCity = async (city: GeoLocation) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setIsCityModalVisible(false);
    setUserLocation(city);
    await saveUserLocation(city);
    const panchang = calculatePanchang(new Date(), city);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, userProfile, plans, city.timezone, 7, city, language);
  };

  const handleGpsDetect = async () => {
    try {
      setIsLocating(true);
      await triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
          isHi
            ? 'सटीक सूर्योदय व पञ्चाङ्ग गणना हेतु कृपया स्थान अनुमति प्रदान करें।'
            : 'Location permission is required to detect coordinates for astronomical sunrise.'
        );
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude, altitude } = loc.coords;
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      const detectedLocation: GeoLocation = {
        name: isHi ? 'वर्तमान जीपीएस स्थान' : 'Current GPS Location',
        latitude,
        longitude,
        altitude: altitude ?? 0,
        timezone: detectedTz,
      };
      await saveUserLocation(detectedLocation);
      setUserLocation(detectedLocation);
      setIsLocating(false);
      setIsCityModalVisible(false);

      const panchang = calculatePanchang(new Date(), detectedLocation);
      const plans = await getDayPlans(getDateKey(new Date()));
      await scheduleDailySacredReminders(panchang, userProfile, plans, detectedTz, 7, detectedLocation, language);
    } catch {
      setIsLocating(false);
      Alert.alert(
        isHi ? 'स्थान त्रुटि' : 'Location Error',
        isHi ? 'जीपीएस स्थान प्राप्त नहीं हो सका।' : 'Could not detect GPS location.'
      );
    }
  };

  const handleSaveProfile = async (updated: UserSacredProfile) => {
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, userLocation.timezone, 7, userLocation, language);
  };

  const handleLanguageSelect = async (lang: 'hi' | 'en') => {
    if (lang === language) return;
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setLanguage(lang);
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, userProfile, plans, userLocation.timezone, 7, userLocation, lang);
  };

  const handleCalendarSystemSelect = (sys: 'purnimanta' | 'amanta') => {
    if (sys === calendarSystem) return;
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setCalendarSystem(sys);
  };

  const handleToggleMasterNotifications = async (val: boolean) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    const updated = {
      ...userProfile,
      notificationsEnabled: val,
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, userLocation.timezone, 7, userLocation, language);
  };

  const handleToggleNotifCategory = async (
    category: keyof UserNotificationPreferences,
    val: boolean
  ) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    const updated: UserSacredProfile = {
      ...userProfile,
      notifications: {
        ...userProfile.notifications,
        [category]: val,
      },
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, userLocation.timezone, 7, userLocation, language);
  };

  const handleToggleAudio = async (val: boolean) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    const updated = { ...userProfile, audioEnabled: val };
    setUserProfile(updated);
    await saveUserProfile(updated);
  };

  const handleToggleHaptics = async (val: boolean) => {
    if (val) await triggerHaptic('tap', true);
    const updated = { ...userProfile, hapticsEnabled: val };
    setUserProfile(updated);
    await saveUserProfile(updated);
  };

  const handleSendTestNotification = async () => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    await presentTestNotification(
      isHi ? '🌟 अभिजित मुहूर्त सक्रिय है (महाशुभ विजय काल)' : '🌟 Abhijit Muhurta is Active Now',
      isHi
        ? 'भगवान विष्णु का परम प्रिय काल • समस्त शुभ कार्य, महत्वपूर्ण निर्णय व आरम्भ हेतु सर्वोत्तम • 🎯 आपके नियोजित कार्य: नया अनुबंध हस्ताक्षर'
        : 'Auspicious hour of Lord Vishnu • Supreme for vital launches & agreements • 🎯 Your tasks: Sign agreement'
    );
  };

  const handleOpenFeedback = async (url: string) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    try {
      await Linking.openURL(url);
    } catch {
      // Non-blocking fallback
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Devotee Sacred Profile Banner */}
      <View style={styles.profileBanner}>
        <View style={styles.profileAvatarBox}>
          <Text style={styles.profileAvatarEmoji}>🕉️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileGreeting}>
            {isHi ? 'श्री' : 'Sri'} {userProfile.name} {isHi ? 'जी' : ''}
          </Text>
          <Text style={styles.profileGotraText}>
            {userProfile.gotra ? `${isHi ? 'गोत्र:' : 'Gotra:'} ${userProfile.gotra}` : ''} • {userProfile.ishtaDevata}
          </Text>
          {userProfile.kuldeviOrDevata ? (
            <Text style={styles.profileKuldeviText}>
              {isHi ? 'कुलदेवी:' : 'Family Deity:'} {userProfile.kuldeviOrDevata}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          testID="settings-edit-profile-btn"
          style={styles.editProfilePill}
          onPress={async () => {
            await triggerHaptic('tap', userProfile.hapticsEnabled);
            setIsProfileModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={15} color="#b45309" />
          <Text style={styles.editProfilePillText}>{isHi ? 'बदलें' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. General Preferences & Regional System */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeader}>
          {isHi ? '⚙️ ऍप सेटिंग्स एवं प्राथमिकताएं' : '⚙️ App Preferences & System'}
        </Text>

        {/* Language Toggle */}
        <View style={styles.settingRow}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.settingTitle}>{isHi ? 'भाषा' : 'Language'}</Text>
            <Text style={styles.settingDesc}>
              {isHi ? 'सम्पूर्ण ऍप की भाषा' : 'Display language'}
            </Text>
          </View>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              testID="lang-toggle-hi"
              style={[styles.toggleBtn, language === 'hi' && styles.toggleBtnActive]}
              onPress={() => handleLanguageSelect('hi')}
            >
              <Text style={[styles.toggleText, language === 'hi' && styles.toggleTextActive]}>
                हिन्दी
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="lang-toggle-en"
              style={[styles.toggleBtn, language === 'en' && styles.toggleBtnActive]}
              onPress={() => handleLanguageSelect('en')}
            >
              <Text style={[styles.toggleText, language === 'en' && styles.toggleTextActive]}>
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Regional Calendar System */}
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? 'चान्द्र मास पद्धति' : 'Lunar Calendar System'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi
                ? 'पूर्णिमान्त (उत्तर भारत) या अमान्त (दक्षिण व पश्चिम भारत)'
                : 'Purnimanta (North) or Amanta (West/South)'}
            </Text>
          </View>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              testID="cal-toggle-purnimanta"
              style={[styles.toggleBtn, calendarSystem === 'purnimanta' && styles.toggleBtnActive]}
              onPress={() => handleCalendarSystemSelect('purnimanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  calendarSystem === 'purnimanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'पूर्णिमान्त' : 'Purnimanta'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="cal-toggle-amanta"
              style={[styles.toggleBtn, calendarSystem === 'amanta' && styles.toggleBtnActive]}
              onPress={() => handleCalendarSystemSelect('amanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  calendarSystem === 'amanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'अमान्त' : 'Amanta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prime Meridian & Location Selection */}
        <TouchableOpacity
          testID="settings-meridian-btn"
          style={styles.settingRow}
          onPress={async () => {
            await triggerHaptic('tap', userProfile.hapticsEnabled);
            setIsCityModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? 'प्रधान देशान्तर एवं नगर (Meridian)' : 'Prime Meridian & City Location'}
            </Text>
            <Text style={styles.settingDesc} numberOfLines={1}>
              📍 {userLocation.name} ({userLocation.latitude.toFixed(2)}°, {userLocation.longitude.toFixed(2)}°)
            </Text>
          </View>
          <View style={styles.meridianPill}>
            <Ionicons name="compass-outline" size={16} color="#b45309" />
            <Text style={styles.meridianPillText}>
              {isHi ? 'बदलें' : 'Change'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Replay App Tour */}
        <TouchableOpacity
          testID="settings-replay-tour-btn"
          style={[styles.settingRow, { borderBottomWidth: 0, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f4f4f5' }]}
          onPress={async () => {
            await triggerHaptic('tap', userProfile.hapticsEnabled);
            setIsTourModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? '🧭 ऐप का परिचय / पुनः टूर देखें' : '🧭 Take App Walkthrough Tour'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi
                ? 'सनातन दिनचर्या, मुहूर्त प्लानर व सभी सुविधाओं का संक्षिप्त गाइड'
                : 'Interactive guide to Dinacharya, Muhurta Planner & all features'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#b45309" />
        </TouchableOpacity>
      </View>

      {/* 3. Notification & Cosmic Alerts Section */}
      <View style={styles.settingsCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={styles.cardHeaderTitle}>
              {isHi ? '🔔 सूचनाएं एवं मुहूर्त अलर्ट' : '🔔 Notifications & Muhurta Alerts'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi
                ? 'मुहूर्त परिवर्तन, शुभ चौघड़िया एवं दिनचर्या कार्यों की सूचना'
                : 'Phone panel alerts for active Muhurtas & scheduled To-Dos'}
            </Text>
          </View>
          <Switch
            testID="notif-master-switch"
            value={userProfile.notificationsEnabled}
            onValueChange={handleToggleMasterNotifications}
            trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
            thumbColor={userProfile.notificationsEnabled ? '#15803d' : '#f4f4f5'}
          />
        </View>

        {userProfile.notificationsEnabled && (
          <View style={{ backgroundColor: 'transparent', marginTop: 8 }}>
            {/* Abhijit Muhurta Alert */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '🌟 अभिजित मुहूर्त अलर्ट' : '🌟 Abhijit Muhurta Alert'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi
                    ? 'महाशुभ विजय काल आरम्भ होने पर एवं उस समय के कार्यों की सूचना'
                    : 'Supreme victory hour starting alert with planned To-Do tasks'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-abhijit"
                value={userProfile.notifications.abhijitAlert}
                onValueChange={(val) => handleToggleNotifCategory('abhijitAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.abhijitAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Day Planner To-Do Alert */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '📝 दिनचर्या कार्य (To-Do) अलर्ट' : '📝 Day Planner To-Dos Alert'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi
                    ? 'प्रत्येक मुहूर्त स्लॉट के प्रारम्भ में आपके जोड़े गए कार्यों की सूचना'
                    : 'Shows your planned tasks on phone panel when slot starts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-todo"
                value={userProfile.notifications.todoTasksAlert}
                onValueChange={(val) => handleToggleNotifCategory('todoTasksAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.todoTasksAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Brahma Muhurta Alert */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '🌅 ब्रह्म मुहूर्त जागरण' : '🌅 Brahma Muhurta Awakening'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi ? 'अमृत वेला (प्रातः ४:३०) ध्यान व साधना सूचना' : 'Pre-dawn japa & meditation alert'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-brahma"
                value={userProfile.notifications.brahmaMuhurtaAlert}
                onValueChange={(val) => handleToggleNotifCategory('brahmaMuhurtaAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.brahmaMuhurtaAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Rahu Kaal Warning */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '⚠️ राहु काल पूर्व-चेतावनी' : '⚠️ Rahu Kaal Pre-Warning'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi
                    ? 'राहु काल आरम्भ होने से १० मिनट पूर्व सावधानी अलर्ट'
                    : '10 min caution warning before inauspicious period starts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-rahu"
                value={userProfile.notifications.rahuKaalAlert}
                onValueChange={(val) => handleToggleNotifCategory('rahuKaalAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
                thumbColor={userProfile.notifications.rahuKaalAlert ? '#c2410c' : '#f4f4f5'}
              />
            </View>

            {/* Shubh Choghadiya Alert */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '✨ अमृत व शुभ चौघड़िया' : '✨ Amrit & Shubh Choghadiya'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi
                    ? 'दिन के सर्वोत्तम चौघड़िया काल की समयबद्ध सूचना'
                    : 'Auspicious Choghadiya window entry alerts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-choghadiya"
                value={userProfile.notifications.choghadiyaAlert}
                onValueChange={(val) => handleToggleNotifCategory('choghadiyaAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.choghadiyaAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Sandhya Deepam Alert */}
            <View style={styles.settingRow}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '🪔 सायं गोधूलि दीप प्रज्वलन' : '🪔 Godhuli Evening Deepam'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi ? 'सूर्यास्त वेला में दीप व हनुमान चालीसा स्मरण' : 'Sunset oil lamp & Hanuman Chalisa reminder'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-deepam"
                value={userProfile.notifications.sandhyaDeepamAlert}
                onValueChange={(val) => handleToggleNotifCategory('sandhyaDeepamAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#fef08a' }}
                thumbColor={userProfile.notifications.sandhyaDeepamAlert ? '#ca8a04' : '#f4f4f5'}
              />
            </View>

            {/* Ekadashi & Vrat Alert */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={styles.settingTitle}>
                  {isHi ? '🌾 एकादशी व प्रमुख व्रत स्मरण' : '🌾 Ekadashi & Fasting Alerts'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isHi ? 'एकादशी एवं प्रदोष व्रत की पूर्व संध्या सूचना' : 'Eve alerts for sacred vrat days'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-ekadashi"
                value={userProfile.notifications.ekadashiAlert}
                onValueChange={(val) => handleToggleNotifCategory('ekadashiAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.ekadashiAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Instant Test Notification Button */}
            <TouchableOpacity
              testID="notif-send-test-btn"
              style={styles.testNotificationBtn}
              onPress={handleSendTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={16} color="#15803d" />
              <Text style={styles.testNotificationBtnText}>
                {isHi
                  ? '📲 टेस्ट नोटिफिकेशन भेजें (अभिजित व To-Do)'
                  : '📲 Send Test Notification (Abhijit & To-Do)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Audio & Haptics Preferences */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeader}>
          {isHi ? '🔔 ध्वनि एवं स्पर्श (Audio & Haptics)' : '🔔 Audio & Tactile Haptics'}
        </Text>

        <View style={styles.settingRow}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? 'मन्दिर घंटी एवं शंख ध्वनि' : 'Mandir Bell & Shankh Sound'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi ? 'प्रामाणिक पीतल घंटी की ध्वनि तरंगे' : 'Real acoustic brass chime effects'}
            </Text>
          </View>
          <Switch
            testID="settings-toggle-audio"
            value={userProfile.audioEnabled}
            onValueChange={handleToggleAudio}
            trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
            thumbColor={userProfile.audioEnabled ? '#d97706' : '#f4f4f5'}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? 'जप माला स्पर्श कम्पन (Haptics)' : 'Tactile Haptic Feedback'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi ? '१०८ मनके व गुरु मनके पर सूक्ष्म कम्पन' : 'Gentle physical pulse on japa mala beads'}
            </Text>
          </View>
          <Switch
            testID="settings-toggle-haptics"
            value={userProfile.hapticsEnabled}
            onValueChange={handleToggleHaptics}
            trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
            thumbColor={userProfile.hapticsEnabled ? '#d97706' : '#f4f4f5'}
          />
        </View>
      </View>

      {/* 5. 100% Offline Autonomy Guarantee Card */}
      <View testID="settings-offline-card" style={styles.offlineCard}>
        <View style={styles.offlineHeaderRow}>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>⚡ 100% OFFLINE</Text>
          </View>
          <Text style={styles.offlineHeaderTitle}>
            {isHi ? 'पूर्णतः ऑफ़लाइन कार्य प्रणाली' : 'Full Offline Autonomy'}
          </Text>
        </View>

        <Text style={styles.offlineDesc}>
          {isHi
            ? 'यह सम्पूर्ण ऍप एवं इसकी सभी सूचनाएं बिना इंटरनेट के १००% ऑफ़लाइन कार्य करती हैं। नासा एवं वैदिक सिद्धान्तों पर आधारित खगोलीय पञ्चाङ्ग आपके फोन में ही गणितीय रूप से संगणित होता है।'
            : 'Zero internet required. All astronomical calculations, ephemeris, festivals, and alerts run locally on your phone hardware.'}
        </Text>

        <View style={styles.offlineGrid}>
          <View style={styles.offlineGridItem}>
            <Ionicons name="airplane" size={16} color="#15803d" />
            <Text style={styles.offlineGridText}>
              {isHi ? 'एयरप्लेन मोड में सक्रिय' : 'Works in Airplane Mode'}
            </Text>
          </View>
          <View style={styles.offlineGridItem}>
            <Ionicons name="alarm-outline" size={16} color="#15803d" />
            <Text style={styles.offlineGridText}>
              {isHi ? '७ दिन की पूर्व-सूचनाएं' : '7 Days Pre-Scheduled Alarms'}
            </Text>
          </View>
          <View style={styles.offlineGridItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#15803d" />
            <Text style={styles.offlineGridText}>
              {isHi ? 'शून्य डेटा / गोपनीयता' : 'Zero Data / Zero Tracking'}
            </Text>
          </View>
          <View style={styles.offlineGridItem}>
            <Ionicons name="hardware-chip-outline" size={16} color="#15803d" />
            <Text style={styles.offlineGridText}>
              {isHi ? 'हार्डवेयर अलार्म क्लॉक' : 'Hardware Clock Trigger'}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. About & Mission Card */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>
          {isHi ? 'सनातन दिनचर्या एवं पञ्चाङ्ग' : 'Sanatan Dinacharya & Panchang'}
        </Text>
        <Text style={styles.aboutDesc}>
          {isHi
            ? 'शुद्ध गणितीय खगोलशास्त्र, नासा जेपीएल एफिमेरिस एवं महर्षि वराहमिहिर के सिद्धान्तों पर आधारित पूर्णतः नि:शुल्क एवं विज्ञापन-मुक्त सनातनी सेवा।'
            : 'Pure mathematical ephemeris with zero approximations, computed from NASA JPL & Jean Meeus first principles. Free and open-source.'}
        </Text>
        <Text style={styles.aboutVersion}>Version 1.0.0 • Open Source Dharma</Text>
      </View>

      {/* 7. Feedback & Contact Card */}
      <View testID="settings-feedback-card" style={styles.feedbackCard}>
        <View style={styles.feedbackHeaderRow}>
          <Ionicons name="chatbubbles-outline" size={18} color="#d97706" />
          <Text style={styles.feedbackHeaderTitle}>
            {isHi ? 'प्रतिक्रिया एवं सुझाव (Feedback & Contact)' : 'Feedback & Contact'}
          </Text>
        </View>

        <Text style={styles.feedbackDesc}>
          {isHi
            ? 'सनातन दिनचर्या को और उत्तम बनाने हेतु आपके विचार, त्रुटि निवारण अथवा सुझाव सादर आमंत्रित हैं:'
            : 'We welcome your thoughts, suggestions, and feedback to improve this sacred seva:'}
        </Text>

        <TouchableOpacity
          testID="feedback-link-sanatan"
          style={styles.feedbackLinkBtn}
          onPress={() => handleOpenFeedback('https://sanatan.cc/contact')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Sanatan Portal Feedback"
        >
          <View style={styles.feedbackLinkIconBox}>
            <Ionicons name="globe-outline" size={18} color="#d97706" />
          </View>
          <View style={styles.feedbackLinkTextBox}>
            <Text style={styles.feedbackLinkTitle}>
              {isHi ? 'सनातन सम्पर्क एवं सुझाव' : 'Sanatan Portal Feedback'}
            </Text>
            <Text style={styles.feedbackLinkUrl}>https://sanatan.cc/contact</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#a1a1aa" />
        </TouchableOpacity>

        <TouchableOpacity
          testID="feedback-link-developer"
          style={styles.feedbackLinkBtn}
          onPress={() => handleOpenFeedback('https://dhirajnavghare.com/contact')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Developer Contact"
        >
          <View style={styles.feedbackLinkIconBox}>
            <Ionicons name="person-circle-outline" size={18} color="#d97706" />
          </View>
          <View style={styles.feedbackLinkTextBox}>
            <Text style={styles.feedbackLinkTitle}>
              {isHi ? 'डेवलपर सम्पर्क (Dhiraj Navghare)' : 'Developer Contact (Dhiraj Navghare)'}
            </Text>
            <Text style={styles.feedbackLinkUrl}>https://dhirajnavghare.com/contact</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Sacred Profile Editor Modal */}
      <SacredProfileEditorModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={handleSaveProfile}
        isHi={isHi}
      />

      {/* App Tour Walkthrough Modal */}
      <AppTourModal
        visible={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        isHi={isHi}
      />

      {/* City / Tirtha / Prime Meridian Selector Modal */}
      <Modal visible={isCityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="compass" size={20} color="#b45309" />
                  <Text style={styles.modalTitle}>
                    {isHi ? 'प्रधान देशान्तर अथवा नगर चुनें' : 'Select Prime Meridian or City'}
                  </Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  {isHi
                    ? 'स्थानिक सूर्योदय, सूर्यास्त व पञ्चाङ्ग गणना हेतु'
                    : 'Astronomical coordinates for local sunrise & muhurta'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCityModalVisible(false)}
                testID="city-modal-close-btn"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={26} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detection Bar */}
            <TouchableOpacity
              testID="settings-gps-detect-btn"
              style={styles.gpsBanner}
              onPress={handleGpsDetect}
              disabled={isLocating}
              activeOpacity={0.7}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="navigate" size={16} color="#ffffff" />
                  <Text style={styles.gpsBannerText}>
                    {isHi ? 'वर्तमान जीपीएस स्थान स्वतः पता करें' : 'Auto-detect Current GPS Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <FlatList
              data={PRESET_CITIES}
              keyExtractor={(item) => item.name}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const isSelected = item.name === userLocation.name;
                const isPrimeMeridian = item.name.includes('Standard Meridian') || item.name.includes('Ujjain');
                return (
                  <TouchableOpacity
                    testID={`city-option-${item.name.split(',')[0].replace(/\s+/g, '-').toLowerCase()}`}
                    style={[
                      styles.cityRow,
                      isSelected && styles.cityRowSelected,
                    ]}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.cityName,
                            isSelected && styles.cityNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isPrimeMeridian && (
                          <View style={styles.meridianTag}>
                            <Text style={styles.meridianTagText}>0° MERIDIAN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cityCoords}>
                        {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}° • {item.timezone}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#b45309" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 12,
  },
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  profileAvatarEmoji: {
    fontSize: 22,
  },
  profileGreeting: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400e',
  },
  profileGotraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 2,
  },
  profileKuldeviText: {
    fontSize: 11,
    color: '#d97706',
    marginTop: 1,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  editProfilePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181b',
  },
  settingDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.md,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: '#18181b',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  testNotificationBtn: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testNotificationBtnText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 6,
  },
  aboutDesc: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  aboutVersion: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  offlineCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  offlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  offlineBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offlineBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offlineHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  offlineDesc: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 18,
    marginBottom: 12,
  },
  offlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  offlineGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#dcfce7',
    flexGrow: 1,
  },
  offlineGridText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  feedbackCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  feedbackHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  feedbackDesc: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 18,
    marginBottom: 12,
  },
  feedbackLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  feedbackLinkIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  feedbackLinkTextBox: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  feedbackLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  feedbackLinkUrl: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  meridianPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  meridianPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  gpsBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  cityRowSelected: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  cityNameSelected: {
    color: '#d97706',
    fontWeight: '800',
  },
  cityCoords: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  meridianTag: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  meridianTagText: {
    color: '#92400e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
