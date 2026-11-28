import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  Switch,
  Linking,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  useColorScheme,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { Radius, Spacing } from '@/constants/Colors';
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
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll } from '@/src/hooks/useTourScroll';
import { COMFORT_TOUCH_TARGET, displayProfileName, getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { AppButton } from '@/src/components/ui/AppButton';
import { InlineFeedbackBanner } from '@/src/components/ui/ScreenStateView';

export default function SettingsScreen() {
  const { language, setLanguage, calendarSystem, setCalendarSystem } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactLayout = windowWidth < 380 || PixelRatio.getFontScale() > 1.25;
  const {
    openHelp,
    isInteractiveTourActive,
    isTryModeActive,
    resumeTour,
    savedProgressStep,
    totalSteps,
    needsWhatsNewOnly,
    startWhatsNewTour,
    updateTourRuntimeContext,
  } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/settings', scrollRef);

  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [userLocation, setUserLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    tone: 'success' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback(
    (message: string, tone: 'success' | 'info' | 'warning' = 'success') => {
      setStatusFeedback({ tone, message });
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setStatusFeedback(null);
        feedbackTimerRef.current = null;
      }, 2500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadUserProfile()
        .then((p) => {
          if (mounted) setUserProfile(p);
        })
        .catch(() => {});
      loadUserLocation()
        .then((loc) => {
          if (mounted && loc) setUserLocation(loc);
        })
        .catch(() => {});
      if (typeof Location.getForegroundPermissionsAsync === 'function') {
        Location.getForegroundPermissionsAsync()
          .then((res) => {
            if (!mounted) return;
            updateTourRuntimeContext({
              locationPermission: res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'unknown',
            });
          })
          .catch(() => {});
      }
      if (typeof Notifications.getPermissionsAsync === 'function') {
        Notifications.getPermissionsAsync()
          .then((res) => {
            if (!mounted) return;
            updateTourRuntimeContext({
              notificationPermission: res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'unknown',
            });
          })
          .catch(() => {});
      }
      return () => {
        mounted = false;
      };
    }, [updateTourRuntimeContext])
  );

  const handleSelectCity = async (city: GeoLocation) => {
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setIsCityModalVisible(false);
    setUserLocation(city);
    await saveUserLocation(city);
    showFeedback(
      isHi ? `पञ्चाङ्ग नगर बदला गया: ${city.name}` : `Panchang city updated: ${city.name}`
    );
    const panchang = calculatePanchang(new Date(), city);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, userProfile, plans, city.timezone, 7, city, language);
  };

  const handleGpsDetect = async () => {
    try {
      setIsLocating(true);
      triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        updateTourRuntimeContext({ locationPermission: 'denied' });
        Alert.alert(
          isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
          isHi
            ? 'सटीक सूर्योदय व पञ्चाङ्ग गणना हेतु कृपया स्थान अनुमति प्रदान करें या सूची से अपना शहर चुनें।'
            : 'Location permission is needed to detect sunrise & Rahu Kaal accurately — or select a city manually.',
          [
            { text: isHi ? 'ठीक है' : 'OK', style: 'cancel' },
            {
              text: isHi ? 'सेटिंग्स खोलें' : 'Open Settings',
              onPress: () => {
                Linking.openSettings().catch(() => {});
              },
            },
          ]
        );
        setIsLocating(false);
        return;
      }
      updateTourRuntimeContext({ locationPermission: 'granted' });

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
      showFeedback(
        isHi ? 'जीपीएस द्वारा आपका वर्तमान स्थान सहेजा गया' : 'Current GPS location updated'
      );

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
    showFeedback(isHi ? 'धार्मिक प्रोफ़ाइल सहेजी गई' : 'Sacred profile updated');
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, userLocation.timezone, 7, userLocation, language);
  };

  const handleLanguageSelect = async (lang: 'hi' | 'en') => {
    if (lang === language) return;
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setLanguage(lang);
    showFeedback(
      lang === 'hi' ? 'ऍप भाषा हिंदी में बदली गई' : 'App language switched to English'
    );
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, userProfile, plans, userLocation.timezone, 7, userLocation, lang);
  };

  const handleCalendarSystemSelect = (sys: 'purnimanta' | 'amanta') => {
    if (sys === calendarSystem) return;
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    setCalendarSystem(sys);
    showFeedback(
      sys === 'purnimanta'
        ? (isHi ? 'पूर्णिमान्त चान्द्र मास पद्धति लागू' : 'Switched to Purnimanta calendar')
        : (isHi ? 'अमान्त चान्द्र मास पद्धति लागू' : 'Switched to Amanta calendar')
    );
  };

  const handleToggleMasterNotifications = async (val: boolean) => {
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    const updated = {
      ...userProfile,
      notificationsEnabled: val,
    };
    setUserProfile(updated);
    await saveUserProfile(updated);
    showFeedback(
      val
        ? (isHi ? 'दैनिक मुहूर्त अलर्ट सक्रिय किए गए' : 'Daily Muhurta alerts enabled')
        : (isHi ? 'दैनिक मुहूर्त अलर्ट बंद किए गए' : 'Daily Muhurta alerts paused'),
      val ? 'success' : 'info'
    );
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, userLocation.timezone, 7, userLocation, language);
  };

  const handleToggleNotifCategory = async (
    category: keyof UserNotificationPreferences,
    val: boolean
  ) => {
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
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
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    const updated = { ...userProfile, audioEnabled: val };
    setUserProfile(updated);
    await saveUserProfile(updated);
    showFeedback(
      val
        ? (isHi ? 'मन्दिर घंटी एवं शंख ध्वनि चालू की गई' : 'Temple bell & Shankh audio enabled')
        : (isHi ? 'मन्दिर ध्वनि बंद की गई' : 'Sacred audio muted'),
      val ? 'success' : 'info'
    );
  };

  const handleToggleHaptics = async (val: boolean) => {
    if (val) triggerHaptic('tap', true).catch(() => {});
    const updated = { ...userProfile, hapticsEnabled: val };
    setUserProfile(updated);
    await saveUserProfile(updated);
    showFeedback(
      val
        ? (isHi ? 'स्पर्श कम्पन (Haptics) चालू' : 'Tactile haptics enabled')
        : (isHi ? 'स्पर्श कम्पन (Haptics) बंद' : 'Tactile haptics disabled'),
      val ? 'success' : 'info'
    );
  };

  const handleSendTestNotification = async () => {
    triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    await presentTestNotification(
      isHi ? '🌟 अभिजित मुहूर्त सक्रिय है (महाशुभ विजय काल)' : '🌟 Abhijit Muhurta is Active Now',
      isHi
        ? 'भगवान विष्णु का परम प्रिय काल • समस्त शुभ कार्य, महत्वपूर्ण निर्णय व आरम्भ हेतु सर्वोत्तम • 🎯 आपके नियोजित कार्य: नया अनुबंध हस्ताक्षर'
        : 'Auspicious hour of Lord Vishnu • Supreme for vital launches & agreements • 🎯 Your tasks: Sign agreement'
    );
    showFeedback(
      isHi ? 'परीक्षण सूचना भेजी गई 🔔' : 'Test notification dispatched'
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
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onTourScroll}
      onMomentumScrollEnd={onTourMomentumScrollEnd}
      onScrollEndDrag={onTourScrollEndDrag}
      scrollEventThrottle={16}
      scrollEnabled={!isInteractiveTourActive || isTryModeActive}
    >
      {/* 1. Devotee Sacred Profile Banner */}
      <TourTarget targetId="settings-edit-profile-btn" borderRadius={18}>
        <View
          style={[
            styles.profileBanner,
            isDark && { backgroundColor: '#251d0e', borderColor: theme.primaryBorder },
          ]}
        >
          <View style={[styles.profileAvatarBox, isDark && { backgroundColor: theme.card }]}>
            <Text style={styles.profileAvatarEmoji}>🕉️</Text>
          </View>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={[styles.profileGreeting, isDark && { color: theme.text }]}>
              {isHi ? 'श्री' : 'Sri'} {displayProfileName(userProfile.name, isHi)} {isHi ? 'जी' : ''}
            </Text>
            <Text style={[styles.profileGotraText, isDark && { color: theme.textSecondary }]}>
              {userProfile.gotra ? `${isHi ? 'गोत्र:' : 'Gotra:'} ${userProfile.gotra}` : ''} • {userProfile.ishtaDevata}
            </Text>
            {userProfile.kuldeviOrDevata ? (
              <Text style={[styles.profileKuldeviText, isDark && { color: theme.textSecondary }]}>
                {isHi ? 'कुलदेवी:' : 'Family Deity:'} {userProfile.kuldeviOrDevata}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              testID="settings-edit-profile-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'प्रोफाइल बदलें' : 'Edit profile'}
              style={[
                styles.editProfilePill,
                { minHeight: MIN_TOUCH_TARGET },
                isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
              ]}
              onPress={() => {
                triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                setIsProfileModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={17} color={theme.primary} />
              <Text style={[styles.editProfilePillText, isDark && { color: theme.primary }]}>
                {isHi ? 'बदलें' : 'Edit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="settings-help-btn"
              accessibilityRole="button"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={[
                styles.helpBtn,
                { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET },
                isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
              ]}
              onPress={() => openHelp('settings')}
              accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TourTarget>

      {statusFeedback ? (
        <InlineFeedbackBanner
          testID="settings-status-banner"
          tone={statusFeedback.tone}
          message={statusFeedback.message}
        />
      ) : null}

      {/* 2. General Preferences & Regional System */}
      <View
        style={[
          styles.settingsCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardHeader, isDark && { color: theme.text }]}>
          {isHi ? '⚙️ ऍप सेटिंग्स एवं प्राथमिकताएं' : '⚙️ App Preferences & System'}
        </Text>

        {/* Language Toggle */}
        <View style={[styles.settingRow, isCompactLayout && styles.settingRowStacked, isDark && { borderBottomColor: theme.border }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: isCompactLayout ? 0 : 10 }}>
            <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
              {isHi ? 'भाषा' : 'Language'}
            </Text>
            <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
              {isHi ? 'सम्पूर्ण ऍप की भाषा' : 'Display language'}
            </Text>
          </View>

          <View style={[styles.toggleGroup, isCompactLayout && { alignSelf: 'flex-start' }, isDark && { backgroundColor: theme.cardMuted }]}>
            <TouchableOpacity
              testID="lang-toggle-hi"
              accessibilityRole="button"
              accessibilityLabel="हिन्दी"
              accessibilityState={{ selected: language === 'hi' }}
              style={[
                styles.toggleBtn,
                language === 'hi' && [styles.toggleBtnActive, isDark && { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleLanguageSelect('hi')}
            >
              <Text
                style={[
                  styles.toggleText,
                  isDark && { color: theme.textSecondary },
                  language === 'hi' && styles.toggleTextActive,
                ]}
              >
                हिन्दी
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="lang-toggle-en"
              accessibilityRole="button"
              accessibilityLabel="English"
              accessibilityState={{ selected: language === 'en' }}
              style={[
                styles.toggleBtn,
                language === 'en' && [styles.toggleBtnActive, isDark && { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleLanguageSelect('en')}
            >
              <Text
                style={[
                  styles.toggleText,
                  isDark && { color: theme.textSecondary },
                  language === 'en' && styles.toggleTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Regional Calendar System */}
        <View style={[styles.settingRow, isCompactLayout && styles.settingRowStacked, isDark && { borderBottomColor: theme.border }, { borderBottomWidth: 0 }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: isCompactLayout ? 0 : 10 }}>
            <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
              {isHi ? 'चान्द्र मास पद्धति' : 'Lunar Calendar System'}
            </Text>
            <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
              {isHi
                ? 'पूर्णिमान्त (उत्तर भारत) या अमान्त (दक्षिण व पश्चिम भारत)'
                : 'Purnimanta (North) or Amanta (West/South)'}
            </Text>
          </View>

          <View style={[styles.toggleGroup, isCompactLayout && { alignSelf: 'flex-start' }, isDark && { backgroundColor: theme.cardMuted }]}>
            <TouchableOpacity
              testID="cal-toggle-purnimanta"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'पूर्णिमान्त' : 'Purnimanta'}
              accessibilityState={{ selected: calendarSystem === 'purnimanta' }}
              style={[
                styles.toggleBtn,
                calendarSystem === 'purnimanta' && [styles.toggleBtnActive, isDark && { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleCalendarSystemSelect('purnimanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  isDark && { color: theme.textSecondary },
                  calendarSystem === 'purnimanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'पूर्णिमान्त' : 'Purnimanta'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="cal-toggle-amanta"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'अमान्त' : 'Amanta'}
              accessibilityState={{ selected: calendarSystem === 'amanta' }}
              style={[
                styles.toggleBtn,
                calendarSystem === 'amanta' && [styles.toggleBtnActive, isDark && { backgroundColor: theme.primary }],
              ]}
              onPress={() => handleCalendarSystemSelect('amanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  isDark && { color: theme.textSecondary },
                  calendarSystem === 'amanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'अमान्त' : 'Amanta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prime Meridian & Location Selection */}
        <TourTarget targetId="settings-meridian-btn" borderRadius={14}>
          <TouchableOpacity
            testID="settings-meridian-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'प्रधान देशान्तर अथवा नगर बदलें' : 'Change Prime Meridian and City'}
            style={[styles.settingRow, { minHeight: MIN_TOUCH_TARGET }, isDark && { borderBottomColor: theme.border }]}
            onPress={() => {
              triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
              setIsCityModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
              <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                {isHi ? 'प्रधान देशान्तर एवं नगर (Location)' : 'Prime Meridian & City Location'}
              </Text>
              <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                📍 {userLocation.name} ({userLocation.latitude.toFixed(2)}°, {userLocation.longitude.toFixed(2)}°)
              </Text>
            </View>
            <View
              style={[
                styles.meridianPill,
                isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
              ]}
            >
              <Ionicons name="compass-outline" size={16} color={theme.primary} />
              <Text style={[styles.meridianPillText, isDark && { color: theme.primary }]}>
                {isHi ? 'बदलें' : 'Change'}
              </Text>
            </View>
          </TouchableOpacity>
        </TourTarget>

        {/* Resume Tour (if interrupted mid-way) */}
        {savedProgressStep > 0 && savedProgressStep < totalSteps && (
          <TouchableOpacity
            testID="settings-resume-tour-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'अधूरा लाइव टूर जारी रखें' : 'Resume interrupted tour'}
            style={[
              styles.settingRow,
              { minHeight: MIN_TOUCH_TARGET },
              isDark && { borderBottomColor: theme.border },
            ]}
            onPress={() => resumeTour()}
            activeOpacity={0.7}
          >
            <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
              <Text style={[styles.settingTitle, { color: theme.primary }]}>
                {isHi
                  ? `▶️ अधूरा टूर जारी रखें (चरण ${savedProgressStep + 1}/${totalSteps})`
                  : `▶️ Resume Interrupted Tour (Step ${savedProgressStep + 1}/${totalSteps})`}
              </Text>
              <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                {isHi ? 'पिछली बार छोड़े गए चरण से आगे बढ़ें' : 'Pick up right where you paused'}
              </Text>
            </View>
            <Ionicons name="play-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}

        {/* New Section Highlight (Version-Aware Update) */}
        {needsWhatsNewOnly && (
          <TouchableOpacity
            testID="settings-whats-new-tour-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'नया प्रोजेक्ट हब टूर देखें' : 'Tour new Project Hub feature'}
            style={[
              styles.settingRow,
              { minHeight: MIN_TOUCH_TARGET },
              isDark && { borderBottomColor: theme.border },
            ]}
            onPress={() => startWhatsNewTour()}
            activeOpacity={0.7}
          >
            <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
              <Text style={[styles.settingTitle, { color: theme.primary }]}>
                {isHi ? '🆕 नया अपडेट टूर: प्रोजेक्ट हब' : "🆕 What's New Tour: Project Hub"}
              </Text>
              <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                {isHi ? 'केवल नए जुड़े प्रोजेक्ट व सुझाव टैब को समझें' : 'Explore just the newly added Community tab'}
              </Text>
            </View>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}

        {/* Replay App Tour */}
        <TourTarget targetId="settings-replay-tour-btn" borderRadius={14}>
          <TouchableOpacity
            testID="settings-replay-tour-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'ऐप टूर दोबारा देखें' : 'Replay App Walkthrough Tour'}
            style={[
              styles.settingRow,
              {
                borderBottomWidth: 0,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: isDark ? theme.border : '#f4f4f5',
                minHeight: MIN_TOUCH_TARGET,
              },
            ]}
            onPress={() => {
              triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
              setIsTourModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
              <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                {isHi ? '🧭 ऐप का परिचय / पुनः टूर देखें' : '🧭 Take App Walkthrough Tour'}
              </Text>
              <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                {isHi
                  ? 'सनातन दिनचर्या, मुहूर्त प्लानर व सभी सुविधाओं का संक्षिप्त गाइड'
                  : 'Interactive guide to Dinacharya, Muhurta Planner & all features'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        </TourTarget>
      </View>

      {/* 3. Notification & Cosmic Alerts Section */}
      <View
        style={[
          styles.settingsCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <TourTarget targetId="notif-master-switch" borderRadius={16}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.cardHeaderTitle, isDark && { color: theme.text }]}>
                {isHi ? '🔔 सूचनाएं एवं मुहूर्त अलर्ट' : '🔔 Notifications & Muhurta Alerts'}
              </Text>
              <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                {isHi
                  ? 'मुहूर्त परिवर्तन, शुभ चौघड़िया एवं दिनचर्या कार्यों की सूचना'
                  : 'Phone panel alerts for active Muhurtas & scheduled To-Dos'}
              </Text>
            </View>
            <Switch
              testID="notif-master-switch"
              accessibilityLabel={isHi ? 'मुख्य सूचना स्विच' : 'Master Notifications Switch'}
              value={userProfile.notificationsEnabled}
              onValueChange={handleToggleMasterNotifications}
              trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
              thumbColor={userProfile.notificationsEnabled ? '#15803d' : '#f4f4f5'}
            />
          </View>
        </TourTarget>

        {userProfile.notificationsEnabled && (
          <View style={{ backgroundColor: 'transparent', marginTop: 10 }}>
            <Text style={[styles.notifSubHeading, isDark && { color: theme.primary }]}>
              {isHi ? 'दैनिक समय एवं दिनचर्या अलर्ट' : 'Daily Schedule & Routine Alerts'}
            </Text>

            {/* Abhijit Muhurta Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🌟 अभिजित मुहूर्त अलर्ट' : '🌟 Abhijit Muhurta Alert'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi
                    ? 'महाशुभ विजय काल आरम्भ होने पर एवं उस समय के कार्यों की सूचना'
                    : 'Supreme victory hour starting alert with planned To-Do tasks'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-abhijit"
                accessibilityLabel={isHi ? 'अभिजित मुहूर्त अलर्ट' : 'Abhijit Muhurta Alert'}
                value={userProfile.notifications.abhijitAlert}
                onValueChange={(val) => handleToggleNotifCategory('abhijitAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.abhijitAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Day Planner To-Do Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '📝 दिनचर्या कार्य (To-Do) अलर्ट' : '📝 Day Planner To-Dos Alert'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi
                    ? 'प्रत्येक मुहूर्त स्लॉट के प्रारम्भ में आपके जोड़े गए कार्यों की सूचना'
                    : 'Shows your planned tasks on phone panel when slot starts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-todo"
                accessibilityLabel={isHi ? 'दिनचर्या कार्य अलर्ट' : 'Day Planner To-Dos Alert'}
                value={userProfile.notifications.todoTasksAlert}
                onValueChange={(val) => handleToggleNotifCategory('todoTasksAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.todoTasksAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Brahma Muhurta Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🌅 ब्रह्म मुहूर्त जागरण' : '🌅 Brahma Muhurta Awakening'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi ? 'अमृत वेला (प्रातः ४:३०) ध्यान व साधना सूचना' : 'Pre-dawn japa & meditation alert'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-brahma"
                accessibilityLabel={isHi ? 'ब्रह्म मुहूर्त जागरण अलर्ट' : 'Brahma Muhurta Alert'}
                value={userProfile.notifications.brahmaMuhurtaAlert}
                onValueChange={(val) => handleToggleNotifCategory('brahmaMuhurtaAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.brahmaMuhurtaAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Rahu Kaal Warning */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '⚠️ राहु काल पूर्व-चेतावनी' : '⚠️ Rahu Kaal Pre-Warning'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi
                    ? 'राहु काल आरम्भ होने से १० मिनट पूर्व सावधानी अलर्ट'
                    : '10 min caution warning before inauspicious period starts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-rahu"
                accessibilityLabel={isHi ? 'राहु काल चेतावनी' : 'Rahu Kaal Pre-Warning'}
                value={userProfile.notifications.rahuKaalAlert}
                onValueChange={(val) => handleToggleNotifCategory('rahuKaalAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
                thumbColor={userProfile.notifications.rahuKaalAlert ? '#c2410c' : '#f4f4f5'}
              />
            </View>

            {/* Shubh Choghadiya Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '✨ अमृत व शुभ चौघड़िया' : '✨ Amrit & Shubh Choghadiya'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi
                    ? 'दिन के सर्वोत्तम चौघड़िया काल की समयबद्ध सूचना'
                    : 'Auspicious Choghadiya window entry alerts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-choghadiya"
                accessibilityLabel={isHi ? 'शुभ चौघड़िया अलर्ट' : 'Shubh Choghadiya Alert'}
                value={userProfile.notifications.choghadiyaAlert}
                onValueChange={(val) => handleToggleNotifCategory('choghadiyaAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.choghadiyaAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Sandhya Deepam Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🪔 सायं गोधूलि दीप प्रज्वलन' : '🪔 Godhuli Evening Deepam'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textSecondary }]}>
                  {isHi ? 'सूर्यास्त वेला में दीप व हनुमान चालीसा स्मरण' : 'Sunset oil lamp & Hanuman Chalisa reminder'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-deepam"
                accessibilityLabel={isHi ? 'संध्या दीपम अलर्ट' : 'Evening Deepam Alert'}
                value={userProfile.notifications.sandhyaDeepamAlert}
                onValueChange={(val) => handleToggleNotifCategory('sandhyaDeepamAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#fef08a' }}
                thumbColor={userProfile.notifications.sandhyaDeepamAlert ? '#ca8a04' : '#f4f4f5'}
              />
            </View>

            <Text style={[styles.notifSubHeading, { marginTop: 14 }, isDark && { color: theme.primary }]}>
              {isHi ? 'व्रत, तिथि एवं चन्द्र दर्शन अलर्ट' : 'Fasting & Moon Alerts'}
            </Text>

            {/* Ekadashi & Vrat Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🌾 एकादशी व प्रमुख व्रत स्मरण' : '🌾 Ekadashi & Fasting Alerts'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'एकादशी व्रत की पूर्व संध्या सूचना' : 'Eve alerts for sacred Ekadashi days'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-ekadashi"
                accessibilityLabel={isHi ? 'एकादशी व्रत अलर्ट' : 'Ekadashi Vrat Alert'}
                value={userProfile.notifications.ekadashiAlert}
                onValueChange={(val) => handleToggleNotifCategory('ekadashiAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.ekadashiAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Pradosh Vrat Alert */}
            <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🙏 प्रदोष व त्रयोदशी व्रत अलर्ट' : '🙏 Pradosh Vrat Alert'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'प्रदोष शाम शिव पूजन हेतु स्मरण' : 'Pradosh Trayodashi evening reminder'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-pradosh"
                accessibilityLabel={isHi ? 'प्रदोष व्रत अलर्ट' : 'Pradosh Vrat Alert'}
                value={userProfile.notifications.pradoshAlert}
                onValueChange={(val) => handleToggleNotifCategory('pradoshAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.pradoshAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Chandrodaya Alert */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
                <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🌕 चन्द्रोदय व पूर्णिमा अर्घ्य अलर्ट' : '🌕 Chandrodaya & Moonrise Alert'}
                </Text>
                <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'संकष्टी चतुर्थी व पूर्णिमा चन्द्र अर्घ्य सूचना' : 'Moonrise timing alerts for sacred fasts'}
                </Text>
              </View>
              <Switch
                testID="notif-toggle-chandrodaya"
                accessibilityLabel={isHi ? 'चन्द्रोदय अलर्ट' : 'Chandrodaya Alert'}
                value={userProfile.notifications.chandrodayaAlert}
                onValueChange={(val) => handleToggleNotifCategory('chandrodayaAlert', val)}
                trackColor={{ false: '#e4e4e7', true: '#bbf7d0' }}
                thumbColor={userProfile.notifications.chandrodayaAlert ? '#15803d' : '#f4f4f5'}
              />
            </View>

            {/* Instant Test Notification Button */}
            <TouchableOpacity
              testID="notif-send-test-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'टेस्ट नोटिफिकेशन भेजें' : 'Send Test Notification'}
              style={[
                styles.testNotificationBtn,
                { minHeight: COMFORT_TOUCH_TARGET },
                isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder },
              ]}
              onPress={handleSendTestNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={16} color={isDark ? theme.successText : '#15803d'} />
              <Text style={[styles.testNotificationBtnText, isDark && { color: theme.successText }]}>
                {isHi
                  ? '📲 टेस्ट नोटिफिकेशन भेजें (अभिजित व To-Do)'
                  : '📲 Send Test Notification (Abhijit & To-Do)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Audio & Haptics Preferences */}
      <View
        style={[
          styles.settingsCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardHeader, isDark && { color: theme.text }]}>
          {isHi ? '🔔 ध्वनि एवं स्पर्श (Audio & Haptics)' : '🔔 Audio & Tactile Haptics'}
        </Text>

        <View style={[styles.settingRow, isDark && { borderBottomColor: theme.border }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
              {isHi ? 'मन्दिर घंटी एवं शंख ध्वनि' : 'Mandir Bell & Shankh Sound'}
            </Text>
            <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
              {isHi ? 'प्रामाणिक पीतल घंटी की ध्वनि तरंगे' : 'Real acoustic brass chime effects'}
            </Text>
          </View>
          <Switch
            testID="settings-toggle-audio"
            accessibilityLabel={isHi ? 'मन्दिर घंटी ध्वनि' : 'Audio toggle'}
            value={userProfile.audioEnabled}
            onValueChange={handleToggleAudio}
            trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
            thumbColor={userProfile.audioEnabled ? '#d97706' : '#f4f4f5'}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={[styles.settingTitle, isDark && { color: theme.text }]}>
              {isHi ? 'जप माला स्पर्श कम्पन (Haptics)' : 'Tactile Haptic Feedback'}
            </Text>
            <Text style={[styles.settingDesc, isDark && { color: theme.textMuted }]}>
              {isHi ? '१०८ मनके व गुरु मनके पर सूक्ष्म कम्पन' : 'Gentle physical pulse on japa mala beads'}
            </Text>
          </View>
          <Switch
            testID="settings-toggle-haptics"
            accessibilityLabel={isHi ? 'स्पर्श कम्पन स्विच' : 'Haptics toggle'}
            value={userProfile.hapticsEnabled}
            onValueChange={handleToggleHaptics}
            trackColor={{ false: '#e4e4e7', true: '#fed7aa' }}
            thumbColor={userProfile.hapticsEnabled ? '#d97706' : '#f4f4f5'}
          />
        </View>
      </View>

      {/* 5. 100% Offline Autonomy Guarantee Card */}
      <View
        testID="settings-offline-card"
        style={[
          styles.offlineCard,
          isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder },
        ]}
      >
        <View style={styles.offlineHeaderRow}>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>⚡ 100% OFFLINE</Text>
          </View>
          <Text style={[styles.offlineHeaderTitle, isDark && { color: theme.text }]}>
            {isHi ? 'पूर्णतः ऑफ़लाइन कार्य प्रणाली' : 'Full Offline Autonomy'}
          </Text>
        </View>

        <Text style={[styles.offlineDesc, isDark && { color: theme.textSecondary }]}>
          {isHi
            ? 'यह सम्पूर्ण ऍप एवं इसकी सभी सूचनाएं बिना इंटरनेट के १००% ऑफ़लाइन कार्य करती हैं। नासा एवं वैदिक सिद्धान्तों पर आधारित खगोलीय पञ्चाङ्ग आपके फोन में ही गणितीय रूप से संगणित होता है।'
            : 'Zero internet required. All astronomical calculations, ephemeris, festivals, and alerts run locally on your phone hardware.'}
        </Text>

        <View style={styles.offlineGrid}>
          <View style={[styles.offlineGridItem, isDark && { backgroundColor: theme.card, borderColor: theme.successBorder }]}>
            <Ionicons name="airplane" size={16} color={isDark ? theme.successText : '#15803d'} />
            <Text style={[styles.offlineGridText, isDark && { color: theme.successText }]}>
              {isHi ? 'एयरप्लेन मोड में सक्रिय' : 'Works in Airplane Mode'}
            </Text>
          </View>
          <View style={[styles.offlineGridItem, isDark && { backgroundColor: theme.card, borderColor: theme.successBorder }]}>
            <Ionicons name="alarm-outline" size={16} color={isDark ? theme.successText : '#15803d'} />
            <Text style={[styles.offlineGridText, isDark && { color: theme.successText }]}>
              {isHi ? '७ दिन की पूर्व-सूचनाएं' : '7 Days Pre-Scheduled Alarms'}
            </Text>
          </View>
          <View style={[styles.offlineGridItem, isDark && { backgroundColor: theme.card, borderColor: theme.successBorder }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={isDark ? theme.successText : '#15803d'} />
            <Text style={[styles.offlineGridText, isDark && { color: theme.successText }]}>
              {isHi ? 'शून्य डेटा / गोपनीयता' : 'Zero Data / Zero Tracking'}
            </Text>
          </View>
          <View style={[styles.offlineGridItem, isDark && { backgroundColor: theme.card, borderColor: theme.successBorder }]}>
            <Ionicons name="hardware-chip-outline" size={16} color={isDark ? theme.successText : '#15803d'} />
            <Text style={[styles.offlineGridText, isDark && { color: theme.successText }]}>
              {isHi ? 'हार्डवेयर अलार्म क्लॉक' : 'Hardware Clock Trigger'}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. About & Mission Card */}
      <View
        style={[
          styles.aboutCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.aboutTitle, isDark && { color: theme.text }]}>
          {isHi ? 'सनातन दिनचर्या एवं पञ्चाङ्ग' : 'Sanatan Dinacharya & Panchang'}
        </Text>
        <Text style={[styles.aboutDesc, isDark && { color: theme.textMuted }]}>
          {isHi
            ? 'शुद्ध गणितीय खगोलशास्त्र, नासा जेपीएल एफिमेरिस एवं महर्षि वराहमिहिर के सिद्धान्तों पर आधारित पूर्णतः नि:शुल्क एवं विज्ञापन-मुक्त सनातनी सेवा।'
            : 'Pure mathematical ephemeris with zero approximations, computed from NASA JPL & Jean Meeus first principles. 100% Free & Ad-free.'}
        </Text>
        <Text style={[styles.aboutVersion, isDark && { color: theme.textSubtle }]}>
          Version 1.0.0 • 100% Free Dharma
        </Text>
      </View>

      {/* 7. Feedback & Contact Card */}
      <View
        testID="settings-feedback-card"
        style={[
          styles.feedbackCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
        ]}
      >
        <View style={styles.feedbackHeaderRow}>
          <Ionicons name="chatbubbles-outline" size={18} color={theme.primary} />
          <Text style={[styles.feedbackHeaderTitle, isDark && { color: theme.text }]}>
            {isHi ? 'प्रतिक्रिया एवं सुझाव (Feedback & Contact)' : 'Feedback & Contact'}
          </Text>
        </View>

        <Text style={[styles.feedbackDesc, isDark && { color: theme.textSecondary }]}>
          {isHi
            ? 'सनातन दिनचर्या को और उत्तम बनाने हेतु आपके विचार, त्रुटि निवारण अथवा सुझाव सादर आमंत्रित हैं:'
            : 'We welcome your thoughts, suggestions, and feedback to improve this sacred seva:'}
        </Text>

        <TouchableOpacity
          testID="feedback-link-sanatan"
          style={[
            styles.feedbackLinkBtn,
            { minHeight: MIN_TOUCH_TARGET },
            isDark && { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => handleOpenFeedback('https://sanatan.cc/contact')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Sanatan Portal Feedback"
        >
          <View style={[styles.feedbackLinkIconBox, isDark && { backgroundColor: theme.cardMuted }]}>
            <Ionicons name="globe-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.feedbackLinkTextBox}>
            <Text style={[styles.feedbackLinkTitle, isDark && { color: theme.text }]}>
              {isHi ? 'सनातन सम्पर्क एवं सुझाव' : 'Sanatan Portal Feedback'}
            </Text>
            <Text style={styles.feedbackLinkUrl}>https://sanatan.cc/contact</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#a1a1aa" />
        </TouchableOpacity>

        <TouchableOpacity
          testID="feedback-link-developer"
          style={[
            styles.feedbackLinkBtn,
            { minHeight: MIN_TOUCH_TARGET },
            isDark && { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => handleOpenFeedback('https://dhirajnavghare.com/contact')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Developer Contact"
        >
          <View style={[styles.feedbackLinkIconBox, isDark && { backgroundColor: theme.cardMuted }]}>
            <Ionicons name="person-circle-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.feedbackLinkTextBox}>
            <Text style={[styles.feedbackLinkTitle, isDark && { color: theme.text }]}>
              {isHi ? 'डेवलपर सम्पर्क (Dhiraj Navghare)' : 'Developer Contact (Dhiraj Navghare)'}
            </Text>
            <Text style={styles.feedbackLinkUrl}>https://dhirajnavghare.com/contact</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#a1a1aa" />
        </TouchableOpacity>

        <TouchableOpacity
          testID="feedback-link-privacy"
          style={[
            styles.feedbackLinkBtn,
            { minHeight: MIN_TOUCH_TARGET },
            isDark && { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => handleOpenFeedback('https://sanatan.cc/privacy')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
        >
          <View style={[styles.feedbackLinkIconBox, isDark && { backgroundColor: theme.cardMuted }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? theme.successText : '#15803d'} />
          </View>
          <View style={styles.feedbackLinkTextBox}>
            <Text style={[styles.feedbackLinkTitle, isDark && { color: theme.text }]}>
              {isHi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy & Data Safety'}
            </Text>
            <Text style={styles.feedbackLinkUrl}>https://sanatan.cc/privacy</Text>
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
      <Modal
        visible={isCityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="compass" size={20} color={theme.primary} />
                  <Text style={[styles.modalTitle, isDark && { color: theme.text }]}>
                    {isHi ? 'प्रधान देशान्तर अथवा नगर चुनें' : 'Select Prime Meridian or City'}
                  </Text>
                </View>
                <Text style={[styles.modalSubtitle, isDark && { color: theme.textMuted }]}>
                  {isHi
                    ? 'स्थानिक सूर्योदय, सूर्यास्त व पञ्चाङ्ग गणना हेतु'
                    : 'Astronomical coordinates for local sunrise & muhurta'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCityModalVisible(false)}
                testID="city-modal-close-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'शहर सूची बंद करें' : 'Close city selector'}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="close-circle" size={30} color={isDark ? theme.textSecondary : '#52525b'} />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detection Bar */}
            <TouchableOpacity
              testID="settings-gps-detect-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'वर्तमान जीपीएस स्थान स्वतः पता करें' : 'Auto-detect Current GPS Location'}
              style={[styles.gpsBanner, { minHeight: COMFORT_TOUCH_TARGET }]}
              onPress={handleGpsDetect}
              disabled={isLocating}
              activeOpacity={0.7}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#ffffff" />
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
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.cityRow,
                      isDark && { backgroundColor: theme.card, borderColor: theme.border },
                      isSelected && [styles.cityRowSelected, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primary }],
                    ]}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text
                          style={[
                            styles.cityName,
                            isDark && { color: theme.text },
                            isSelected && [styles.cityNameSelected, isDark && { color: theme.primary }],
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isPrimeMeridian && (
                          <View style={[styles.meridianTag, isDark && { backgroundColor: theme.primaryBg }]}>
                            <Text style={[styles.meridianTagText, isDark && { color: theme.primary }]}>
                              0° MERIDIAN
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.cityCoords, isDark && { color: theme.textSecondary }]}>
                        {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}° • {item.timezone}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <AppButton
              testID="city-modal-done-btn"
              label={isHi ? 'बंद करें' : 'Close'}
              variant="outline"
              onPress={() => setIsCityModalVisible(false)}
              style={{ marginTop: 12 }}
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
    flexWrap: 'wrap',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  profileAvatarEmoji: {
    fontSize: 24,
  },
  profileGreeting: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400e',
  },
  profileGotraText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 2,
  },
  profileKuldeviText: {
    fontSize: 12.5,
    color: '#92400e',
    marginTop: 2,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  editProfilePillText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#b45309',
  },
  helpBtn: {
    padding: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
  },
  notifSubHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
    marginTop: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: 'transparent',
    gap: 10,
  },
  settingRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
    lineHeight: 21,
  },
  settingDesc: {
    fontSize: 13.5,
    color: '#52525b',
    marginTop: 3,
    lineHeight: 19,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.md,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: '#18181b',
  },
  toggleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  testNotificationBtn: {
    marginTop: 14,
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testNotificationBtnText: {
    color: '#15803d',
    fontSize: 14.5,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 6,
  },
  aboutDesc: {
    fontSize: 14,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 10,
  },
  aboutVersion: {
    fontSize: 13,
    color: '#52525b',
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  offlineBadge: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offlineBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  offlineHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#166534',
  },
  offlineDesc: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 21,
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
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#dcfce7',
    flexGrow: 1,
  },
  offlineGridText: {
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
  },
  feedbackDesc: {
    fontSize: 14,
    color: '#52525b',
    lineHeight: 21,
    marginBottom: 12,
  },
  feedbackLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  feedbackLinkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 14.5,
    fontWeight: '700',
    color: '#92400e',
  },
  feedbackLinkUrl: {
    fontSize: 12.5,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  meridianPillText: {
    fontSize: 13,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 13.5,
    color: '#52525b',
    marginTop: 3,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  gpsBannerText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  cityRowSelected: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
  },
  cityName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#18181b',
  },
  cityNameSelected: {
    color: '#b45309',
    fontWeight: '800',
  },
  cityCoords: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 3,
  },
  meridianTag: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meridianTagText: {
    color: '#92400e',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
