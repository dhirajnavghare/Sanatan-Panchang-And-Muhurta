import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, Text, View, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TEMPLES_DATABASE } from '@/src/core/temples/data';
import { TempleRecord } from '@/src/core/temples/types';
import { DEITIES_DATABASE } from '@/src/core/devatas/data';
import { DeityRecord, DeityTradition } from '@/src/core/devatas/types';
import { VRAT_KATHAS_DATABASE, VratKathaRecord } from '@/src/core/vrat-katha/data';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import {
  loadUserProfile,
  saveUserProfile,
  UserSacredProfile,
  UserNotificationPreferences,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
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

type MoreSection = 'temples' | 'devatas' | 'vrat_katha';

export default function MoreScreen() {
  const { language, setLanguage, calendarSystem, setCalendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  useEffect(() => {
    loadUserProfile().then(setUserProfile);
  }, []);

  const handleSaveProfile = async (updated: UserSacredProfile) => {
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), PRESET_CITIES[0]);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans);
  };

  const handleToggleMasterNotifications = async (val: boolean) => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    const updated = {
      ...userProfile,
      notificationsEnabled: val,
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), PRESET_CITIES[0]);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans);
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
    const panchang = calculatePanchang(new Date(), PRESET_CITIES[0]);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans);
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

  const [activeSection, setActiveSection] = useState<MoreSection>('temples');
  const [isCalculating, setIsCalculating] = useState(false);

  // Temples state
  const [circuitFilter, setCircuitFilter] = useState<'jyotirlinga' | 'char_dham' | 'pancha_bhoota'>('jyotirlinga');
  const filteredTemples = TEMPLES_DATABASE.filter(
    (t) => t.circuitCategory === circuitFilter || t.secondaryCircuits?.includes(circuitFilter)
  );

  // Devatas state
  const [devataTradition, setDevataTradition] = useState<string>('all');
  const [selectedDeityModal, setSelectedDeityModal] = useState<DeityRecord | null>(null);

  const filteredDeities = DEITIES_DATABASE.filter((d) => {
    if (devataTradition === 'all') return true;
    if (devataTradition === 'pancha_deva') return d.isPanchaDeva;
    return d.tradition.toLowerCase() === devataTradition.toLowerCase();
  });

  // Vrat Katha state
  const [selectedVratId, setSelectedVratId] = useState<string>(VRAT_KATHAS_DATABASE[0].id);
  const activeVrat = VRAT_KATHAS_DATABASE.find((v) => v.id === selectedVratId) || VRAT_KATHAS_DATABASE[0];

  const handleSectionSelect = (s: MoreSection) => {
    if (s === activeSection) return;
    setIsCalculating(true);
    setTimeout(() => {
      setActiveSection(s);
      setIsCalculating(false);
    }, 120);
  };

  const handleLanguageSelect = (lang: 'hi' | 'en') => {
    if (lang === language) return;
    setIsCalculating(true);
    setTimeout(() => {
      setLanguage(lang);
      setIsCalculating(false);
    }, 120);
  };

  const handleCalendarSystemSelect = (sys: 'purnimanta' | 'amanta') => {
    if (sys === calendarSystem) return;
    setIsCalculating(true);
    setTimeout(() => {
      setCalendarSystem(sys);
      setIsCalculating(false);
    }, 120);
  };

  const handleCircuitSelect = (c: 'jyotirlinga' | 'char_dham' | 'pancha_bhoota') => {
    if (c === circuitFilter) return;
    setIsCalculating(true);
    setTimeout(() => {
      setCircuitFilter(c);
      setIsCalculating(false);
    }, 120);
  };

  const handleDevataTraditionSelect = (t: string) => {
    if (t === devataTradition) return;
    setIsCalculating(true);
    setTimeout(() => {
      setDevataTradition(t);
      setIsCalculating(false);
    }, 120);
  };

  const handleVratSelect = (id: string) => {
    if (id === selectedVratId) return;
    setIsCalculating(true);
    setTimeout(() => {
      setSelectedVratId(id);
      setIsCalculating(false);
    }, 120);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sacred Devotee Profile Banner */}
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
          testID="more-edit-profile-btn"
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

      {/* Settings Section */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeader}>
          {isHi ? '⚙️ ऍप सेटिंग्स एवं प्राथमिकताएं' : '⚙️ App Preferences & Settings'}
        </Text>

        {/* 1. Language Toggle */}
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

        {/* 2. Regional Calendar System */}
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

        {/* 3. Replay App Tour */}
        <TouchableOpacity
          testID="more-replay-tour-btn"
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

      {/* Notification & Cosmic Alerts Section */}
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

      {/* Main Feature Switcher */}
      <View style={styles.featureSwitcher}>
        {[
          { id: 'temples' as const, labelHi: '🛕 तीर्थ-मन्दिर', labelEn: '🛕 Temples' },
          { id: 'devatas' as const, labelHi: '🔱 देवी-देवता', labelEn: '🔱 Deities' },
          { id: 'vrat_katha' as const, labelHi: '📖 व्रत कथा', labelEn: '📖 Vrat Katha' },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              testID={`more-tab-${tab.id}`}
              style={[styles.featureTab, isActive && styles.featureTabActive]}
              onPress={() => handleSectionSelect(tab.id)}
            >
              <Text style={[styles.featureTabText, isActive && styles.featureTabTextActive]}>
                {isHi ? tab.labelHi : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isCalculating ? (
        <LoadingIndicator
          message={
            isHi
              ? 'जानकारी लोड हो रही है...'
              : 'Loading details...'
          }
        />
      ) : (
        <>
          {/* SECTION 1: TEMPLES */}
          {activeSection === 'temples' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {isHi ? '🛕 पवित्र तीर्थ एवं मन्दिर दर्शन' : '🛕 Sacred Pilgrimage Sanctuaries'}
              </Text>

              {/* Circuit Filter Pills */}
              <View style={styles.circuitRow}>
                {[
                  { id: 'jyotirlinga', labelHi: '१२ ज्योतिर्लिंग', labelEn: '12 Jyotirlingas' },
                  { id: 'char_dham', labelHi: 'चार धाम', labelEn: 'Char Dham' },
                  { id: 'pancha_bhoota', labelHi: 'पंचभूत', labelEn: 'Pancha Bhoota' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    testID={`circuit-pill-${c.id}`}
                    style={[styles.circuitPill, circuitFilter === c.id && styles.circuitPillActive]}
                    onPress={() => handleCircuitSelect(c.id as typeof circuitFilter)}
                  >
                <Text
                  style={[
                    styles.circuitText,
                    circuitFilter === c.id && styles.circuitTextActive,
                  ]}
                >
                  {isHi ? c.labelHi : c.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTemples.map((temple: TempleRecord) => (
            <View key={temple.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {isHi ? temple.nameDevanagari : temple.name}
                </Text>
                <Text style={styles.cardLocation}>
                  📍 {temple.location.city}, {temple.location.state}
                </Text>
              </View>

              <Text style={styles.cardSubText}>
                {isHi ? 'प्रधान आराध्य:' : 'Primary Deity:'}{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {isHi ? (temple.primaryDeityDevanagari || temple.primaryDeity) : temple.primaryDeity}
                </Text>
              </Text>

              {temple.sacredRiver && (
                <Text style={styles.cardSubText}>
                  🌊 {isHi ? 'पवित्र नदी:' : 'Sacred River:'}{' '}
                  {cleanBilingualTitle(temple.sacredRiver, isHi)}
                </Text>
              )}

              <Text style={styles.cardDesc} numberOfLines={2}>
                {temple.significance}
              </Text>

              <View style={styles.darshanBox}>
                <Ionicons name="time" size={13} color="#d97706" />
                <Text style={styles.darshanText}>
                  {isHi ? 'दर्शन समय:' : 'Darshan:'} {temple.darshanTimings}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SECTION 2: DEVI DEVATAS */}
      {activeSection === 'devatas' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isHi ? '🔱 सनातन देवी-देवता दर्शन एवं महामन्त्र' : '🔱 Sacred Hindu Deities & Mantras'}
          </Text>

          {/* Tradition Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[
              { id: 'all', labelHi: 'सभी देवता', labelEn: 'All Deities' },
              { id: 'pancha_deva', labelHi: 'पञ्चदेव', labelEn: 'Pancha Devas' },
              { id: 'shaiva', labelHi: 'शैव', labelEn: 'Shaiva' },
              { id: 'vaishnava', labelHi: 'वैष्णव', labelEn: 'Vaishnava' },
              { id: 'shakta', labelHi: 'शाक्त', labelEn: 'Shakta' },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`tradition-pill-${t.id}`}
                style={[styles.circuitPill, devataTradition === t.id && styles.circuitPillActive]}
                onPress={() => handleDevataTraditionSelect(t.id)}
              >
                <Text style={[styles.circuitText, devataTradition === t.id && styles.circuitTextActive]}>
                  {isHi ? t.labelHi : t.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredDeities.map((deity: DeityRecord) => (
            <TouchableOpacity
              key={deity.id}
              testID={`deity-card-${deity.id}`}
              style={styles.card}
              onPress={() => setSelectedDeityModal(deity)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {isHi ? deity.nameDevanagari : deity.name}
                </Text>
                <View style={styles.badgeTradition}>
                  <Text style={styles.badgeTraditionText}>{deity.tradition}</Text>
                </View>
              </View>

              <Text style={styles.deitySubtitle}>
                {isHi ? deity.subtitleDevanagari : deity.subtitle}
              </Text>

              {deity.consort && (
                <Text style={styles.cardSubText}>
                  {isHi ? 'शक्ति / सहचरी:' : 'Consort:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.consort}</Text>
                </Text>
              )}

              {deity.vahana && (
                <Text style={styles.cardSubText}>
                  {isHi ? 'दिव्य वाहन:' : 'Vahana:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.vahana}</Text>
                </Text>
              )}

              {deity.tatva && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {deity.tatva}
                </Text>
              )}

              {deity.keyMantras.length > 0 && (
                <View style={styles.mantraBox}>
                  <Text style={styles.mantraTitle}>
                    {deity.keyMantras[0].title}
                  </Text>
                  <Text style={styles.mantraDevanagari}>
                    {deity.keyMantras[0].devanagari}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooterAction}>
                <Text style={styles.cardFooterActionText}>
                  {isHi ? 'सम्पूर्ण दर्शन, मन्त्र एवं विवरण देखें →' : 'View Full Philosophy, Mantras & Temples →'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SECTION 3: VRAT KATHA */}
      {activeSection === 'vrat_katha' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isHi ? '📖 पावन व्रत कथाएँ एवं पारण विधि' : '📖 Sacred Vrat Kathas & Fasting Guides'}
          </Text>

          {/* Vrat Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {VRAT_KATHAS_DATABASE.map((vrat) => {
              const isSelected = vrat.id === selectedVratId;
              return (
                <TouchableOpacity
                  key={vrat.id}
                  testID={`vrat-pill-${vrat.id}`}
                  style={[styles.circuitPill, isSelected && styles.circuitPillActive]}
                  onPress={() => handleVratSelect(vrat.id)}
                >
                  <Text style={[styles.circuitText, isSelected && styles.circuitTextActive]}>
                    {isHi ? vrat.titleDevanagari : vrat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isHi ? activeVrat.titleDevanagari : activeVrat.title}
            </Text>
            <Text style={styles.cardSubText}>
              {isHi ? 'आराध्य देव:' : 'Deity:'}{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {isHi ? activeVrat.deityDevanagari : activeVrat.deity}
              </Text>
              {' • '}
              {isHi ? activeVrat.tithiDevanagari : activeVrat.tithi}
            </Text>

            <Text style={styles.cardDesc}>{activeVrat.significance}</Text>

            {/* Puja Steps */}
            <Text style={styles.subHeading}>
              {isHi ? '🙏 प्रामाणिक पूजा विधि (Vidhi Steps)' : '🙏 Sacred Puja Vidhi'}
            </Text>
            {activeVrat.pujaVidhiSteps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <Text style={styles.stepNum}>{idx + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            {/* Fasting Rules (Allowed & Prohibited) */}
            <View style={styles.rulesGrid}>
              <View style={styles.rulesColumnAllowed}>
                <Text style={styles.rulesHeadingAllowed}>
                  {isHi ? '✅ फलाहार में ग्राह्य' : '✅ Allowed Foods'}
                </Text>
                {activeVrat.fastingRules.allowed.map((item, idx) => (
                  <Text key={idx} style={styles.ruleItem}>• {item}</Text>
                ))}
              </View>

              <View style={styles.rulesColumnProhibited}>
                <Text style={styles.rulesHeadingProhibited}>
                  {isHi ? '⛔ पूर्णतः वर्जित' : '⛔ Prohibited'}
                </Text>
                {activeVrat.fastingRules.prohibited.map((item, idx) => (
                  <Text key={idx} style={styles.ruleItem}>• {item}</Text>
                ))}
              </View>
            </View>

            {/* Parana Timing Guidance */}
            <View style={styles.paranaBox}>
              <Text style={styles.paranaHeading}>
                {isHi ? '⏳ पारण समय व शास्त्र सम्मत विधि' : '⏳ Auspicious Parana Timing & Guidance'}
              </Text>
              <Text style={styles.paranaText}>{activeVrat.paranaTimingGuidance}</Text>
            </View>

            {/* Sacred Story */}
            <Text style={styles.subHeading}>
              {isHi ? '📜 पावन व्रत कथा' : '📜 Sacred Katha'}
            </Text>
            <View style={styles.kathaBox}>
              <Text style={styles.kathaText}>{activeVrat.sacredKathaText}</Text>
            </View>

            {/* Aarti */}
            {activeVrat.sacredAartiText ? (
              <>
                <Text style={styles.subHeading}>
                  {isHi ? '🪔 पावन आरती' : '🪔 Sacred Aarti'}
                </Text>
                <View style={styles.aartiBox}>
                  <Text style={styles.aartiText}>{activeVrat.sacredAartiText}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      )}
        </>
      )}

      {/* About & Shastra Foundation */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>sanatan.cc</Text>
        <Text style={styles.aboutSubtitle}>
          {isHi
            ? '१००% मुक्त-स्रोत एवं शास्त्रीय वैदिक खगोल विज्ञान (CC0 1.0 Universal)'
            : '100% Free & Open-Source Vedic Ephemeris (CC0 1.0 Universal)'}
        </Text>
        <Text style={styles.aboutDesc}>
          {isHi
            ? 'नासा JPL VSOP87 एवं Chapront ELP-2000 खगोलीय सिद्धांतों तथा मुहूर्तचिन्तामणि व निर्णयसिन्धु शास्त्रीय ग्रन्थों पर आधारित पूर्णतः ऑफलाइन गणना।'
            : 'Powered by NASA JPL VSOP87, Chapront ELP-2000 theories, and classical Muhurta Chintamani scriptures. Operates 100% offline with zero tabular approximations.'}
        </Text>

        <View style={styles.aboutActionRow}>
          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="information-circle" size={16} color="#ffffff" />
            <Text style={styles.modalBtnText}>
              {isHi ? 'विस्तृत परिचय एवं CC0 समर्पण' : 'About & CC0 License'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.githubBtn}
            onPress={() => Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc')}
          >
            <Ionicons name="logo-github" size={16} color="#ffffff" />
            <Text style={styles.githubBtnText}>GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deity Details Modal */}
      <Modal visible={!!selectedDeityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDeityModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.modalDeityName}>
                      {isHi ? selectedDeityModal.nameDevanagari : selectedDeityModal.name}
                    </Text>
                    <Text style={styles.modalDeitySubtitle}>
                      {isHi ? selectedDeityModal.subtitleDevanagari : selectedDeityModal.subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID="deity-modal-close-btn"
                    onPress={() => setSelectedDeityModal(null)}
                  >
                    <Ionicons name="close-circle" size={26} color="#71717a" />
                  </TouchableOpacity>
                </View>

                {/* Attributes */}
                <View style={styles.deityAttrGrid}>
                  {selectedDeityModal.consort && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'शक्ति:' : 'Consort:'} </Text>
                      {selectedDeityModal.consort}
                    </Text>
                  )}
                  {selectedDeityModal.vahana && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'वाहन:' : 'Vahana:'} </Text>
                      {selectedDeityModal.vahana}
                    </Text>
                  )}
                  {selectedDeityModal.abode && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'धाम:' : 'Abode:'} </Text>
                      {selectedDeityModal.abode}
                    </Text>
                  )}
                  {selectedDeityModal.sacredDay && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'प्रिय वार:' : 'Sacred Day:'} </Text>
                      {selectedDeityModal.sacredDay}
                    </Text>
                  )}
                  {selectedDeityModal.ayudhas && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'आयुध:' : 'Weapons:'} </Text>
                      {selectedDeityModal.ayudhas.join(', ')}
                    </Text>
                  )}
                </View>

                {/* Tatva */}
                <Text style={styles.subHeading}>{isHi ? 'दार्शनिक स्वरूप (Tatva)' : 'Spiritual Tatva'}</Text>
                <Text style={styles.tatvaText}>{selectedDeityModal.tatva}</Text>

                {/* Key Mantras */}
                <Text style={styles.subHeading}>{isHi ? 'महामन्त्र' : 'Sacred Mantras'}</Text>
                {selectedDeityModal.keyMantras.map((m, idx) => (
                  <View key={idx} style={styles.mantraCardFull}>
                    <Text style={styles.mantraTitle}>{m.title}</Text>
                    <Text style={styles.mantraDevanagariLarge}>{m.devanagari}</Text>
                    <Text style={styles.mantraTranslit}>{m.transliteration}</Text>
                    <Text style={styles.mantraMeaning}>
                      <Text style={{ fontWeight: 'bold' }}>{isHi ? 'अर्थ:' : 'Meaning:'} </Text>
                      {m.meaning}
                    </Text>
                  </View>
                ))}

                {/* Major Temples */}
                {selectedDeityModal.majorTemples.length > 0 && (
                  <>
                    <Text style={styles.subHeading}>{isHi ? 'प्रमुख तीर्थ व मन्दिर' : 'Major Temples'}</Text>
                    {selectedDeityModal.majorTemples.map((temple, idx) => (
                      <View key={idx} style={styles.templeItemMini}>
                        <Text style={styles.templeMiniName}>{temple.name}</Text>
                        <Text style={styles.templeMiniLoc}>📍 {temple.location}</Text>
                        <Text style={styles.templeMiniSig}>{temple.significance}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <SacredProfileEditorModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={handleSaveProfile}
        isHi={isHi}
      />

      <AppTourModal
        visible={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        isHi={isHi}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.dockClearance,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf5',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    marginBottom: Spacing.md,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    borderColor: '#fcd34d',
  },
  profileAvatarEmoji: {
    fontSize: 22,
  },
  profileGreeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
  },
  profileGotraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 2,
  },
  profileKuldeviText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  editProfilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
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
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
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
  featureSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  featureTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  featureTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  featureTabTextActive: {
    color: '#18181b',
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: Spacing.md,
  },
  circuitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  circuitPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginRight: 8,
  },
  circuitPillActive: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  circuitText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '600',
  },
  circuitTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    flex: 1,
    marginRight: 8,
  },
  cardLocation: {
    fontSize: 12,
    color: '#71717a',
  },
  cardSubText: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#52525b',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  deitySubtitle: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginBottom: 8,
  },
  badgeTradition: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeTraditionText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: 'bold',
  },
  darshanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  darshanText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '500',
  },
  mantraBox: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  mantraTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 4,
  },
  mantraDevanagari: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
    lineHeight: 20,
  },
  mantraDevanagariLarge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 24,
    marginVertical: 6,
  },
  mantraTranslit: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  mantraMeaning: {
    fontSize: 12,
    color: '#27272a',
    lineHeight: 18,
  },
  mantraCardFull: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  cardFooterAction: {
    marginTop: 6,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  cardFooterActionText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: 'bold',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 14,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
    backgroundColor: 'transparent',
    gap: 6,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  stepText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
    flex: 1,
  },
  rulesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
  rulesColumnAllowed: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 10,
  },
  rulesColumnProhibited: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
  },
  rulesHeadingAllowed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6,
  },
  rulesHeadingProhibited: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 6,
  },
  ruleItem: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 2,
  },
  paranaBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  paranaHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  paranaText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  kathaBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  kathaText: {
    fontSize: 12,
    color: '#27272a',
    lineHeight: 20,
  },
  aartiBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  aartiText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d97706',
  },
  aboutSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 4,
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  aboutActionRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  githubBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  modalDeityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  modalDeitySubtitle: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginTop: 2,
  },
  deityAttrGrid: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  attrRow: {
    fontSize: 12,
    color: '#27272a',
  },
  attrLabel: {
    fontWeight: 'bold',
    color: '#71717a',
  },
  tatvaText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
    marginBottom: 12,
  },
  templeItemMini: {
    backgroundColor: '#f4f4f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  templeMiniName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
  },
  templeMiniLoc: {
    fontSize: 11,
    color: '#71717a',
    marginVertical: 2,
  },
  templeMiniSig: {
    fontSize: 11,
    color: '#52525b',
  },
});
