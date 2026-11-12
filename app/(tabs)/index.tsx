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
  addTodoToSlot,
  toggleTodoItem,
  deleteTodoItem,
  getLiveCosmicStatus,
  generateWhatsAppPanchangShare,
  DayPlannerSlot,
  DayPlansMap,
  LiveCosmicStatus,
  TodoItem,
} from '@/src/services/dayplanner';
import {
  loadUserProfile,
  loadUserLocation,
  saveUserLocation,
  UserSacredProfile,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
import { playTempleBell, triggerHaptic } from '@/src/services/sacredAudio';
import { scheduleDailySacredReminders } from '@/src/services/sacredNotifications';
import { DailyPanchangCardModal } from '@/src/components/DailyPanchangCardModal';
import { AppTourModal } from '@/src/components/AppTourModal';
import { hasSeenAppTour, markAppTourCompleted } from '@/src/services/appTour';

export default function PanchangScreen() {
  const insets = useSafeAreaInsets();
  const { language, calendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [location, setLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sacred Profile & Audio
  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [isShareCardModalVisible, setIsShareCardModalVisible] = useState(false);

  // First-Time App Tour state
  const [isTourModalVisible, setIsTourModalVisible] = useState(false);

  useEffect(() => {
    hasSeenAppTour().then((seen) => {
      if (!seen) {
        setIsTourModalVisible(true);
      }
    });
  }, []);

  const handleCloseTour = async () => {
    setIsTourModalVisible(false);
    await markAppTourCompleted();
  };

  // Modals for deep Hindu daily routine
  const [isSankalpaModalVisible, setIsSankalpaModalVisible] = useState(false);
  const [isSadhanaModalVisible, setIsSadhanaModalVisible] = useState(false);
  const [isVerseModalVisible, setIsVerseModalVisible] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<ShastricVerse>(SACRED_DAILY_VERSES[0]);
  const [isLimbsExpanded, setIsLimbsExpanded] = useState(false);

  // Sadhana tracking state
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState<number>(1);

  // Day Planner state: 'core' (default clean), 'all' (24h), 'planned' (my tasks)
  const [dayPlans, setDayPlans] = useState<DayPlansMap>({});
  const [plannerFilter, setPlannerFilter] = useState<'core' | 'all' | 'planned'>('core');
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

  useEffect(() => {
    loadUserLocation().then(setLocation);
  }, []);

  useEffect(() => {
    loadUserProfile().then((p) => {
      setUserProfile(p);
      if (panchang) {
        scheduleDailySacredReminders(panchang, p, dayPlans, location.timezone, 7, location);
      }
    });
  }, [panchang, dayPlans, location]);

  const dailySankalpa = useMemo(() => {
    return generateDailySankalpa(panchang, location.name, userProfile.name, userProfile.gotra);
  }, [panchang, location.name, userProfile.name, userProfile.gotra]);

  // Live Cosmic Status (Real-time pulse of right now)
  const liveStatus: LiveCosmicStatus = useMemo(() => {
    return getLiveCosmicStatus(panchang, new Date(), location.timezone);
  }, [panchang, location.timezone]);

  // Day Planner Slots
  const plannerSlots = useMemo(() => {
    return buildDayPlannerSlots(panchang, new Date());
  }, [panchang]);

  const totalPlannedCount = useMemo(() => {
    return Object.values(dayPlans).reduce((acc, plan) => {
      const count = plan.todos && plan.todos.length > 0 ? plan.todos.length : plan.taskText ? 1 : 0;
      return acc + count;
    }, 0);
  }, [dayPlans]);

  const totalCompletedCount = useMemo(() => {
    return Object.values(dayPlans).reduce((acc, plan) => {
      if (plan.todos && plan.todos.length > 0) {
        return acc + plan.todos.filter((t) => t.isCompleted).length;
      }
      return acc + (plan.taskText && plan.isCompleted ? 1 : 0);
    }, 0);
  }, [dayPlans]);

  const filteredSlots = useMemo(() => {
    if (plannerFilter === 'core') {
      return plannerSlots.filter((s) => {
        const plan = dayPlans[s.id];
        const hasTasks = (plan?.todos && plan.todos.length > 0) || Boolean(plan?.taskText);
        return s.isCore || hasTasks;
      });
    }
    if (plannerFilter === 'planned') {
      return plannerSlots.filter((s) => {
        const plan = dayPlans[s.id];
        return (plan?.todos && plan.todos.length > 0) || Boolean(plan?.taskText);
      });
    }
    return plannerSlots;
  }, [plannerSlots, plannerFilter, dayPlans]);

  const handleInputChange = (slotId: string, text: string) => {
    setEditingInputs((prev) => ({ ...prev, [slotId]: text }));
  };

  const handleAddTodo = async (slotId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = await addTodoToSlot(dateKey, slotId, trimmed);
    setDayPlans(updated);
    setEditingInputs((prev) => ({ ...prev, [slotId]: '' }));
  };

  const handleApplySuggestion = async (slotId: string, suggestion: string) => {
    const updated = await addTodoToSlot(dateKey, slotId, suggestion);
    setDayPlans(updated);
  };

  const handleToggleTodo = async (slotId: string, todoId: string) => {
    const updated = await toggleTodoItem(dateKey, slotId, todoId);
    setDayPlans(updated);
  };

  const handleDeleteTodo = async (slotId: string, todoId: string) => {
    const updated = await deleteTodoItem(dateKey, slotId, todoId);
    setDayPlans(updated);
  };

  const handleSavePlan = async (slotId: string, text: string) => {
    const currentCompleted = dayPlans[slotId]?.isCompleted || false;
    const updated = await saveSlotPlan(dateKey, slotId, text, currentCompleted);
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
    saveUserLocation(city).catch(() => {});
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

      const detectedLocation: GeoLocation = {
        name: isHi ? 'वर्तमान स्थान' : 'Current GPS City',
        latitude,
        longitude,
        altitude: altitude ?? 0,
        timezone: detectedTz,
      };
      saveUserLocation(detectedLocation).catch(() => {});
      setLocation(detectedLocation);
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

  // 1-Tap Viral WhatsApp Daily Panchang Share
  const handleShareWhatsAppPanchang = async () => {
    try {
      const message = generateWhatsAppPanchangShare(
        panchang,
        currentDate,
        location.name,
        location.timezone,
        isHi
      );
      await Share.share({ message });
    } catch {
      // ignore
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
      style={{ flex: 1, backgroundColor: '#f8f8fa' }}
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
          {/* TOP PROFILE, GREETING & VIRAL SHARE BAR                  */}
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
                {isHi
                  ? `${spiritualPeriod.greetingHi}${userProfile.name ? `, ${userProfile.name}` : ''}`
                  : `${spiritualPeriod.greetingEn}${userProfile.name ? `, ${userProfile.name}` : ''}`}
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

            <View style={styles.headerActionsGroup}>
              {/* Sacred Temple Brass Bell Chime */}
              <TouchableOpacity
                testID="header-bell-btn"
                style={styles.bellActionBtn}
                onPress={async () => {
                  await triggerHaptic('tap', userProfile.hapticsEnabled);
                  playTempleBell(0.8);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16 }}>🔔</Text>
              </TouchableOpacity>

              {/* Viral 1-Tap WhatsApp Daily Share Card Button */}
              <TouchableOpacity
                testID="header-share-btn"
                style={styles.whatsAppShareBtn}
                onPress={async () => {
                  await triggerHaptic('tap', userProfile.hapticsEnabled);
                  setIsShareCardModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                <Text style={styles.whatsAppShareBtnText}>
                  {isHi ? 'शेयर कार्ड' : 'Share'}
                </Text>
              </TouchableOpacity>

              {/* City selector search button */}
              <TouchableOpacity
                testID="header-city-btn"
                style={styles.cityActionBtn}
                onPress={() => setIsCityModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="search-outline" size={18} color="#18181b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 1. HORIZONTAL 7-DAY SACRED HORIZON STRIP (Top Level)      */}
          {/* ========================================================= */}
          <View style={styles.weekStripContainer}>
            {weekDays.map((d, index) => {
              const isSelected = d.toDateString() === currentDate.toDateString();
              const dayNum = d.getDate();
              const isToday = d.toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={index}
                  testID={isSelected ? 'day-pill-selected' : `day-pill-${index}`}
                  style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                  onPress={() => handleSelectDate(d)}
                  activeOpacity={0.8}
                >
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
          {/* 2. LIVE COSMIC COMPASS (Now & Next Instant Guidance)      */}
          {/* ========================================================= */}
          <View
            style={[
              styles.liveCosmicBanner,
              {
                backgroundColor: liveStatus.badgeBg,
                borderColor: liveStatus.accentColor,
              },
            ]}
          >
            <View style={styles.liveCosmicTopRow}>
              <View style={styles.livePulseGroup}>
                <View
                  style={[
                    styles.livePulseDot,
                    { backgroundColor: liveStatus.accentColor },
                  ]}
                />
                <Text
                  style={[
                    styles.liveCosmicBadgeText,
                    { color: liveStatus.accentColor },
                  ]}
                >
                  {isHi ? liveStatus.badgeHi : liveStatus.badgeEn}
                </Text>
              </View>
              <Text style={styles.liveCosmicWindow}>
                {isHi ? liveStatus.windowHi : liveStatus.windowEn}
              </Text>
            </View>

            <Text style={styles.liveCosmicTitle}>
              {isHi ? liveStatus.titleHi : liveStatus.titleEn}
            </Text>

            <Text style={styles.liveCosmicDesc} numberOfLines={2}>
              {isHi ? liveStatus.descriptionHi : liveStatus.descriptionEn}
            </Text>
          </View>

          {/* ========================================================= */}
          {/* 3. SACRED ALIGNMENT HUB (Sadhana & Vedic Sankalpa)        */}
          {/* ========================================================= */}
          <View style={styles.sacredAlignmentRow}>
            {/* Left Card: Daily Sadhana Checklist */}
            <TouchableOpacity
              testID="hero-challenge-card"
              style={styles.sacredAlignmentCardLeft}
              activeOpacity={0.88}
              onPress={() => setIsSadhanaModalVisible(true)}
            >
              <View style={styles.alignmentCardHeader}>
                <Text style={styles.alignmentCardTag}>
                  {isHi ? '📿 नित्यकर्म साधना' : '📿 Daily Sadhana'}
                </Text>
                {streakCount > 0 && (
                  <Text style={styles.alignmentCardStreak}>🔥 {streakCount}d</Text>
                )}
              </View>
              <Text style={styles.alignmentCardTitle}>
                {isHi ? 'दैनिक सूक्ष्म साधनाएं' : '5 Sacred Micro-Habits'}
              </Text>
              <Text style={styles.alignmentCardSub} numberOfLines={1}>
                {completedHabits.length}/5 {isHi ? 'साधनाएं पूर्ण' : 'habits completed'}
              </Text>
              <View style={styles.alignmentCardFooter}>
                <Text style={styles.alignmentCardAction}>
                  {isHi ? 'चेकलिस्ट देखें →' : 'View Checklist →'}
                </Text>
                <Ionicons name="checkmark-done" size={14} color="#047857" />
              </View>
            </TouchableOpacity>

            {/* Right Card: Vedic Sankalpa Recital */}
            <TouchableOpacity
              testID="bento-tall-card"
              style={styles.sacredAlignmentCardRight}
              activeOpacity={0.88}
              onPress={() => setIsSankalpaModalVisible(true)}
            >
              <View style={styles.alignmentCardHeader}>
                <Text style={styles.alignmentCardTag}>
                  {isHi ? '📜 दैनिक सङ्कल्प' : '📜 Vedic Sankalpa'}
                </Text>
                <Text style={styles.alignmentCardStreak}>
                  {isHi ? 'आज का व्रत' : 'Daily Vow'}
                </Text>
              </View>
              <Text style={styles.alignmentCardTitle} numberOfLines={1}>
                {userProfile.gotra ? `${userProfile.gotra} गोत्र` : isHi ? 'वैदिक संकल्प' : 'Vedic Vow'}
              </Text>
              <Text style={styles.alignmentCardSub} numberOfLines={1}>
                {activeMasa} • {panchang.tithi.current.nameDevanagari || panchang.tithi.current.name}
              </Text>
              <View style={styles.alignmentCardFooter}>
                <Text style={styles.alignmentCardAction}>
                  {isHi ? 'सङ्कल्प लें →' : 'Recite Vow →'}
                </Text>
                <Ionicons name="arrow-forward" size={13} color="#b45309" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ========================================================= */}
          {/* 4. THE HEART: HINDU DAY PLANNER (Front & Center!)         */}
          {/* ========================================================= */}
          {isCalculating ? (
            <LoadingIndicator
              message={isHi ? 'शुभ मुहूर्त दिनचर्या लोड हो रही है...' : 'Calculating Hindu Day Planner...'}
            />
          ) : (
            <>
              <View style={styles.plannerSection}>
              <View style={styles.plannerHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8, backgroundColor: 'transparent' }}>
                  <Text style={styles.plannerSectionTitle}>
                    {isHi ? '🗓️ आज की दिन योजना (Day Planner)' : '🗓️ Hindu Day Planner'}
                  </Text>
                  <Text style={styles.plannerSectionSub}>
                    {isHi
                      ? 'शास्त्रसम्मत शुभ काल के अनुसार अपने कार्यों का नियोजन करें'
                      : 'Schedule tasks aligned with auspicious cosmic timings'}
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

              {/* Filter Tabs: Core vs All 24h vs Planned */}
              <View style={styles.plannerFilterRow}>
                <TouchableOpacity
                  testID="planner-tab-core"
                  style={[
                    styles.plannerFilterTab,
                    plannerFilter === 'core' && styles.plannerFilterTabActive,
                  ]}
                  onPress={() => setPlannerFilter('core')}
                >
                  <Text
                    style={[
                      styles.plannerFilterTabText,
                      plannerFilter === 'core' && styles.plannerFilterTabTextActive,
                    ]}
                  >
                    {isHi ? '🌟 मुख्य मुहूर्त' : '🌟 Core Windows'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="planner-tab-all"
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
                    {isHi ? '🕒 24h सम्पूर्ण' : '🕒 All 24h'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="planner-tab-planned"
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
                    {isHi
                      ? `✍️ नियोजित (${totalPlannedCount})`
                      : `✍️ Planned (${totalPlannedCount})`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Slot Cards List */}
              <View style={styles.plannerCardsContainer}>
                {filteredSlots.length === 0 ? (
                  <View style={styles.plannerEmptyBox}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📝</Text>
                    <Text style={styles.plannerEmptyTitle}>
                      {isHi ? 'कोई कार्य नियोजित नहीं है' : 'No tasks planned yet'}
                    </Text>
                    <Text style={styles.plannerEmptySubtitle}>
                      {isHi
                        ? 'ऊपर "मुख्य मुहूर्त" टैब पर जाएँ और अपने कार्यों को शुभ समय अनुसार जोड़ें।'
                        : 'Switch to "Core Windows" above to plan tasks during auspicious hours.'}
                    </Text>
                  </View>
                ) : (
                  filteredSlots.map((slot) => {
                    const plan = dayPlans[slot.id];
                    const todos: TodoItem[] =
                      plan?.todos && plan.todos.length > 0
                        ? plan.todos
                        : plan?.taskText
                        ? [
                            {
                              id: 'legacy',
                              text: plan.taskText,
                              isCompleted: Boolean(plan.isCompleted),
                              createdAt: plan.updatedAt || Date.now(),
                            },
                          ]
                        : [];

                    const slotDoneCount = todos.filter((t) => t.isCompleted).length;
                    const slotTotalCount = todos.length;
                    const isAllDone = slotTotalCount > 0 && slotDoneCount === slotTotalCount;
                    const inputValue = editingInputs[slot.id] || '';

                    // Quality styling
                    const isAshubh = slot.quality === 'Ashubh';
                    const isMahashubh =
                      slot.quality === 'Mahashubh' || slot.quality === 'Amrit';

                    return (
                      <View
                        key={slot.id}
                        style={[
                          styles.plannerSlotCard,
                          slot.isCurrent && styles.plannerSlotCardCurrent,
                          isAshubh && styles.plannerSlotCardAshubh,
                          isAllDone && styles.plannerSlotCardDone,
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

                            {slotTotalCount > 0 && (
                              <View
                                style={[
                                  styles.slotProgressBadge,
                                  isAllDone && styles.slotProgressBadgeDone,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.slotProgressBadgeText,
                                    isAllDone && styles.slotProgressBadgeTextDone,
                                  ]}
                                >
                                  {isAllDone
                                    ? isHi ? '✓ पूर्ण' : '✓ Done'
                                    : `🎯 ${slotDoneCount}/${slotTotalCount}`}
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
                              : isHi ? '💡 यह समय किस कार्य के लिए है:' : '💡 What this time is for:'}
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

                        {/* Suggested Quick Chips (Tap to instantly add to To-Do list) */}
                        <View style={styles.quickChipsRow}>
                          {(isHi ? slot.suggestedTasksHi : slot.suggestedTasks).map((suggestion, sIdx) => (
                            <TouchableOpacity
                              key={sIdx}
                              style={styles.suggestionChip}
                              onPress={() => handleApplySuggestion(slot.id, suggestion)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.suggestionChipText}>+ {suggestion}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* To-Do Checklist Items */}
                        {todos.length > 0 && (
                          <View style={styles.slotTodoList}>
                            {todos.map((todo) => (
                              <View key={todo.id} style={styles.todoItemRow}>
                                <TouchableOpacity
                                  style={styles.todoCheckboxBtn}
                                  onPress={() => handleToggleTodo(slot.id, todo.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Ionicons
                                    name={todo.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={22}
                                    color={todo.isCompleted ? '#059669' : '#d97706'}
                                  />
                                </TouchableOpacity>

                                <Text
                                  style={[
                                    styles.todoItemText,
                                    todo.isCompleted && styles.todoItemTextDone,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {todo.text}
                                </Text>

                                <TouchableOpacity
                                  style={styles.todoDeleteBtn}
                                  onPress={() => handleDeleteTodo(slot.id, todo.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Ionicons name="close" size={18} color="#a1a1aa" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Inline Add Task Input */}
                        <View style={styles.addTodoInputRow}>
                          <Ionicons name="add" size={20} color="#b45309" style={{ marginLeft: 6 }} />
                          <TextInput
                            style={styles.addTodoTextInput}
                            placeholder={
                              isAshubh
                                ? isHi
                                  ? 'इस समय हेतु शांत कार्य जोड़ें...'
                                  : 'Add quiet chore for this slot...'
                                : isHi
                                ? 'इस मुहूर्त में अपना कार्य जोड़ें...'
                                : 'Add task for this auspicious window...'
                            }
                            placeholderTextColor="#a1a1aa"
                            value={inputValue}
                            onChangeText={(txt) => handleInputChange(slot.id, txt)}
                            returnKeyType="done"
                            onSubmitEditing={() => handleAddTodo(slot.id, inputValue)}
                          />

                          {inputValue.trim().length > 0 && (
                            <TouchableOpacity
                              style={styles.addTodoSubmitBtn}
                              onPress={() => handleAddTodo(slot.id, inputValue)}
                            >
                              <Text style={styles.addTodoSubmitBtnText}>{isHi ? 'जोड़ें' : 'Add'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* ======================================================= */}
              {/* 5. QUICK ASTRONOMICAL GLANCE BAR                        */}
              {/* ======================================================= */}
              <View style={styles.quickAstroRow}>
                <View style={styles.quickAstroItem}>
                  <Text style={styles.quickAstroEmoji}>🌅</Text>
                  <View style={{ backgroundColor: 'transparent' }}>
                    <Text style={styles.quickAstroLabel}>{isHi ? 'सूर्योदय' : 'Sunrise'}</Text>
                    <Text style={styles.quickAstroVal}>{formatTime(panchang.sunTimes.sunrise)}</Text>
                  </View>
                </View>

                <View style={styles.quickAstroDivider} />

                <View style={styles.quickAstroItem}>
                  <Text style={styles.quickAstroEmoji}>🌇</Text>
                  <View style={{ backgroundColor: 'transparent' }}>
                    <Text style={styles.quickAstroLabel}>{isHi ? 'सूर्यास्त' : 'Sunset'}</Text>
                    <Text style={styles.quickAstroVal}>{formatTime(panchang.sunTimes.sunset)}</Text>
                  </View>
                </View>

                <View style={styles.quickAstroDivider} />

                <View style={styles.quickAstroItem}>
                  <Text style={styles.quickAstroEmoji}>⚠️</Text>
                  <View style={{ backgroundColor: 'transparent' }}>
                    <Text style={[styles.quickAstroLabel, { color: '#b91c1c' }]}>
                      {isHi ? 'राहु काल' : 'Rahu'}
                    </Text>
                    <Text style={[styles.quickAstroVal, { color: '#b91c1c' }]}>
                      {formatTime(panchang.muhurtas.rahuKaal.startTime)}
                    </Text>
                  </View>
                </View>

                <View style={styles.quickAstroDivider} />

                <TouchableOpacity
                  style={styles.quickAstroItem}
                  onPress={() => router.push('/(tabs)/prayers' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAstroEmoji}>🔱</Text>
                  <View style={{ backgroundColor: 'transparent' }}>
                    <Text style={styles.quickAstroLabel}>{isHi ? 'वार देव' : 'Deity'}</Text>
                    <Text style={styles.quickAstroVal} numberOfLines={1}>
                      {isHi ? weekdayDevata.deityNameHi.split(' ')[0] : weekdayDevata.deityName.split(' ')[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                  {userProfile.gotra ? (
                    <Text style={[styles.sankalpaPillDate, { color: '#b45309', fontWeight: '700' }]}>
                      गोत्र: {userProfile.gotra} {userProfile.name ? `• यजमान: ${userProfile.name}` : ''}
                    </Text>
                  ) : null}
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
                <View style={{ backgroundColor: 'transparent' }}>
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

                      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
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
                testID="sadhana-save-btn"
                style={styles.sadhanaDoneBtn}
                onPress={() => setIsSadhanaModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sadhanaDoneBtnText}>
                  ✓ {isHi ? 'साधना सहेजें' : 'Save Sadhana'} ({completedHabits.length}/5)
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
                <View style={{ backgroundColor: 'transparent' }}>
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

        {/* Viral WhatsApp 1-Tap Daily Panchang Card Generator Modal */}
        <DailyPanchangCardModal
          visible={isShareCardModalVisible}
          onClose={() => setIsShareCardModalVisible(false)}
          panchang={panchang}
          cityName={location.name}
          devataInfo={weekdayDevata}
          verse={selectedVerse}
        />

        {/* First-Time User App Tour Walkthrough Modal */}
        <AppTourModal
          visible={isTourModalVisible}
          onClose={handleCloseTour}
          isHi={isHi}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
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
    fontSize: 19,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18181b',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  bellActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#25d366', // Authentic WhatsApp Green
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsAppShareBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cityActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Live Cosmic Pulse Banner
  liveCosmicBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  liveCosmicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  livePulseGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveCosmicBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  liveCosmicWindow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525b',
  },
  liveCosmicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 2,
  },
  liveCosmicDesc: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Daily Challenge Card (Hero Banner)
  heroChallengeCard: {
    backgroundColor: '#ede9fe', // Soft Lavender matching screenshot
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  heroLeftColumn: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  heroChallengeTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#2e1065',
    letterSpacing: -0.4,
  },
  heroChallengeSubtitle: {
    fontSize: 12,
    color: '#5b21b6',
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '500',
  },
  habitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  graphicSunOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fcd34d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  graphicSunCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicIcon: {
    fontSize: 26,
  },
  floatingGemBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingGemText: {
    fontSize: 13,
  },

  // Sacred Alignment Dual-Card Quick Hub
  sacredAlignmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sacredAlignmentCardLeft: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#fef3c7', // Warm amber cream
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
  },
  sacredAlignmentCardRight: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#ffedd5', // Warm peach saffron
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
  },
  alignmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  alignmentCardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alignmentCardStreak: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  alignmentCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 2,
  },
  alignmentCardSub: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
  alignmentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'transparent',
  },
  alignmentCardAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },

  // Quick Astro Glance Bar below planner
  quickAstroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickAstroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  quickAstroEmoji: {
    fontSize: 16,
  },
  quickAstroLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717a',
  },
  quickAstroVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  quickAstroDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e4e4e7',
  },

  // Week Calendar Strip
  weekStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  dayPill: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dayPillSelected: {
    backgroundColor: '#b45309', // Sacred Kesariya / Amber active day pill
    borderColor: '#92400e',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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
    fontSize: 15,
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
    fontSize: 21,
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
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  bentoTallCard: {
    flex: 1.1,
    borderRadius: 24,
    padding: 15,
    justifyContent: 'space-between',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412',
  },
  tallCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#431407',
    letterSpacing: -0.3,
  },
  tallCardDate: {
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '600',
    marginTop: 2,
  },
  tallCardTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 2,
  },
  tallCardSubtitle: {
    fontSize: 11,
    color: '#7c2d12',
    marginTop: 5,
    lineHeight: 15,
  },
  rahuKaalInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 226, 226, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 7,
    borderRadius: 14,
    marginTop: 10,
  },
  trainerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    borderRadius: 22,
    padding: 13,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTagPillSky: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
    marginBottom: 5,
  },
  cardTagTextSky: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369a1',
  },
  rightCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0c4a6e',
  },
  rightCardMantra: {
    fontSize: 11,
    color: '#0369a1',
    marginTop: 3,
    lineHeight: 14,
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
    borderRadius: 22,
    padding: 13,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTagPillPink: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
  },

  // Sun & Moon Times Strip
  sunStripRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'transparent',
  },
  sunItemEmoji: {
    fontSize: 18,
  },
  sunItemLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '500',
  },
  sunItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  sunDivider: {
    width: 1,
    height: 22,
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
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  plannerSectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18181b',
    letterSpacing: -0.3,
  },
  plannerSectionSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
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
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  plannerFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  plannerFilterTabActive: {
    backgroundColor: '#b45309',
    borderColor: '#92400e',
  },
  plannerFilterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525b',
  },
  plannerFilterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  plannerCardsContainer: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  plannerEmptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  plannerEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
  },
  plannerEmptySubtitle: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  plannerSlotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  plannerSlotCardCurrent: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  plannerSlotCardAshubh: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  plannerSlotCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
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
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  slotTimeRange: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 1,
  },
  currentActiveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentActiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  qualityBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qualityBadgeMahashubh: {
    backgroundColor: '#dcfce7',
  },
  qualityBadgeAshubh: {
    backgroundColor: '#fee2e2',
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369a1',
  },
  qualityBadgeTextMahashubh: {
    color: '#15803d',
  },
  qualityBadgeTextAshubh: {
    color: '#b91c1c',
  },
  suitabilityBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  suitabilityBoxAshubh: {
    backgroundColor: '#ffe4e6',
  },
  suitabilityHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  suitabilityText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '500',
  },
  suitabilityTextAshubh: {
    color: '#9f1239',
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#52525b',
    fontWeight: '600',
  },
  slotProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  slotProgressBadgeDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  slotProgressBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  slotProgressBadgeTextDone: {
    color: '#15803d',
  },
  slotTodoList: {
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  todoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  todoCheckboxBtn: {
    paddingRight: 8,
    paddingVertical: 2,
  },
  todoItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 18,
  },
  todoItemTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: '400',
  },
  todoDeleteBtn: {
    padding: 4,
    marginLeft: 6,
  },
  addTodoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: 40,
    paddingHorizontal: 4,
  },
  addTodoTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addTodoSubmitBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  addTodoSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  inputRowDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  checkCircleBtn: {
    padding: 4,
  },
  slotTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
    fontWeight: '500',
    paddingVertical: 6,
  },
  slotTextInputDone: {
    color: '#047857',
    textDecorationLine: 'line-through',
  },
  clearSlotBtn: {
    padding: 4,
  },

  // 5 Sacred Limbs Accordion
  limbsHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
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
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  limbCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  limbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  limbIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
  },
  limbStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  limbName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
  },
  limbFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  limbEnd: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  limbDeity: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
  },

  // Modals
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
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  sankalpaPillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  sankalpaPillLocation: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  sankalpaPillDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  sankalpaSanskrit: {
    fontSize: 14,
    lineHeight: 22,
    color: '#18181b',
    fontWeight: '600',
    backgroundColor: '#fafaf9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  meaningDivider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginVertical: 12,
  },
  meaningLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#27272a',
  },
  modalFooterBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25d366',
    paddingVertical: 13,
    borderRadius: 16,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#b45309', // Sacred Kesariya / Amber instead of jet black
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sadhanaDoneBtn: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#047857', // Sacred emerald green matching completed habits
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sadhanaDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Habits List in Modal
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  habitRowDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
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
    color: '#047857',
  },
  habitDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    lineHeight: 15,
  },
  habitTime: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 4,
  },

  // Verse Modal
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  verseSanskrit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
    lineHeight: 24,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  verseTranslit: {
    fontSize: 12,
    color: '#78350f',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },

  // City Modal
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
  },
});
