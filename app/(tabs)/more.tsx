import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { TEMPLES_DATABASE } from '@/src/core/temples/data';
import { TempleRecord } from '@/src/core/temples/types';
import { DEITIES_DATABASE } from '@/src/core/devatas/data';
import { DeityRecord } from '@/src/core/devatas/types';
import { VRAT_KATHAS_DATABASE } from '@/src/core/vrat-katha/data';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import {
  cleanBilingualTitle,
  cleanDarshanTimings,
  cleanTempleSignificance,
} from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Radius, Spacing } from '@/constants/Colors';
import {
  loadUserProfile,
  loadUserLocation,
  saveUserProfile,
  UserSacredProfile,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
import { SacredProfileEditorModal } from '@/src/components/SacredProfileEditorModal';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { scheduleDailySacredReminders } from '@/src/services/sacredNotifications';
import { calculatePanchang, GeoLocation, PRESET_CITIES } from '@/src/core/panchang';
import { getDayPlans } from '@/src/services/dayplanner';
import { getDateKey } from '@/src/services/sadhana';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll } from '@/src/hooks/useTourScroll';
import { COMFORT_TOUCH_TARGET, displayProfileName, getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { AppButton } from '@/src/components/ui/AppButton';

type MoreSection = 'temples' | 'devatas' | 'vrat_katha';

export default function MoreScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactLayout = windowWidth < 380 || PixelRatio.getFontScale() > 1.25;
  const { openHelp, isInteractiveTourActive, isTryModeActive, currentTourStep } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/more', scrollRef);

  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [userLocation, setUserLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleSaveProfile = async (updated: UserSacredProfile) => {
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), userLocation);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(
      panchang,
      updated,
      plans,
      userLocation.timezone,
      7,
      userLocation,
      language
    );
  };

  const [activeSection, setActiveSection] = useState<MoreSection>('temples');
  const [manualSectionStepId, setManualSectionStepId] = useState<string | null>(null);
  const effectiveSection: MoreSection =
    isInteractiveTourActive &&
    currentTourStep?.tab === '/(tabs)/more' &&
    currentTourStep.moreSection &&
    manualSectionStepId !== currentTourStep.id
      ? currentTourStep.moreSection
      : activeSection;
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
    if (isInteractiveTourActive && currentTourStep?.id) {
      setManualSectionStepId(currentTourStep.id);
    }
    if (s === effectiveSection) return;
    setIsCalculating(true);
    setTimeout(() => {
      setActiveSection(s);
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
      {/* Slim Devotee & Quick Action Bar */}
      <View
        style={[
          styles.quickActionBar,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          testID="more-edit-profile-btn"
          accessibilityRole="button"
          accessibilityLabel={isHi ? 'धार्मिक प्रोफाइल बदलें' : 'Edit sacred profile'}
          style={[
            styles.quickProfileChip,
            isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
          ]}
          onPress={() => {
            triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
            setIsProfileModalOpen(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.quickProfileEmoji}>🕉️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quickProfileName, isDark && { color: theme.text }]}>
              {isHi ? 'श्री' : 'Sri'} {displayProfileName(userProfile.name, isHi)} {isHi ? 'जी' : ''}
            </Text>
            <Text style={[styles.quickProfileMeta, isDark && { color: theme.textSecondary }]}>
              {userProfile.gotra ? `${userProfile.gotra} • ` : ''}{userProfile.ishtaDevata}
            </Text>
          </View>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.quickActionRight}>
          <TouchableOpacity
            testID="more-to-settings-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'ऍप सेटिंग्स खोलें' : 'Open App Settings'}
            style={[
              styles.quickIconBtn,
              { minHeight: MIN_TOUCH_TARGET },
              isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
            ]}
            onPress={() => {
              triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
              router.push('/(tabs)/settings');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={18} color={theme.primary} />
            <Text style={[styles.quickSettingsLabel, isDark && { color: theme.text }]}>
              {isHi ? 'सेटिंग्स' : 'Settings'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="more-help-btn"
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              styles.helpBtn,
              { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET },
              isDark && { backgroundColor: theme.cardMuted, borderColor: theme.primaryBorder },
            ]}
            onPress={() => openHelp('more')}
            accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feature Switcher */}
      <View style={[styles.featureSwitcher, isDark && { backgroundColor: theme.cardMuted }]}>
        {[
          { id: 'temples' as const, labelHi: '🛕 तीर्थ-मन्दिर', labelEn: '🛕 Temples' },
          { id: 'devatas' as const, labelHi: '🔱 देवी-देवता', labelEn: '🔱 Deities' },
          { id: 'vrat_katha' as const, labelHi: '📖 व्रत कथा', labelEn: '📖 Vrat Katha' },
        ].map((tab) => {
          const isActive = effectiveSection === tab.id;
          const tabNode = (
            <TouchableOpacity
              key={tab.id}
              testID={`more-tab-${tab.id}`}
              accessibilityRole="tab"
              accessibilityLabel={isHi ? tab.labelHi : tab.labelEn}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.featureTab,
                { width: '100%', minHeight: COMFORT_TOUCH_TARGET, justifyContent: 'center' },
                isActive && [styles.featureTabActive, isDark && { backgroundColor: theme.card }],
              ]}
              onPress={() => handleSectionSelect(tab.id)}
            >
              <Text
                style={[
                  styles.featureTabText,
                  isDark && { color: theme.textSecondary },
                  isActive && [styles.featureTabTextActive, isDark && { color: theme.text }],
                ]}
              >
                {isHi ? tab.labelHi : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );

          if (tab.id === 'temples') {
            return (
              <TourTarget key={tab.id} targetId="more-tab-temples" borderRadius={14} style={{ flex: 1 }}>
                {tabNode}
              </TourTarget>
            );
          }
          if (tab.id === 'devatas') {
            return (
              <TourTarget key={tab.id} targetId="more-tab-devatas" borderRadius={14} style={{ flex: 1 }}>
                {tabNode}
              </TourTarget>
            );
          }
          return (
            <TourTarget key={tab.id} targetId="more-tab-vrat_katha" borderRadius={14} style={{ flex: 1 }}>
              {tabNode}
            </TourTarget>
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
          {effectiveSection === 'temples' && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
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
                    accessibilityRole="button"
                    accessibilityLabel={isHi ? c.labelHi : c.labelEn}
                    accessibilityState={{ selected: circuitFilter === c.id }}
                    style={[
                      styles.circuitPill,
                      isDark && { backgroundColor: theme.card, borderColor: theme.border },
                      circuitFilter === c.id && styles.circuitPillActive,
                    ]}
                    onPress={() => handleCircuitSelect(c.id as typeof circuitFilter)}
                  >
                    <Text
                      style={[
                        styles.circuitText,
                        isDark && { color: theme.textSecondary },
                        circuitFilter === c.id && styles.circuitTextActive,
                      ]}
                    >
                      {isHi ? c.labelHi : c.labelEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredTemples.map((temple: TempleRecord) => (
                <View
                  key={temple.id}
                  style={[
                    styles.card,
                    isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.templeHeader}>
                    <Text style={[styles.templeTitle, isDark && { color: theme.text }]}>
                      {isHi ? temple.nameDevanagari : temple.name}
                    </Text>
                    <View style={styles.templeLocationRow}>
                      <Text style={[styles.cardLocation, isDark && { color: theme.primary }]}>
                        📍 {temple.location.city}, {temple.location.state}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardSubText, isDark && { color: theme.textSecondary }]}>
                    {isHi ? 'प्रधान आराध्य:' : 'Primary Deity:'}{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {isHi ? (temple.primaryDeityDevanagari || temple.primaryDeity) : temple.primaryDeity}
                    </Text>
                  </Text>

                  {temple.sacredRiver && (
                    <Text style={[styles.cardSubText, isDark && { color: theme.textSecondary }]}>
                      🌊 {isHi ? 'पवित्र नदी:' : 'Sacred River:'}{' '}
                      {cleanBilingualTitle(temple.sacredRiver, isHi)}
                    </Text>
                  )}

                  <Text style={[styles.cardDesc, isDark && { color: theme.textSecondary }]}>
                    {cleanTempleSignificance(temple.significance, isHi)}
                  </Text>

                  <View
                    style={[
                      styles.darshanBox,
                      isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder, borderWidth: 1 },
                    ]}
                  >
                    <Ionicons name="time" size={16} color={theme.primary} />
                    <Text style={[styles.darshanText, isDark && { color: theme.primary }]}>
                      {isHi ? 'दर्शन समय:' : 'Darshan:'} {cleanDarshanTimings(temple.darshanTimings, isHi)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

      {/* SECTION 2: DEVI DEVATAS */}
      {effectiveSection === 'devatas' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
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
                accessibilityRole="button"
                accessibilityState={{ selected: devataTradition === t.id }}
                style={[
                  styles.circuitPill,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  devataTradition === t.id && (isDark ? { backgroundColor: theme.primary, borderColor: theme.primary } : styles.circuitPillActive),
                ]}
                onPress={() => handleDevataTraditionSelect(t.id)}
              >
                <Text
                  style={[
                    styles.circuitText,
                    isDark && { color: theme.textSecondary },
                    devataTradition === t.id && styles.circuitTextActive,
                  ]}
                >
                  {isHi ? t.labelHi : t.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredDeities.map((deity: DeityRecord) => (
            <TouchableOpacity
              key={deity.id}
              testID={`deity-card-${deity.id}`}
              accessibilityRole="button"
              accessibilityLabel={isHi ? deity.nameDevanagari : deity.name}
              style={[styles.card, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setSelectedDeityModal(deity)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, isDark && { color: theme.text }]}>
                  {isHi ? deity.nameDevanagari : deity.name}
                </Text>
                <View style={[styles.badgeTradition, isDark && { backgroundColor: theme.primaryBg }]}>
                  <Text style={[styles.badgeTraditionText, isDark && { color: theme.primary }]}>{deity.tradition}</Text>
                </View>
              </View>

              <Text style={[styles.deitySubtitle, isDark && { color: theme.primary }]}>
                {isHi ? deity.subtitleDevanagari : deity.subtitle}
              </Text>

              {deity.consort && (
                <Text style={[styles.cardSubText, isDark && { color: theme.textSecondary }]}>
                  {isHi ? 'शक्ति / सहचरी:' : 'Consort:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.consort}</Text>
                </Text>
              )}

              {deity.vahana && (
                <Text style={[styles.cardSubText, isDark && { color: theme.textSecondary }]}>
                  {isHi ? 'दिव्य वाहन:' : 'Vahana:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.vahana}</Text>
                </Text>
              )}

              {deity.tatva && (
                <Text style={[styles.cardDesc, isDark && { color: theme.textSecondary }]}>
                  {deity.tatva}
                </Text>
              )}

              {deity.keyMantras.length > 0 && (
                <View
                  style={[
                    styles.mantraBox,
                    isDark && { backgroundColor: theme.primaryBg, borderLeftColor: theme.primary },
                  ]}
                >
                  <Text style={[styles.mantraTitle, isDark && { color: theme.primary }]}>
                    {deity.keyMantras[0].title}
                  </Text>
                  <Text style={[styles.mantraDevanagari, isDark && { color: theme.text }]}>
                    {deity.keyMantras[0].devanagari}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooterAction}>
                <Text style={[styles.cardFooterActionText, isDark && { color: theme.primary }]}>
                  {isHi ? 'सम्पूर्ण दर्शन, मन्त्र एवं विवरण देखें →' : 'View Full Philosophy, Mantras & Temples →'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SECTION 3: VRAT KATHA */}
      {effectiveSection === 'vrat_katha' && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.circuitPill,
                    isDark && { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && (isDark ? { backgroundColor: theme.primary, borderColor: theme.primary } : styles.circuitPillActive),
                  ]}
                  onPress={() => handleVratSelect(vrat.id)}
                >
                  <Text
                    style={[
                      styles.circuitText,
                      isDark && { color: theme.textSecondary },
                      isSelected && styles.circuitTextActive,
                    ]}
                  >
                    {isHi ? vrat.titleDevanagari : vrat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.card, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, isDark && { color: theme.text }]}>
              {isHi ? activeVrat.titleDevanagari : activeVrat.title}
            </Text>
            <Text style={[styles.cardSubText, isDark && { color: theme.textSecondary }]}>
              {isHi ? 'आराध्य देव:' : 'Deity:'}{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {isHi ? activeVrat.deityDevanagari : activeVrat.deity}
              </Text>
              {' • '}
              {isHi ? activeVrat.tithiDevanagari : activeVrat.tithi}
            </Text>

            <Text style={[styles.cardDesc, isDark && { color: theme.textSecondary }]}>
              {activeVrat.significance}
            </Text>

            {/* Puja Steps */}
            <Text style={[styles.subHeading, isDark && { color: theme.text }]}>
              {isHi ? '🙏 प्रामाणिक पूजा विधि (Puja Steps)' : '🙏 Sacred Puja Vidhi'}
            </Text>
            {activeVrat.pujaVidhiSteps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <Text style={[styles.stepNum, isDark && { color: theme.primary }]}>{idx + 1}.</Text>
                <Text style={[styles.stepText, isDark && { color: theme.textSecondary }]}>{step}</Text>
              </View>
            ))}

            {/* Fasting Rules (Allowed & Prohibited) */}
            <View style={[styles.rulesGrid, isCompactLayout && { flexDirection: 'column' }]}>
              <View
                style={[
                  styles.rulesColumnAllowed,
                  isDark && { backgroundColor: '#064e3b', borderColor: '#059669' },
                ]}
              >
                <Text style={[styles.rulesHeadingAllowed, isDark && { color: '#6ee7b7' }]}>
                  {isHi ? '✅ फलाहार में ग्राह्य' : '✅ Allowed Foods'}
                </Text>
                {activeVrat.fastingRules.allowed.map((item, idx) => (
                  <Text key={idx} style={[styles.ruleItem, isDark && { color: '#d1fae5' }]}>
                    • {item}
                  </Text>
                ))}
              </View>

              <View
                style={[
                  styles.rulesColumnProhibited,
                  isDark && { backgroundColor: '#450a0a', borderColor: '#b91c1c' },
                ]}
              >
                <Text style={[styles.rulesHeadingProhibited, isDark && { color: '#fca5a5' }]}>
                  {isHi ? '⛔ पूर्णतः वर्जित' : '⛔ Prohibited'}
                </Text>
                {activeVrat.fastingRules.prohibited.map((item, idx) => (
                  <Text key={idx} style={[styles.ruleItem, isDark && { color: '#fee2e2' }]}>
                    • {item}
                  </Text>
                ))}
              </View>
            </View>

            {/* Parana Timing Guidance */}
            <View
              style={[
                styles.paranaBox,
                isDark && { backgroundColor: theme.infoBg, borderColor: theme.infoBorder },
              ]}
            >
              <Text style={[styles.paranaHeading, isDark && { color: '#93c5fd' }]}>
                {isHi ? '⏳ पारण समय व शास्त्र सम्मत विधि' : '⏳ Auspicious Parana Timing & Guidance'}
              </Text>
              <Text style={[styles.paranaText, isDark && { color: theme.text }]}>
                {activeVrat.paranaTimingGuidance}
              </Text>
            </View>

            {/* Sacred Story */}
            <Text style={[styles.subHeading, isDark && { color: theme.text }]}>
              {isHi ? '📜 पावन व्रत कथा' : '📜 Sacred Katha'}
            </Text>
            <View
              style={[
                styles.kathaBox,
                isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.kathaText, isDark && { color: theme.textSecondary }]}>
                {activeVrat.sacredKathaText}
              </Text>
            </View>

            {/* Aarti */}
            {activeVrat.sacredAartiText ? (
              <>
                <Text style={[styles.subHeading, isDark && { color: theme.text }]}>
                  {isHi ? '🪔 पावन आरती' : '🪔 Sacred Aarti'}
                </Text>
                <View
                  style={[
                    styles.aartiBox,
                    isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                  ]}
                >
                  <Text style={[styles.aartiText, isDark && { color: theme.text }]}>
                    {activeVrat.sacredAartiText}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      )}
        </>
      )}

      {/* About & Shastra Foundation */}
      <View
        style={[
          styles.aboutCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.aboutTitle, isDark && { color: theme.primary }]}>sanatan.cc</Text>
        <Text style={[styles.aboutSubtitle, isDark && { color: theme.text }]}>
          {isHi
            ? '१००% निःशुल्क शास्त्रीय वैदिक खगोल विज्ञान'
            : '100% Free Vedic Ephemeris'}
        </Text>
        <Text style={[styles.aboutDesc, isDark && { color: theme.textMuted }]}>
          {isHi
            ? 'नासा JPL VSOP87 एवं Chapront ELP-2000 खगोलीय सिद्धांतों तथा मुहूर्तचिन्तामणि व निर्णयसिन्धु शास्त्रीय ग्रन्थों पर आधारित पूर्णतः ऑफलाइन गणना।'
            : 'Powered by NASA JPL VSOP87, Chapront ELP-2000 theories, and classical Muhurta Chintamani scriptures. Operates 100% offline with zero tabular approximations.'}
        </Text>

        <View style={styles.aboutActionRow}>
          <TouchableOpacity
            testID="more-about-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'विस्तृत परिचय' : 'About'}
            style={[styles.modalBtn, { minHeight: COMFORT_TOUCH_TARGET }]}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="information-circle" size={18} color="#ffffff" />
            <Text style={styles.modalBtnText}>
              {isHi ? 'विस्तृत परिचय' : 'About'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="more-github-btn"
            accessibilityRole="link"
            accessibilityLabel="GitHub"
            style={[styles.githubBtn, { minHeight: COMFORT_TOUCH_TARGET }]}
            onPress={() => {
              Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc').catch(() => {});
            }}
          >
            <Ionicons name="logo-github" size={18} color="#ffffff" />
            <Text style={styles.githubBtnText}>GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deity Details Modal */}
      <Modal
        visible={!!selectedDeityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDeityModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 },
            ]}
          >
            {selectedDeityModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, backgroundColor: 'transparent', paddingRight: 8 }}>
                    <Text style={[styles.modalDeityName, isDark && { color: theme.text }]}>
                      {isHi ? selectedDeityModal.nameDevanagari : selectedDeityModal.name}
                    </Text>
                    <Text style={[styles.modalDeitySubtitle, isDark && { color: theme.primary }]}>
                      {isHi ? selectedDeityModal.subtitleDevanagari : selectedDeityModal.subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID="deity-modal-close-btn"
                    accessibilityRole="button"
                    accessibilityLabel={isHi ? 'बंद करें' : 'Close deity details'}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setSelectedDeityModal(null)}
                  >
                    <Ionicons name="close-circle" size={30} color={isDark ? theme.textSecondary : '#52525b'} />
                  </TouchableOpacity>
                </View>

                {/* Attributes */}
                <View style={[styles.deityAttrGrid, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border, borderWidth: 1 }]}>
                  {selectedDeityModal.consort && (
                    <Text style={[styles.attrRow, isDark && { color: theme.text }]}>
                      <Text style={[styles.attrLabel, isDark && { color: theme.textSecondary }]}>{isHi ? 'शक्ति:' : 'Consort:'} </Text>
                      {selectedDeityModal.consort}
                    </Text>
                  )}
                  {selectedDeityModal.vahana && (
                    <Text style={[styles.attrRow, isDark && { color: theme.text }]}>
                      <Text style={[styles.attrLabel, isDark && { color: theme.textSecondary }]}>{isHi ? 'वाहन:' : 'Vahana:'} </Text>
                      {selectedDeityModal.vahana}
                    </Text>
                  )}
                  {selectedDeityModal.abode && (
                    <Text style={[styles.attrRow, isDark && { color: theme.text }]}>
                      <Text style={[styles.attrLabel, isDark && { color: theme.textSecondary }]}>{isHi ? 'धाम:' : 'Abode:'} </Text>
                      {selectedDeityModal.abode}
                    </Text>
                  )}
                  {selectedDeityModal.sacredDay && (
                    <Text style={[styles.attrRow, isDark && { color: theme.text }]}>
                      <Text style={[styles.attrLabel, isDark && { color: theme.textSecondary }]}>{isHi ? 'प्रिय वार:' : 'Sacred Day:'} </Text>
                      {selectedDeityModal.sacredDay}
                    </Text>
                  )}
                  {selectedDeityModal.ayudhas && (
                    <Text style={[styles.attrRow, isDark && { color: theme.text }]}>
                      <Text style={[styles.attrLabel, isDark && { color: theme.textSecondary }]}>{isHi ? 'आयुध:' : 'Weapons:'} </Text>
                      {selectedDeityModal.ayudhas.join(', ')}
                    </Text>
                  )}
                </View>

                {/* Tatva */}
                <Text style={[styles.subHeading, isDark && { color: theme.text }]}>{isHi ? 'दार्शनिक स्वरूप (Philosophy)' : 'Spiritual Meaning'}</Text>
                <Text style={[styles.tatvaText, isDark && { color: theme.textSecondary }]}>{selectedDeityModal.tatva}</Text>

                {/* Key Mantras */}
                <Text style={[styles.subHeading, isDark && { color: theme.text }]}>{isHi ? 'महामन्त्र' : 'Sacred Mantras'}</Text>
                {selectedDeityModal.keyMantras.map((m, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.mantraCardFull,
                      isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                    ]}
                  >
                    <Text style={[styles.mantraTitle, isDark && { color: theme.primary }]}>{m.title}</Text>
                    <Text style={[styles.mantraDevanagariLarge, isDark && { color: theme.text }]}>{m.devanagari}</Text>
                    <Text style={[styles.mantraTranslit, isDark && { color: theme.textSecondary }]}>{m.transliteration}</Text>
                    <Text style={[styles.mantraMeaning, isDark && { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: 'bold' }}>{isHi ? 'अर्थ:' : 'Meaning:'} </Text>
                      {m.meaning}
                    </Text>
                  </View>
                ))}

                {/* Major Temples */}
                {selectedDeityModal.majorTemples.length > 0 && (
                  <>
                    <Text style={[styles.subHeading, isDark && { color: theme.text }]}>{isHi ? 'प्रमुख तीर्थ व मन्दिर' : 'Major Temples'}</Text>
                    {selectedDeityModal.majorTemples.map((temple, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.templeItemMini,
                          isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border, borderWidth: 1 },
                        ]}
                      >
                        <Text style={[styles.templeMiniName, isDark && { color: theme.text }]}>{temple.name}</Text>
                        <Text style={[styles.templeMiniLoc, isDark && { color: theme.primary }]}>📍 {temple.location}</Text>
                        <Text style={[styles.templeMiniSig, isDark && { color: theme.textSecondary }]}>{temple.significance}</Text>
                      </View>
                    ))}
                  </>
                )}

                <AppButton
                  testID="deity-modal-done-btn"
                  label={isHi ? 'बंद करें' : 'Close'}
                  variant="outline"
                  onPress={() => setSelectedDeityModal(null)}
                  style={{ marginTop: 12 }}
                />
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
  quickActionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginBottom: Spacing.md,
  },
  quickProfileChip: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: COMFORT_TOUCH_TARGET,
  },
  quickProfileEmoji: {
    fontSize: 20,
  },
  quickProfileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    lineHeight: 20,
  },
  quickProfileMeta: {
    fontSize: 12.5,
    color: '#92400e',
    marginTop: 2,
    lineHeight: 18,
  },
  quickActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  quickIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  quickSettingsLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#18181b',
  },
  helpBtn: {
    padding: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    alignItems: 'center',
    justifyContent: 'center',
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
  settingsNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingsNavPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    backgroundColor: 'transparent',
  },
  settingsNavIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsNavTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181b',
  },
  settingsNavSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: Spacing.md,
    lineHeight: 25,
  },
  circuitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  circuitPill: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 13.5,
    color: '#3f3f46',
    fontWeight: '700',
  },
  circuitTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#18181b',
    flexShrink: 1,
    marginRight: 8,
    lineHeight: 24,
  },
  templeHeader: {
    marginBottom: 8,
  },
  templeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 24,
    marginBottom: 4,
  },
  templeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 13.5,
    color: '#52525b',
    lineHeight: 20,
    flexShrink: 1,
  },
  cardSubText: {
    fontSize: 13.5,
    color: '#52525b',
    marginBottom: 5,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 10,
  },
  deitySubtitle: {
    fontSize: 13.5,
    color: '#b45309',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  badgeTradition: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTraditionText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: 'bold',
  },
  darshanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  darshanText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 19,
  },
  mantraBox: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  mantraTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 4,
  },
  mantraDevanagari: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
    lineHeight: 23,
  },
  mantraDevanagariLarge: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 26,
    marginVertical: 6,
  },
  mantraTranslit: {
    fontSize: 13.5,
    color: '#52525b',
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 20,
  },
  mantraMeaning: {
    fontSize: 13.5,
    color: '#27272a',
    lineHeight: 20,
  },
  mantraCardFull: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  cardFooterAction: {
    marginTop: 8,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  cardFooterActionText: {
    fontSize: 13.5,
    color: '#b45309',
    fontWeight: 'bold',
  },
  subHeading: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 14,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b45309',
  },
  stepText: {
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 21,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  rulesHeadingProhibited: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 8,
  },
  ruleItem: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  paranaBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 14,
    marginVertical: 10,
  },
  paranaHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  paranaText: {
    fontSize: 13.5,
    color: '#1e3a8a',
    lineHeight: 21,
  },
  kathaBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  kathaText: {
    fontSize: 14,
    color: '#27272a',
    lineHeight: 23,
  },
  aartiBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  aartiText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 23,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b45309',
  },
  aboutSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 4,
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: 14,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 16,
  },
  aboutActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b45309',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  githubBtnText: {
    color: '#ffffff',
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 27,
  },
  modalDeitySubtitle: {
    fontSize: 14,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 20,
  },
  deityAttrGrid: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  attrRow: {
    fontSize: 14,
    color: '#27272a',
    lineHeight: 20,
  },
  attrLabel: {
    fontWeight: 'bold',
    color: '#52525b',
  },
  tatvaText: {
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 21,
    marginBottom: 14,
  },
  templeItemMini: {
    backgroundColor: '#f4f4f5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  templeMiniName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#18181b',
  },
  templeMiniLoc: {
    fontSize: 13,
    color: '#52525b',
    marginVertical: 3,
  },
  templeMiniSig: {
    fontSize: 13.5,
    color: '#3f3f46',
    lineHeight: 20,
  },
});
