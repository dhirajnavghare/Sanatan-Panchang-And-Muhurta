import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Palette, Radius, Spacing } from '@/constants/Colors';

import {
  calculatePanchang,
  PRESET_CITIES,
  GeoLocation,
  PanchangData,
} from '@/src/core/panchang';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanPlanetLord, cleanDeityName } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import {
  WEEKDAY_DEVATAS,
  SACRED_DAILY_VERSES,
  generateDailySankalpa,
  getCurrentSpiritualPeriod,
  ShastricVerse,
} from '@/src/services/dinacharya';
import {
  DAILY_SADHANA_HABITS,
  getCompletedHabits,
  toggleHabitCompletion,
  getSadhanaStreak,
  getDateKey,
} from '@/src/services/sadhana';
import {
  buildDayPlannerSlots,
  getDayPlans,
  saveSlotPlan,
  toggleSlotCompletion,
  DayPlannerSlot,
  DayPlansMap,
} from '@/src/services/dayplanner';

export default function PanchangScreen() {
  const insets = useSafeAreaInsets();
  const { language, calendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [location, setLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Modals for deep Hindu daily routine
  const [isSankalpaModalVisible, setIsSankalpaModalVisible] = useState(false);
  const [isSadhanaModalVisible, setIsSadhanaModalVisible] = useState(false);
  const [isVerseModalVisible, setIsVerseModalVisible] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<ShastricVerse>(SACRED_DAILY_VERSES[0]);
  const [isLimbsExpanded, setIsLimbsExpanded] = useState(false);

  // Sadhana tracking state
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(1);

  // Day Planner state
  const [dayPlans, setDayPlans] = useState<DayPlansMap>({});
  const [plannerFilter, setPlannerFilter] = useState<'all' | 'shubh' | 'planned'>('all');
  const [editingInputs, setEditingInputs] = useState<Record<string, string>>({});

  const dateKey = useMemo(() => getDateKey(currentDate), [currentDate]);

  // Load Sadhana habits and Day Plans for current date
  const loadHabitsAndPlans = useCallback(async () => {
    const completed = await getCompletedHabits(dateKey);
    setCompletedHabits(completed);
    const streak = await getSadhanaStreak();
    setStreakCount(streak);

    const plans = await getDayPlans(dateKey);
    setDayPlans(plans);

    // Initialize editing inputs with saved tasks
    const initial: Record<string, string> = {};
    Object.keys(plans).forEach((k) => {
      initial[k] = plans[k].taskText;
    });
    setEditingInputs(initial);
  }, [dateKey]);

  useEffect(() => {
    loadHabitsAndPlans();
  }, [loadHabitsAndPlans]);

  const handleToggleHabit = async (habitId: string) => {
    const res = await toggleHabitCompletion(habitId, dateKey);
    setCompletedHabits(res.completedIds);
    setStreakCount(res.streak);
  };

  // 100% Offline Fast Ephemeris Calculation (< 1ms)
  const panchang: PanchangData = useMemo(() => {
    return calculatePanchang(currentDate, location, 'Lahiri', currentDate);
  }, [currentDate, location]);

  const activeMasa =
    calendarSystem === 'amanta'
      ? isHi
        ? `${panchang.masa.amantaNameDevanagari} मास`
        : `${panchang.masa.amantaName} Masa`
      : isHi
      ? `${panchang.masa.purnimantaNameDevanagari} मास`
      : `${panchang.masa.purnimantaName} Masa`;

  const activeChoghadiya = useMemo(() => {
    const all = [...panchang.choghadiya.day, ...panchang.choghadiya.night];
    return all.find((c) => c.isCurrent) || all[0];
  }, [panchang]);

  const spiritualPeriod = useMemo(() => {
    const sunrise = panchang.sunTimes.sunrise ? new Date(panchang.sunTimes.sunrise) : undefined;
    const sunset = panchang.sunTimes.sunset ? new Date(panchang.sunTimes.sunset) : undefined;
    return getCurrentSpiritualPeriod(new Date(), sunrise, sunset);
  }, [panchang]);

  const weekdayDevata = useMemo(() => {
    const day = currentDate.getDay();
    return WEEKDAY_DEVATAS[day] || WEEKDAY_DEVATAS[0];
  }, [currentDate]);

  const dailySankalpa = useMemo(() => {
    return generateDailySankalpa(panchang, location.name);
  }, [panchang, location.name]);

  // Day Planner Slots
  const plannerSlots = useMemo(() => {
    return buildDayPlannerSlots(panchang, new Date());
  }, [panchang]);

  const filteredSlots = useMemo(() => {
    if (plannerFilter === 'shubh') {
      return plannerSlots.filter((s) => s.quality !== 'Ashubh');
    }
    if (plannerFilter === 'planned') {
      return plannerSlots.filter((s) => dayPlans[s.id]?.taskText);
    }
    return plannerSlots;
  }, [plannerSlots, plannerFilter, dayPlans]);

  const totalPlannedCount = useMemo(() => {
    return Object.values(dayPlans).filter((p) => p.taskText).length;
  }, [dayPlans]);

  const totalCompletedCount = useMemo(() => {
    return Object.values(dayPlans).filter((p) => p.taskText && p.isCompleted).length;
  }, [dayPlans]);

  const handleInputChange = (slotId: string, text: string) => {
    setEditingInputs((prev) => ({ ...prev, [slotId]: text }));
  };

  const handleSavePlan = async (slotId: string, text: string) => {
    const currentCompleted = dayPlans[slotId]?.isCompleted || false;
    const updated = await saveSlotPlan(dateKey, slotId, text, currentCompleted);
    setDayPlans(updated);
  };

  const handleApplySuggestion = async (slotId: string, suggestion: string) => {
    setEditingInputs((prev) => ({ ...prev, [slotId]: suggestion }));
    const updated = await saveSlotPlan(dateKey, slotId, suggestion, false);
    setDayPlans(updated);
  };

  const handleTogglePlanCompletion = async (slotId: string) => {
    const updated = await toggleSlotCompletion(dateKey, slotId);
    setDayPlans(updated);
  };

  const handleClearSlot = async (slotId: string) => {
    const updated = await saveSlotPlan(dateKey, slotId, '');
    setDayPlans(updated);
    setEditingInputs((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: location.timezone,
      }).format(date);
    } catch {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Generate 7-day pill week based on currentDate
  const weekDays = useMemo(() => {
    const list: Date[] = [];
    const base = new Date(currentDate);
    const dayOfWeek = base.getDay(); // 0 is Sunday
    const startSunday = new Date(base);
    startSunday.setDate(base.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + i);
      list.push(d);
    }
    return list;
  }, [currentDate]);

  const handleSelectDate = (d: Date) => {
    if (d.toDateString() === currentDate.toDateString()) return;
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentDate(d);
      setIsCalculating(false);
    }, 80);
  };

  const handleSelectCity = (city: GeoLocation) => {
    setIsCityModalVisible(false);
    setIsCalculating(true);
    setTimeout(() => {
      setLocation(city);
      setIsCalculating(false);
    }, 80);
  };

  const handleGpsDetect = async () => {
    try {
      setIsLocating(true);
      setIsCalculating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
          isHi
            ? 'सटीक सूर्योदय व पञ्चाङ्ग गणना हेतु कृपया स्थान अनुमति प्रदान करें।'
            : 'Location permission is required to detect coordinates for astronomical sunrise.'
        );
        setIsLocating(false);
        setIsCalculating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude, altitude } = loc.coords;
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      setLocation({
        name: isHi ? 'वर्तमान स्थान' : 'Current GPS City',
        latitude,
        longitude,
        altitude: altitude ?? 0,
        timezone: detectedTz,
      });
      setIsLocating(false);
      setIsCalculating(false);
    } catch {
      setIsLocating(false);
      setIsCalculating(false);
      Alert.alert(
        isHi ? 'स्थान त्रुटि' : 'Location Error',
        isHi ? 'जीपीएस स्थान प्राप्त नहीं हो सका।' : 'Could not detect GPS location.'
      );
    }
  };

  const handleShareSankalpa = async () => {
    try {
      await Share.share({
        message: `${dailySankalpa.sanskrit}\n\n[अर्थ]: ${dailySankalpa.hindi}\n\n— सनातन पञ्चाङ्ग (sanatan.cc)`,
      });
    } catch {
      // ignore
    }
  };

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ========================================================= */}
        {/* TOP PROFILE & GREETING BAR (Matching Reference UI)       */}
        {/* ========================================================= */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => router.navigate('/(tabs)/more' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarGlyph}>🕉️</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>
              {isHi ? spiritualPeriod.greetingHi : spiritualPeriod.greetingEn}
            </Text>
            <Text style={styles.greetingSubtitle} numberOfLines={1}>
              {isHi ? 'आज ' : 'Today '}
              {currentDate.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
                day: 'numeric',
                month: 'short',
              })}
              {' • '}
              {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cityActionBtn}
            onPress={() => setIsCityModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color="#18181b" />
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* DAILY SADHANA CHALLENGE (HERO CARD - Lavender Pastel)     */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.heroChallengeCard}
          activeOpacity={0.92}
          onPress={() => setIsSadhanaModalVisible(true)}
        >
          <View style={styles.heroLeftColumn}>
            <Text style={styles.heroChallengeTitle}>
              {isHi ? 'दैनिक साधना संकल्प' : 'Daily challenge'}
            </Text>
            <Text style={styles.heroChallengeSubtitle} numberOfLines={2}>
              {isHi ? spiritualPeriod.suggestedActionHi : spiritualPeriod.suggestedActionEn}
            </Text>

            {/* Micro Habits avatars & count badge */}
            <View style={styles.habitsRow}>
              {DAILY_SADHANA_HABITS.slice(0, 3).map((h) => {
                const isDone = completedHabits.includes(h.id);
                return (
                  <View
                    key={h.id}
                    style={[styles.habitMiniBubble, isDone && styles.habitMiniBubbleDone]}
                  >
                    <Ionicons
                      name={h.iconName as any}
                      size={13}
                      color={isDone ? '#ffffff' : '#4c1d95'}
                    />
                  </View>
                );
              })}
              <View style={styles.streakCountBadge}>
                <Text style={styles.streakCountText}>
                  {completedHabits.length}/{DAILY_SADHANA_HABITS.length}
                </Text>
              </View>
              {streakCount > 0 && (
                <View style={styles.fireStreakBadge}>
                  <Text style={styles.fireStreakText}>🔥 {streakCount}d</Text>
                </View>
              )}
            </View>
          </View>

          {/* 3D Sacred Radiant Symbol Graphic */}
          <View style={styles.heroGraphicArea}>
            <View style={styles.graphicSunOuter}>
              <View style={styles.graphicSunCore}>
                <Text style={styles.graphicIcon}>☀️</Text>
              </View>
              <View style={styles.floatingGemBadge}>
                <Text style={styles.floatingGemText}>📿</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* HORIZONTAL 7-DAY PILL STRIP (Sun - Sat)                   */}
        {/* ========================================================= */}
        <View style={styles.weekStripContainer}>
          {weekDays.map((d, index) => {
            const isSelected = d.toDateString() === currentDate.toDateString();
            const dayNum = d.getDate();
            const isToday = d.toDateString() === new Date().toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                onPress={() => handleSelectDate(d)}
                activeOpacity={0.8}
              >
                {/* Top Notification Dot */}
                <View
                  style={[
                    styles.dayDot,
                    isSelected
                      ? styles.dayDotSelected
                      : isToday
                      ? styles.dayDotToday
                      : styles.dayDotRegular,
                  ]}
                />
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                  {isHi ? dayNamesHi[d.getDay()] : dayNamesEn[d.getDay()]}
                </Text>
                <Text style={[styles.dayNumberText, isSelected && styles.dayNumberTextSelected]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================= */}
        {/* SECTION HEADING: "Your plan" (आज की दिनचर्या व मुहूर्त) */}
        {/* ========================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{isHi ? 'आज की दिनचर्या' : 'Your plan'}</Text>
          <TouchableOpacity
            style={styles.cityLocationPill}
            onPress={() => setIsCityModalVisible(true)}
          >
            <Ionicons name="location-sharp" size={12} color="#d97706" />
            <Text style={styles.cityLocationText} numberOfLines={1}>
              {location.name}
            </Text>
          </TouchableOpacity>
        </View>

        {isCalculating ? (
          <LoadingIndicator
            message={isHi ? 'पञ्चाङ्ग गणना जारी है...' : 'Computing Auspicious Times...'}
          />
        ) : (
          <>
            {/* ======================================================= */}
            {/* BENTO GRID (The Daily Hindu Routine Engine)             */}
            {/* ======================================================= */}
            <View style={styles.bentoContainer}>
              {/* LEFT TALL CARD: Auspicious Muhurta & Sankalpa */}
              <TouchableOpacity
                style={[styles.bentoTallCard, { backgroundColor: '#fed7aa' }]}
                activeOpacity={0.9}
                onPress={() => setIsSankalpaModalVisible(true)}
              >
                <View style={styles.cardTagPill}>
                  <Text style={styles.cardTagText}>
                    {panchang.muhurtas.abhijitMuhurta
                      ? isHi
                        ? 'अमृत अभिजित'
                        : 'Abhijit'
                      : isHi
                      ? 'शुभ मुहूर्त'
                      : 'Shubh'}
                  </Text>
                </View>

                <Text style={styles.tallCardTitle}>
                  {panchang.muhurtas.abhijitMuhurta
                    ? isHi
                      ? 'अभिजित मुहूर्त'
                      : 'Abhijit Muhurta'
                    : isHi
                    ? `${activeChoghadiya?.nameDevanagari} चौघड़िया`
                    : `${activeChoghadiya?.name} Choghadiya`}
                </Text>

                <Text style={styles.tallCardDate}>
                  {currentDate.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>

                <Text style={styles.tallCardTime}>
                  {panchang.muhurtas.abhijitMuhurta
                    ? `${formatTime(panchang.muhurtas.abhijitMuhurta.startTime)} - ${formatTime(
                        panchang.muhurtas.abhijitMuhurta.endTime
                      )}`
                    : `${formatTime(activeChoghadiya?.startTime)} - ${formatTime(
                        activeChoghadiya?.endTime
                      )}`}
                </Text>

                <Text style={styles.tallCardSubtitle} numberOfLines={2}>
                  {isHi
                    ? 'सर्वदोष नाशक • महत्वपूर्ण आरम्भ व विजय मुहूर्त'
                    : 'Supreme auspicious window for all major undertakings'}
                </Text>

                {/* Rahu Kaal Warning Badge */}
                <View style={styles.rahuKaalInline}>
                  <Ionicons name="alert-circle" size={13} color="#b91c1c" />
                  <Text style={styles.rahuKaalInlineText}>
                    {isHi ? 'राहु काल:' : 'Rahu:'}{' '}
                    {formatTime(panchang.muhurtas.rahuKaal.startTime)} -{' '}
                    {formatTime(panchang.muhurtas.rahuKaal.endTime)}
                  </Text>
                </View>

                {/* Bottom Action Pill: Recite Daily Sankalpa */}
                <View style={styles.tallCardFooter}>
                  <View style={styles.trainerAvatar}>
                    <Text style={{ fontSize: 13 }}>📜</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tallFooterRole}>
                      {isHi ? 'वैदिक संकल्प' : 'Daily Sankalpa'}
                    </Text>
                    <Text style={styles.tallFooterName}>
                      {isHi ? 'आरम्भ करें →' : 'Recite Vow →'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* RIGHT COLUMN (2 Stacked Cards) */}
              <View style={styles.bentoRightColumn}>
                {/* TOP RIGHT CARD: Deity of the Day & Japa */}
                <TouchableOpacity
                  style={[styles.bentoRightCardTop, { backgroundColor: weekdayDevata.bgPastel }]}
                  activeOpacity={0.9}
                  onPress={() => router.push('/(tabs)/prayers' as any)}
                >
                  <View style={styles.cardTagPillSky}>
                    <Text style={styles.cardTagTextSky}>
                      {isHi ? 'वार अधिष्ठाता' : 'Daily Deity'}
                    </Text>
                  </View>

                  <Text style={styles.rightCardTitle} numberOfLines={1}>
                    {isHi ? weekdayDevata.deityNameHi : weekdayDevata.deityName}
                  </Text>

                  <Text style={styles.rightCardMantra} numberOfLines={2}>
                    {isHi ? weekdayDevata.mantraDevanagari : weekdayDevata.mantra}
                  </Text>

                  <View style={styles.rightCardActionRow}>
                    <Text style={styles.japaLaunchText}>
                      {isHi ? '📿 जप माला खोलें' : '📿 Open Japa Mala'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#0369a1" />
                  </View>
                </TouchableOpacity>

                {/* BOTTOM RIGHT CARD: Vrat & Sacred Shloka Action Bar */}
                <View style={[styles.bentoRightCardBottom, { backgroundColor: '#fce7f3' }]}>
                  <View style={styles.cardTagPillPink}>
                    <Text style={styles.cardTagTextPink}>
                      {isHi ? 'नित्यकर्म साधन' : 'Daily Sadhana'}
                    </Text>
                  </View>

                  <Text style={styles.bottomCardNotice} numberOfLines={2}>
                    {activeMasa} • {isHi ? panchang.tithi.current.pakshaDevanagari : panchang.tithi.current.paksha}
                  </Text>

                  {/* 3 Quick Action Buttons */}
                  <View style={styles.quickIconRow}>
                    <TouchableOpacity
                      style={styles.quickCircleBtn}
                      onPress={() => {
                        setSelectedVerse(SACRED_DAILY_VERSES[0]);
                        setIsVerseModalVisible(true);
                      }}
                    >
                      <Text style={styles.quickCircleEmoji}>🌅</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCircleBtn}
                      onPress={() => {
                        setSelectedVerse(SACRED_DAILY_VERSES[2]);
                        setIsVerseModalVisible(true);
                      }}
                    >
                      <Text style={styles.quickCircleEmoji}>🪔</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCircleBtn}
                      onPress={() => router.push('/(tabs)/festivals' as any)}
                    >
                      <Text style={styles.quickCircleEmoji}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* ======================================================= */}
            {/* SUN & MOON TIMES STRIP                                  */}
            {/* ======================================================= */}
            <View style={styles.sunStripRow}>
              <View style={styles.sunItem}>
                <Text style={styles.sunItemEmoji}>🌅</Text>
                <View>
                  <Text style={styles.sunItemLabel}>{isHi ? 'सूर्योदय' : 'Sunrise'}</Text>
                  <Text style={styles.sunItemVal}>{formatTime(panchang.sunTimes.sunrise)}</Text>
                </View>
              </View>

              <View style={styles.sunDivider} />

              <View style={styles.sunItem}>
                <Text style={styles.sunItemEmoji}>🌇</Text>
                <View>
                  <Text style={styles.sunItemLabel}>{isHi ? 'सूर्यास्त' : 'Sunset'}</Text>
                  <Text style={styles.sunItemVal}>{formatTime(panchang.sunTimes.sunset)}</Text>
                </View>
              </View>

              <View style={styles.sunDivider} />

              <View style={styles.sunItem}>
                <Text style={styles.sunItemEmoji}>🌙</Text>
                <View>
                  <Text style={styles.sunItemLabel}>{isHi ? 'चन्द्रमा' : 'Moon'}</Text>
                  <Text style={styles.sunItemVal}>
                    {panchang.moonTimes.moonrise
                      ? formatTime(panchang.moonTimes.moonrise)
                      : isHi
                      ? 'अस्त'
                      : 'Set'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ======================================================= */}
            {/* MUHURTA DAY PLANNER (Time - What time is for - Input)   */}
            {/* ======================================================= */}
            <View style={styles.plannerSection}>
              <View style={styles.plannerHeaderRow}>
                <View>
                  <Text style={styles.plannerSectionTitle}>
                    {isHi ? 'मुहूर्तानुसार दिन योजनाकार' : 'Muhurta Day Planner'}
                  </Text>
                  <Text style={styles.plannerSectionSub}>
                    {isHi
                      ? 'शुभ काल के अनुसार अपने कार्यों का नियोजन करें'
                      : 'Schedule tasks aligned with auspicious cosmic timing'}
                  </Text>
                </View>

                {totalPlannedCount > 0 && (
                  <View style={styles.plannerProgressBadge}>
                    <Text style={styles.plannerProgressText}>
                      🎯 {totalCompletedCount}/{totalPlannedCount} {isHi ? 'सम्पन्न' : 'Done'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.plannerFilterRow}>
                <TouchableOpacity
                  style={[
                    styles.plannerFilterTab,
                    plannerFilter === 'all' && styles.plannerFilterTabActive,
                  ]}
                  onPress={() => setPlannerFilter('all')}
                >
                  <Text
                    style={[
                      styles.plannerFilterTabText,
                      plannerFilter === 'all' && styles.plannerFilterTabTextActive,
                    ]}
                  >
                    {isHi ? 'सभी समय' : 'All Windows'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.plannerFilterTab,
                    plannerFilter === 'shubh' && styles.plannerFilterTabActive,
                  ]}
                  onPress={() => setPlannerFilter('shubh')}
                >
                  <Text
                    style={[
                      styles.plannerFilterTabText,
                      plannerFilter === 'shubh' && styles.plannerFilterTabTextActive,
                    ]}
                  >
                    {isHi ? '🌟 केवल शुभ मुहूर्त' : '🌟 Auspicious Only'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.plannerFilterTab,
                    plannerFilter === 'planned' && styles.plannerFilterTabActive,
                  ]}
                  onPress={() => setPlannerFilter('planned')}
                >
                  <Text
                    style={[
                      styles.plannerFilterTabText,
                      plannerFilter === 'planned' && styles.plannerFilterTabTextActive,
                    ]}
                  >
                    {isHi ? `✍️ नियोजित (${totalPlannedCount})` : `✍️ Planned (${totalPlannedCount})`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Slot Cards List */}
              <View style={styles.plannerCardsContainer}>
                {filteredSlots.map((slot) => {
                  const plan = dayPlans[slot.id];
                  const hasPlan = Boolean(plan?.taskText);
                  const isDone = Boolean(plan?.isCompleted);
                  const currentInputValue = editingInputs[slot.id] !== undefined
                    ? editingInputs[slot.id]
                    : plan?.taskText || '';

                  // Quality styling
                  const isAshubh = slot.quality === 'Ashubh';
                  const isMahashubh = slot.quality === 'Mahashubh' || slot.quality === 'Amrit';

                  return (
                    <View
                      key={slot.id}
                      style={[
                        styles.plannerSlotCard,
                        slot.isCurrent && styles.plannerSlotCardCurrent,
                        isAshubh && styles.plannerSlotCardAshubh,
                        isDone && styles.plannerSlotCardDone,
                      ]}
                    >
                      {/* Top Time & Quality Row */}
                      <View style={styles.slotTopRow}>
                        <View style={styles.slotTimeBlock}>
                          <Text style={styles.slotTimeRange}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Text>
                          <Text style={styles.slotTitle} numberOfLines={1}>
                            {isHi ? slot.titleHi : slot.title}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {slot.isCurrent && (
                            <View style={styles.currentActiveBadge}>
                              <Text style={styles.currentActiveBadgeText}>
                                {isHi ? '● अभी सक्रिय' : '● LIVE NOW'}
                              </Text>
                            </View>
                          )}

                          <View
                            style={[
                              styles.qualityBadge,
                              isMahashubh && styles.qualityBadgeMahashubh,
                              isAshubh && styles.qualityBadgeAshubh,
                            ]}
                          >
                            <Text
                              style={[
                                styles.qualityBadgeText,
                                isMahashubh && styles.qualityBadgeTextMahashubh,
                                isAshubh && styles.qualityBadgeTextAshubh,
                              ]}
                            >
                              {isAshubh
                                ? isHi ? 'त्याज्य' : 'Avoid'
                                : isMahashubh
                                ? isHi ? 'महाशुभ' : 'Supreme'
                                : isHi ? 'शुभ' : 'Shubh'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* For What this time is for (शास्त्रीय प्रयोजन) */}
                      <View
                        style={[
                          styles.suitabilityBox,
                          isAshubh && styles.suitabilityBoxAshubh,
                        ]}
                      >
                        <Text style={styles.suitabilityHeading}>
                          {isAshubh
                            ? isHi ? '⚠️ इस समय क्या न करें:' : '⚠️ What to avoid now:'
                            : isHi ? '💡 किस कार्य हेतु उपयुक्त:' : '💡 Ideal for:'}
                        </Text>
                        <Text
                          style={[
                            styles.suitabilityText,
                            isAshubh && styles.suitabilityTextAshubh,
                          ]}
                        >
                          {isHi ? slot.suitabilityHi : slot.suitability}
                        </Text>
                      </View>

                      {/* Suggested Quick Chips */}
                      <View style={styles.quickChipsRow}>
                        {(isHi ? slot.suggestedTasksHi : slot.suggestedTasks).map((suggestion, sIdx) => (
                          <TouchableOpacity
                            key={sIdx}
                            style={styles.suggestionChip}
                            onPress={() => handleApplySuggestion(slot.id, suggestion)}
                          >
                            <Text style={styles.suggestionChipText}>+ {suggestion}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Interactive Input Box */}
                      <View style={[styles.inputRow, isDone && styles.inputRowDone]}>
                        <TouchableOpacity
                          style={styles.checkCircleBtn}
                          onPress={() => handleTogglePlanCompletion(slot.id)}
                          disabled={!hasPlan && !currentInputValue}
                        >
                          <Ionicons
                            name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isDone ? '#10b981' : hasPlan ? '#d97706' : '#d4d4d8'}
                          />
                        </TouchableOpacity>

                        <TextInput
                          style={[
                            styles.slotTextInput,
                            isDone && styles.slotTextInputDone,
                          ]}
                          placeholder={
                            isAshubh
                              ? isHi
                                ? 'इस समय विश्राम/सामान्य कार्य लिखें...'
                                : 'Plan quiet chores / rest...'
                              : isHi
                              ? 'अपनी योजना लिखें (उदा. नए कार्य का आरम्भ)...'
                              : 'Plan your task for this auspicious window...'
                          }
                          placeholderTextColor="#a1a1aa"
                          value={currentInputValue}
                          onChangeText={(txt) => handleInputChange(slot.id, txt)}
                          onBlur={() => handleSavePlan(slot.id, currentInputValue)}
                          returnKeyType="done"
                          onSubmitEditing={() => handleSavePlan(slot.id, currentInputValue)}
                        />

                        {currentInputValue.length > 0 && (
                          <TouchableOpacity
                            style={styles.clearSlotBtn}
                            onPress={() => handleClearSlot(slot.id)}
                          >
                            <Ionicons name="close-circle" size={18} color="#a1a1aa" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ======================================================= */}
            {/* 5 SACRED LIMBS (PANCHA-ANGA) EXPANDABLE ACCORDION       */}
            {/* ======================================================= */}
            <TouchableOpacity
              style={styles.limbsHeaderBtn}
              onPress={() => setIsLimbsExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🪐</Text>
                <Text style={styles.limbsHeaderText}>
                  {isHi ? 'पञ्चाङ्ग के ५ मूल अंग (विस्तार)' : 'The 5 Sacred Limbs (Pancha-Anga)'}
                </Text>
              </View>
              <Ionicons
                name={isLimbsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#71717a"
              />
            </TouchableOpacity>

            {isLimbsExpanded && (
              <View style={styles.limbsContainer}>
                {/* 1. Tithi */}
                <View style={styles.limbCard}>
                  <View style={styles.limbTop}>
                    <Text style={styles.limbIndex}>{isHi ? '१. तिथि' : '1. Tithi'}</Text>
                    <Text style={styles.limbStatus}>
                      {isHi
                        ? `${panchang.tithi.current.pakshaDevanagari} पक्ष`
                        : `${panchang.tithi.current.paksha} Paksha`}
                    </Text>
                  </View>
                  <Text style={styles.limbName}>
                    {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
                  </Text>
                  <View style={styles.limbFooter}>
                    <Text style={styles.limbEnd}>
                      {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.tithi.endTime)}
                    </Text>
                    <Text style={styles.limbDeity}>
                      {isHi ? 'देवता:' : 'Deity:'}{' '}
                      {cleanDeityName(panchang.tithi.current.deity, isHi)}
                    </Text>
                  </View>
                </View>

                {/* 2. Nakshatra */}
                <View style={styles.limbCard}>
                  <View style={styles.limbTop}>
                    <Text style={styles.limbIndex}>{isHi ? '२. नक्षत्र' : '2. Nakshatra'}</Text>
                    <Text style={styles.limbStatus}>
                      {isHi
                        ? `चरण ${panchang.nakshatra.current.pada}`
                        : `Pada ${panchang.nakshatra.current.pada}`}
                    </Text>
                  </View>
                  <Text style={styles.limbName}>
                    {isHi
                      ? panchang.nakshatra.current.nameDevanagari
                      : panchang.nakshatra.current.name}
                  </Text>
                  <View style={styles.limbFooter}>
                    <Text style={styles.limbEnd}>
                      {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.nakshatra.endTime)}
                    </Text>
                    <Text style={styles.limbDeity}>
                      {isHi ? 'स्वामी:' : 'Lord:'}{' '}
                      {cleanPlanetLord(panchang.nakshatra.current.lord, isHi)}
                    </Text>
                  </View>
                </View>

                {/* 3. Yoga */}
                <View style={styles.limbCard}>
                  <View style={styles.limbTop}>
                    <Text style={styles.limbIndex}>{isHi ? '३. योग' : '3. Yoga'}</Text>
                    <Text
                      style={[
                        styles.limbStatus,
                        panchang.yoga.current.nature === 'Auspicious'
                          ? { color: '#10b981', backgroundColor: '#ecfdf5' }
                          : { color: '#ef4444', backgroundColor: '#fef2f2' },
                      ]}
                    >
                      {isHi
                        ? panchang.yoga.current.nature === 'Auspicious'
                          ? 'शुभ'
                          : 'अशुभ'
                        : panchang.yoga.current.nature}
                    </Text>
                  </View>
                  <Text style={styles.limbName}>
                    {isHi ? panchang.yoga.current.nameDevanagari : panchang.yoga.current.name}
                  </Text>
                  <View style={styles.limbFooter}>
                    <Text style={styles.limbEnd}>
                      {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.yoga.endTime)}
                    </Text>
                    <Text style={styles.limbDeity}>
                      {isHi
                        ? `संख्या ${panchang.yoga.current.index}`
                        : `Index ${panchang.yoga.current.index} / 27`}
                    </Text>
                  </View>
                </View>

                {/* 4. Karana */}
                <View style={styles.limbCard}>
                  <View style={styles.limbTop}>
                    <Text style={styles.limbIndex}>{isHi ? '४. करण' : '4. Karana'}</Text>
                    <Text style={styles.limbStatus}>
                      {isHi
                        ? panchang.karana.current.type === 'Chara'
                          ? 'चर'
                          : 'स्थिर'
                        : panchang.karana.current.type}
                    </Text>
                  </View>
                  <Text style={styles.limbName}>
                    {isHi ? panchang.karana.current.nameDevanagari : panchang.karana.current.name}
                  </Text>
                  <View style={styles.limbFooter}>
                    <Text style={styles.limbEnd}>
                      {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.karana.endTime)}
                    </Text>
                    <Text style={styles.limbDeity}>
                      {isHi ? 'देवता:' : 'Deity:'}{' '}
                      {cleanDeityName(panchang.karana.current.deity, isHi)}
                    </Text>
                  </View>
                </View>

                {/* 5. Vara */}
                <View style={styles.limbCard}>
                  <View style={styles.limbTop}>
                    <Text style={styles.limbIndex}>{isHi ? '५. वार' : '5. Solar Day'}</Text>
                    <Text style={styles.limbStatus}>
                      {isHi ? 'सौर दिवस' : 'Sunrise-based'}
                    </Text>
                  </View>
                  <Text style={styles.limbName}>
                    {isHi ? panchang.vara.nameDevanagari : panchang.vara.name}
                  </Text>
                  <View style={styles.limbFooter}>
                    <Text style={styles.limbEnd}>
                      {isHi ? 'अधिपति:' : 'Lord:'}{' '}
                      {cleanPlanetLord(panchang.vara.lordPlanet, isHi)}
                    </Text>
                    <Text style={styles.limbDeity}>
                      {isHi ? `संवत् ${panchang.samvat.vikramSamvat}` : `Vikram ${panchang.samvat.vikramSamvat}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: DAILY VEDIC SANKALPA                             */}
      {/* ========================================================= */}
      <Modal visible={isSankalpaModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📜</Text>
                <Text style={styles.modalTitle}>
                  {isHi ? 'दैनिक वैदिक सङ्कल्प' : 'Daily Vedic Sankalpa'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsSankalpaModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              <View style={styles.sankalpaPillHeader}>
                <Text style={styles.sankalpaPillLocation}>📍 {location.name}</Text>
                <Text style={styles.sankalpaPillDate}>
                  संवत् {panchang.samvat.vikramSamvat} • {activeMasa}
                </Text>
              </View>

              <Text style={styles.sankalpaSanskrit}>{dailySankalpa.sanskrit}</Text>

              <View style={styles.meaningDivider} />

              <Text style={styles.meaningLabel}>{isHi ? 'भावार्थ (हिंदी):' : 'Meaning (Hindi):'}</Text>
              <Text style={styles.meaningText}>{dailySankalpa.hindi}</Text>

              <View style={styles.meaningDivider} />

              <Text style={styles.meaningLabel}>English Contemplation:</Text>
              <Text style={styles.meaningText}>{dailySankalpa.english}</Text>
            </ScrollView>

            <View style={styles.modalFooterBtns}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareSankalpa}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                <Text style={styles.shareBtnText}>{isHi ? 'साझा करें' : 'Share'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setIsSankalpaModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>{isHi ? 'सङ्कल्प सम्पन्न' : 'Done'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: INTERACTIVE DAILY SADHANA HABIT CHECKLIST        */}
      {/* ========================================================= */}
      <Modal visible={isSadhanaModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isHi ? 'दैनिक नित्यकर्म साधना' : 'Daily Sadhana Checklist'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isHi ? 'प्रतिदिन की ५ सूक्ष्म साधनाएं' : '5 essential daily sacred micro-habits'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsSadhanaModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {DAILY_SADHANA_HABITS.map((habit) => {
                const isDone = completedHabits.includes(habit.id);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={[styles.habitRow, isDone && styles.habitRowDone]}
                    onPress={() => handleToggleHabit(habit.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.habitIconBox, isDone && styles.habitIconBoxDone]}>
                      <Ionicons
                        name={habit.iconName as any}
                        size={20}
                        color={isDone ? '#ffffff' : '#d97706'}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.habitTitle, isDone && styles.habitTitleDone]}>
                        {isHi ? habit.titleHi : habit.titleEn}
                      </Text>
                      <Text style={styles.habitDesc}>
                        {isHi ? habit.descHi : habit.descEn}
                      </Text>
                      <Text style={styles.habitTime}>
                        ⏰ {isHi ? habit.timeContextHi : habit.timeContext}
                      </Text>
                    </View>

                    <Ionicons
                      name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isDone ? '#10b981' : '#a1a1aa'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setIsSadhanaModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>
                {isHi ? 'साधना सहेजें' : 'Save Sadhana'} ({completedHabits.length}/5)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: SHASTRA VERSE & ARGYA RECITER                    */}
      {/* ========================================================= */}
      <Modal visible={isVerseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isHi ? selectedVerse.titleHi : selectedVerse.title}
              </Text>
              <TouchableOpacity onPress={() => setIsVerseModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={styles.contextPill}>
                <Ionicons name="time-outline" size={14} color="#d97706" />
                <Text style={styles.contextPillText}>
                  {isHi ? selectedVerse.timeContextHi : selectedVerse.timeContext}
                </Text>
              </View>

              <Text style={styles.verseSanskrit}>{selectedVerse.shloka}</Text>
              <Text style={styles.verseTranslit}>{selectedVerse.transliteration}</Text>

              <View style={styles.meaningDivider} />
              <Text style={styles.meaningLabel}>{isHi ? 'भावार्थ:' : 'Meaning:'}</Text>
              <Text style={styles.meaningText}>
                {isHi ? selectedVerse.meaningHi : selectedVerse.meaning}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setIsVerseModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>{isHi ? 'बन्द करें' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: CITY / TIRTHA SELECTOR                           */}
      {/* ========================================================= */}
      <Modal visible={isCityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isHi ? 'तीर्थ अथवा नगर चुनें' : 'Select City or Tirtha'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isHi ? 'सटीक स्थानिक सूर्योदय व पञ्चाङ्ग' : 'Local coordinates for true astronomical timings'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* GPS Detection Bar */}
            <TouchableOpacity
              style={styles.gpsBanner}
              onPress={handleGpsDetect}
              disabled={isLocating}
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
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityRow,
                    item.name === location.name && styles.cityRowSelected,
                  ]}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text
                    style={[
                      styles.cityName,
                      item.name === location.name && styles.cityNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.cityCoords}>
                    {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarGlyph: {
    fontSize: 20,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  cityActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // Daily Challenge Card (Hero Banner)
  heroChallengeCard: {
    backgroundColor: '#ede9fe', // Soft Lavender matching screenshot
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  heroLeftColumn: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  heroChallengeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e1065',
    letterSpacing: -0.4,
  },
  heroChallengeSubtitle: {
    fontSize: 13,
    color: '#5b21b6',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '500',
  },
  habitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'transparent',
  },
  habitMiniBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ddd6fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#ede9fe',
  },
  habitMiniBubbleDone: {
    backgroundColor: '#10b981',
  },
  streakCountBadge: {
    backgroundColor: '#5b21b6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },
  streakCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  fireStreakBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 6,
  },
  fireStreakText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },

  // 3D Sacred Art Simulation in Hero
  heroGraphicArea: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  graphicSunOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fcd34d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  graphicSunCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicIcon: {
    fontSize: 28,
  },
  floatingGemBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingGemText: {
    fontSize: 14,
  },

  // Week Calendar Strip
  weekStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  dayPill: {
    width: 44,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayPillSelected: {
    backgroundColor: '#18181b', // Inverted dark pill matching screenshot
    borderColor: '#18181b',
    shadowColor: '#18181b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 4,
  },
  dayDotRegular: {
    backgroundColor: 'transparent',
  },
  dayDotToday: {
    backgroundColor: '#d97706',
  },
  dayDotSelected: {
    backgroundColor: '#ffffff',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717a',
    marginBottom: 2,
  },
  dayNameTextSelected: {
    color: '#a1a1aa',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  dayNumberTextSelected: {
    color: '#ffffff',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181b',
    letterSpacing: -0.4,
  },
  cityLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  cityLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    maxWidth: 130,
  },

  // Bento Grid
  bentoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  bentoTallCard: {
    flex: 1.1,
    borderRadius: 26,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412',
  },
  tallCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#431407',
    letterSpacing: -0.3,
  },
  tallCardDate: {
    fontSize: 13,
    color: '#9a3412',
    fontWeight: '600',
    marginTop: 4,
  },
  tallCardTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 2,
  },
  tallCardSubtitle: {
    fontSize: 12,
    color: '#7c2d12',
    marginTop: 6,
    lineHeight: 16,
  },
  rahuKaalInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 226, 226, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  rahuKaalInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  tallCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 16,
    marginTop: 10,
  },
  trainerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tallFooterRole: {
    fontSize: 10,
    color: '#7c2d12',
    fontWeight: '600',
  },
  tallFooterName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#431407',
  },

  // Bento Right Column
  bentoRightColumn: {
    flex: 1,
    gap: 12,
    backgroundColor: 'transparent',
  },
  bentoRightCardTop: {
    borderRadius: 24,
    padding: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTagPillSky: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardTagTextSky: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369a1',
  },
  rightCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c4a6e',
  },
  rightCardMantra: {
    fontSize: 11,
    color: '#0369a1',
    marginTop: 4,
    lineHeight: 15,
  },
  rightCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  japaLaunchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },

  bentoRightCardBottom: {
    borderRadius: 24,
    padding: 14,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTagPillPink: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  cardTagTextPink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#be185d',
  },
  bottomCardNotice: {
    fontSize: 11,
    color: '#831843',
    fontWeight: '600',
    marginBottom: 8,
  },
  quickIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  quickCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickCircleEmoji: {
    fontSize: 15,
  },

  // Sun & Moon Times Strip
  sunStripRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  sunItemEmoji: {
    fontSize: 20,
  },
  sunItemLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  sunItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181b',
  },
  sunDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e4e4e7',
  },

  // =======================================================
  // MUHURTA DAY PLANNER STYLES
  // =======================================================
  plannerSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  plannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  plannerSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
    letterSpacing: -0.3,
  },
  plannerSectionSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  plannerProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  plannerProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  plannerFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  plannerFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
  },
  plannerFilterTabActive: {
    backgroundColor: '#18181b',
  },
  plannerFilterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  plannerFilterTabTextActive: {
    color: '#ffffff',
  },
  plannerCardsContainer: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  plannerSlotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  plannerSlotCardCurrent: {
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    backgroundColor: '#fffdfa',
  },
  plannerSlotCardAshubh: {
    borderColor: '#fecaca',
    backgroundColor: '#fffdfd',
  },
  plannerSlotCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  slotTimeBlock: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  slotTimeRange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 1,
  },
  currentActiveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  qualityBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qualityBadgeMahashubh: {
    backgroundColor: '#ecfdf5',
  },
  qualityBadgeAshubh: {
    backgroundColor: '#fef2f2',
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  qualityBadgeTextMahashubh: {
    color: '#047857',
  },
  qualityBadgeTextAshubh: {
    color: '#b91c1c',
  },
  suitabilityBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  suitabilityBoxAshubh: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  suitabilityHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  suitabilityText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#334155',
  },
  suitabilityTextAshubh: {
    color: '#991b1b',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  suggestionChip: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  suggestionChipText: {
    fontSize: 10,
    color: '#52525b',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  inputRowDone: {
    backgroundColor: '#dcfce7',
  },
  checkCircleBtn: {
    padding: 2,
  },
  slotTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
    paddingVertical: 4,
  },
  slotTextInputDone: {
    color: '#15803d',
    textDecorationLine: 'line-through',
  },
  clearSlotBtn: {
    padding: 4,
  },

  // Limbs Accordion
  limbsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  limbsHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
  },
  limbsContainer: {
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  limbCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  limbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  limbIndex: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  limbStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  limbName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
  },
  limbFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  limbEnd: {
    fontSize: 11,
    color: '#71717a',
  },
  limbDeity: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
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
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  sankalpaPillHeader: {
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  sankalpaPillLocation: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  sankalpaPillDate: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 2,
  },
  sankalpaSanskrit: {
    fontSize: 15,
    lineHeight: 24,
    color: '#18181b',
    fontWeight: '600',
  },
  meaningDivider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginVertical: 12,
  },
  meaningLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3f3f46',
  },
  modalFooterBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#3f3f46',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  doneBtn: {
    flex: 2,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
  },
  doneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Habit Checklist
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  habitRowDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  habitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconBoxDone: {
    backgroundColor: '#10b981',
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181b',
  },
  habitTitleDone: {
    color: '#15803d',
    textDecorationLine: 'line-through',
  },
  habitDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  habitTime: {
    fontSize: 10,
    color: '#d97706',
    marginTop: 2,
    fontWeight: '600',
  },

  // Verse Modal
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  contextPillText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },
  verseSanskrit: {
    fontSize: 16,
    lineHeight: 26,
    color: '#18181b',
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
  },
  verseTranslit: {
    fontSize: 12,
    lineHeight: 18,
    color: '#71717a',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },

  // City modal
  gpsBanner: {
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
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
    paddingHorizontal: 8,
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
    fontWeight: '700',
  },
  cityCoords: {
    fontSize: 12,
    color: '#a1a1aa',
  },
});
