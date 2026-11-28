import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { TourTarget } from '@/src/components/TourTarget';

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
  addTodoToSlot,
  toggleTodoItem,
  deleteTodoItem,
  getLiveCosmicStatus,
  DayPlansMap,
  LiveCosmicStatus,
  TodoItem,
} from '@/src/services/dayplanner';
import {
  loadUserProfile,
  saveUserProfile,
  loadUserLocation,
  UserSacredProfile,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
import { playTempleBell, triggerHaptic } from '@/src/services/sacredAudio';
import { scheduleDailySacredReminders } from '@/src/services/sacredNotifications';
import { DailyPanchangCardModal } from '@/src/components/DailyPanchangCardModal';
import { AppTourModal } from '@/src/components/AppTourModal';
import { markAppTourCompleted } from '@/src/services/appTour';
import { MonthlyCalendarGrid } from '@/src/components/MonthlyCalendarGrid';
import { calculateEkadashiParana } from '@/src/services/vratParana';
import { getTodayVratGuidance } from '@/src/services/vratGuidelines';
import { VratHeroCard } from '@/src/components/VratHeroCard';
import { DailyRashiCard } from '@/src/components/DailyRashiCard';
import { useTour } from '@/src/services/appTourContext';
import { useTourScroll } from '@/src/hooks/useTourScroll';
import { displayProfileName, getAppTheme, MIN_TOUCH_TARGET, COMFORT_TOUCH_TARGET, Typography } from '@/src/utils/theme';

export default function PanchangScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isCompactLayout = windowWidth < 380 || PixelRatio.getFontScale() > 1.25;
  const { language, setLanguage, calendarSystem } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'planner' | 'monthly'>('daily');
  const [plannerFilter, setPlannerFilter] = useState<'core' | 'all' | 'planned'>('core');
  const [location, setLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sacred Profile & Audio
  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [isShareCardModalVisible, setIsShareCardModalVisible] = useState(false);

  // Tour & Contextual Guidance
  const {
    isInteractiveTourActive,
    isTryModeActive,
    currentTourStep,
    openHelp,
    updateTourRuntimeContext,
    refreshTourPersistence,
  } = useTour();
  const mainScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)', mainScrollRef);

  const [manualViewStepId, setManualViewStepId] = useState<string | null>(null);
  const [manualPlannerStepId, setManualPlannerStepId] = useState<string | null>(null);

  const effectiveViewMode: 'daily' | 'planner' | 'monthly' =
    isInteractiveTourActive &&
    currentTourStep?.tab === '/(tabs)' &&
    currentTourStep.viewMode &&
    manualViewStepId !== currentTourStep.id
      ? currentTourStep.viewMode
      : viewMode;
  const effectivePlannerFilter: 'core' | 'all' | 'planned' =
    isInteractiveTourActive &&
    currentTourStep?.tab === '/(tabs)' &&
    currentTourStep.plannerSubTab &&
    manualPlannerStepId !== currentTourStep.id
      ? currentTourStep.plannerSubTab
      : plannerFilter;

  // First-Time App Tour state
  const [isTourModalVisible, setIsTourModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    refreshTourPersistence()
      .then((snap) => {
        if (mounted && !snap.hasCompletedTour) {
          setIsTourModalVisible(true);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [refreshTourPersistence]);

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
  const [editingInputs, setEditingInputs] = useState<Record<string, string>>({});

  // Serialize AsyncStorage read-modify-write mutations to prevent rapid-tap race conditions
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const enqueueMutation = useCallback((fn: () => Promise<void>) => {
    mutationQueueRef.current = mutationQueueRef.current.then(fn, fn).catch(() => {});
    return mutationQueueRef.current;
  }, []);

  const dateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const todayKey = getDateKey(new Date());
  const isSelectedToday = dateKey === todayKey;

  // Load Sadhana habits and Day Plans for current date without prefilling editingInputs
  useEffect(() => {
    let mounted = true;
    Promise.all([getCompletedHabits(dateKey), getSadhanaStreak(), getDayPlans(dateKey)])
      .then(([completed, streak, plans]) => {
        if (!mounted) return;
        setCompletedHabits(completed);
        setStreakCount(streak);
        setDayPlans(plans);
        setEditingInputs({});
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [dateKey]);

  const handleToggleHabit = async (habitId: string) => {
    await enqueueMutation(async () => {
      const res = await toggleHabitCompletion(habitId, dateKey);
      setCompletedHabits(res.completedIds);
      setStreakCount(res.streak);
    });
  };

  // 100% Offline Fast Ephemeris Calculation (< 1ms)
  const panchang: PanchangData = useMemo(() => {
    return calculatePanchang(currentDate, location, 'Lahiri', currentDate);
  }, [currentDate, location]);

  const todayPanchang: PanchangData = useMemo(() => {
    return isSelectedToday
      ? panchang
      : calculatePanchang(new Date(), location, 'Lahiri', new Date());
  }, [isSelectedToday, panchang, location]);

  const activeMasa =
    calendarSystem === 'amanta'
      ? isHi
        ? `${panchang.masa.amantaNameDevanagari} मास`
        : `${panchang.masa.amantaName} Masa`
      : isHi
      ? `${panchang.masa.purnimantaNameDevanagari} मास`
      : `${panchang.masa.purnimantaName} Masa`;

  const spiritualPeriod = useMemo(() => {
    const sunrise = todayPanchang.sunTimes.sunrise ? new Date(todayPanchang.sunTimes.sunrise) : undefined;
    const sunset = todayPanchang.sunTimes.sunset ? new Date(todayPanchang.sunTimes.sunset) : undefined;
    return getCurrentSpiritualPeriod(new Date(), sunrise, sunset);
  }, [todayPanchang]);

  const weekdayDevata = useMemo(() => {
    const day = currentDate.getDay();
    return WEEKDAY_DEVATAS[day] || WEEKDAY_DEVATAS[0];
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadUserLocation()
        .then((loc) => {
          if (!mounted) return;
          setLocation((prev) => {
            if (
              prev.name !== loc.name ||
              prev.latitude !== loc.latitude ||
              prev.longitude !== loc.longitude
            ) {
              return loc;
            }
            return prev;
          });
        })
        .catch(() => {});
      loadUserProfile()
        .then((p) => {
          if (mounted) setUserProfile(p);
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      loadUserProfile(),
      isSelectedToday ? Promise.resolve(dayPlans) : getDayPlans(todayKey),
    ])
      .then(([profile, todayPlans]) => {
        if (!mounted) return;
        scheduleDailySacredReminders(
          todayPanchang,
          profile,
          todayPlans,
          location.timezone,
          7,
          location,
          language
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [todayPanchang, todayKey, isSelectedToday, dayPlans, location, language]);

  const dailySankalpa = useMemo(() => {
    return generateDailySankalpa(panchang, location.name, userProfile.name, userProfile.gotra);
  }, [panchang, location.name, userProfile.name, userProfile.gotra]);

  const paranaInfo = useMemo(() => {
    return calculateEkadashiParana(panchang, location, currentDate);
  }, [panchang, location, currentDate]);

  const vratGuidance = useMemo(() => {
    return getTodayVratGuidance(panchang, currentDate, location.timezone);
  }, [panchang, currentDate, location.timezone]);

  const handleSaveRashi = useCallback(async (rashiIdx: number) => {
    setUserProfile((prev) => {
      const updated = { ...prev, rashi: rashiIdx };
      saveUserProfile(updated).catch(() => {});
      return updated;
    });
  }, []);

  // Live Cosmic Status (Real-time pulse of right now)
  const liveStatus: LiveCosmicStatus = useMemo(() => {
    return getLiveCosmicStatus(todayPanchang, new Date(), location.timezone);
  }, [todayPanchang, location.timezone]);

  // Day Planner Slots (highlight LIVE NOW only when inspecting today's date)
  const plannerSlots = useMemo(() => {
    const baseSlots = buildDayPlannerSlots(panchang, currentDate);
    return isSelectedToday
      ? baseSlots
      : baseSlots.map((slot) => ({ ...slot, isCurrent: false }));
  }, [panchang, currentDate, isSelectedToday]);

  // Tasks planned for the active cosmic window (today only)
  const activeSlotTodos = useMemo(() => {
    if (!isSelectedToday) return null;
    const currentSlot = plannerSlots.find((s) => s.isCurrent);
    if (!currentSlot) return null;
    const plan = dayPlans[currentSlot.id];
    if (!plan) return null;
    const pendingTodos = plan.todos
      ? plan.todos.filter((t) => !t.isCompleted)
      : plan.taskText && !plan.isCompleted
      ? [{ text: plan.taskText }]
      : [];
    if (pendingTodos.length === 0) return null;
    return {
      slot: currentSlot,
      tasks: pendingTodos,
    };
  }, [plannerSlots, dayPlans, isSelectedToday]);

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

  // Report live runtime telemetry for intelligent state-aware tour guidance
  useEffect(() => {
    updateTourRuntimeContext({
      plannedTaskCount: totalPlannedCount,
      completedSadhanaCount: completedHabits.length,
      isAbhijitAvailableToday: Boolean(panchang.muhurtas.abhijitMuhurta),
    });
  }, [
    totalPlannedCount,
    completedHabits.length,
    panchang.muhurtas.abhijitMuhurta,
    updateTourRuntimeContext,
  ]);

  const filteredSlots = useMemo(() => {
    if (effectivePlannerFilter === 'core') {
      return plannerSlots.filter((s) => {
        const plan = dayPlans[s.id];
        const hasTasks = (plan?.todos && plan.todos.length > 0) || Boolean(plan?.taskText);
        return s.isCore || hasTasks;
      });
    }
    if (effectivePlannerFilter === 'planned') {
      return plannerSlots.filter((s) => {
        const plan = dayPlans[s.id];
        return (plan?.todos && plan.todos.length > 0) || Boolean(plan?.taskText);
      });
    }
    return plannerSlots;
  }, [plannerSlots, effectivePlannerFilter, dayPlans]);

  const handleInputChange = (slotId: string, text: string) => {
    setEditingInputs((prev) => ({ ...prev, [slotId]: text }));
  };

  const handleAddTodo = async (slotId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setEditingInputs((prev) => ({ ...prev, [slotId]: '' }));
    await enqueueMutation(async () => {
      const updated = await addTodoToSlot(dateKey, slotId, trimmed);
      setDayPlans(updated);
    });
  };

  const handleApplySuggestion = async (slotId: string, suggestion: string) => {
    await enqueueMutation(async () => {
      const updated = await addTodoToSlot(dateKey, slotId, suggestion);
      setDayPlans(updated);
    });
  };

  const handleToggleTodo = async (slotId: string, todoId: string) => {
    await enqueueMutation(async () => {
      const updated = await toggleTodoItem(dateKey, slotId, todoId);
      setDayPlans(updated);
    });
  };

  const handleDeleteTodo = async (slotId: string, todoId: string) => {
    await enqueueMutation(async () => {
      const updated = await deleteTodoItem(dateKey, slotId, todoId);
      setDayPlans(updated);
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

  const handleCycleVerse = (dir: 1 | -1) => {
    const idx = SACRED_DAILY_VERSES.findIndex((v) => v.id === selectedVerse.id);
    const nextIdx =
      idx === -1
        ? 0
        : (idx + dir + SACRED_DAILY_VERSES.length) % SACRED_DAILY_VERSES.length;
    setSelectedVerse(SACRED_DAILY_VERSES[nextIdx]);
  };

  // Preserve import reference cleanly when user switches between date plans
  void saveSlotPlan;

  const handleShareSankalpa = async () => {
    try {
      await Share.share({
        message: `${dailySankalpa.sanskrit}\n\n[अर्थ]: ${dailySankalpa.hindi}\n\n📲 *सनातन ऍप डाउनलोड करें (Google Play):*\nhttps://play.google.com/store/apps/details?id=cc.sanatan.app\n🌐 https://sanatan.cc\n\n— सनातन पञ्चाङ्ग: हर सनातनी का प्रामाणिक दैनिक साथी`,
      });
    } catch {
      // ignore
    }
  };

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  // Reusable Hindu Day Planner Section
  const renderDayPlannerSection = () => (
    <View style={styles.plannerSection}>
      {/* Hindu Day Planner Header & Tabs Control Bar (Target for Step 11) */}
      <TourTarget targetId="planner-view-mode-container" borderRadius={18}>
        <View style={{ backgroundColor: 'transparent' }}>
          <View style={styles.plannerHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8, backgroundColor: 'transparent' }}>
              <Text style={[styles.plannerSectionTitle, isDark && { color: theme.text }]}>
                {isHi ? '🗓️ आज की दिन योजना (Day Planner)' : '🗓️ Hindu Day Planner'}
              </Text>
              <Text style={[styles.plannerSectionSub, isDark && { color: theme.textMuted }]}>
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
          <View style={[styles.plannerFilterRow, isDark && { backgroundColor: theme.cardMuted }, isCompactLayout && { flexWrap: 'wrap' }]}>
            <TourTarget targetId="planner-tab-core" borderRadius={12} style={{ flex: 1, minWidth: isCompactLayout ? '46%' : undefined }}>
              <TouchableOpacity
                testID="planner-tab-core"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? 'मुख्य मुहूर्त' : 'Core Windows'}
                accessibilityState={{ selected: effectivePlannerFilter === 'core' }}
                style={[
                  styles.plannerFilterTab,
                  { width: '100%', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
                  effectivePlannerFilter === 'core' && styles.plannerFilterTabActive,
                ]}
                onPress={() => {
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualPlannerStepId(currentTourStep.id);
                  }
                  setPlannerFilter('core');
                }}
              >
                <Text
                  style={[
                    styles.plannerFilterTabText,
                    isDark && { color: theme.textSecondary },
                    effectivePlannerFilter === 'core' && styles.plannerFilterTabTextActive,
                  ]}
                >
                  {isHi ? '🌟 मुख्य मुहूर्त' : '🌟 Core Times'}
                </Text>
              </TouchableOpacity>
            </TourTarget>

            <TourTarget targetId="planner-tab-all" borderRadius={12} style={{ flex: 1, minWidth: isCompactLayout ? '46%' : undefined }}>
              <TouchableOpacity
                testID="planner-tab-all"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? '24h सम्पूर्ण' : 'All 24h'}
                accessibilityState={{ selected: effectivePlannerFilter === 'all' }}
                style={[
                  styles.plannerFilterTab,
                  { width: '100%', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
                  effectivePlannerFilter === 'all' && styles.plannerFilterTabActive,
                ]}
                onPress={() => {
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualPlannerStepId(currentTourStep.id);
                  }
                  setPlannerFilter('all');
                }}
              >
                <Text
                  style={[
                    styles.plannerFilterTabText,
                    isDark && { color: theme.textSecondary },
                    effectivePlannerFilter === 'all' && styles.plannerFilterTabTextActive,
                  ]}
                >
                  {isHi ? '🕒 24h सम्पूर्ण' : '🕒 Full 24h'}
                </Text>
              </TouchableOpacity>
            </TourTarget>

            <TourTarget targetId="planner-tab-planned" borderRadius={12} style={{ flex: 1, minWidth: isCompactLayout ? '100%' : undefined }}>
              <TouchableOpacity
                testID="planner-tab-planned"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? 'नियोजित कार्य' : 'Planned tasks'}
                accessibilityState={{ selected: effectivePlannerFilter === 'planned' }}
                style={[
                  styles.plannerFilterTab,
                  { width: '100%', minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
                  effectivePlannerFilter === 'planned' && styles.plannerFilterTabActive,
                ]}
                onPress={() => {
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualPlannerStepId(currentTourStep.id);
                  }
                  setPlannerFilter('planned');
                }}
              >
                <Text
                  style={[
                    styles.plannerFilterTabText,
                    isDark && { color: theme.textSecondary },
                    effectivePlannerFilter === 'planned' && styles.plannerFilterTabTextActive,
                  ]}
                >
                  {isHi
                    ? `✍️ नियोजित (${totalPlannedCount})`
                    : `✍️ My Tasks (${totalPlannedCount})`}
                </Text>
              </TouchableOpacity>
            </TourTarget>
          </View>
        </View>
      </TourTarget>

      {/* Slot Cards List */}
      <View style={styles.plannerCardsContainer}>
        {filteredSlots.length === 0 ? (
          <View
            style={[
              styles.plannerEmptyBox,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📝</Text>
            <Text style={[styles.plannerEmptyTitle, isDark && { color: theme.text }]}>
              {isHi ? 'कोई कार्य नियोजित नहीं है' : 'No tasks planned yet'}
            </Text>
            <Text style={[styles.plannerEmptySubtitle, isDark && { color: theme.textMuted }]}>
              {isHi
                ? 'ऊपर "मुख्य मुहूर्त" टैब पर जाएँ और अपने कार्यों को शुभ समय अनुसार जोड़ें।'
                : 'Switch to "Core Windows" above to plan tasks during auspicious hours.'}
            </Text>
          </View>
        ) : (
          filteredSlots.map((slot, index) => {
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

            const cardNode = (
              <View
                key={slot.id}
                style={[
                  styles.plannerSlotCard,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  slot.isCurrent && styles.plannerSlotCardCurrent,
                  isAshubh && [styles.plannerSlotCardAshubh, isDark && { backgroundColor: '#271710', borderColor: theme.dangerBorder }],
                  isAllDone && [styles.plannerSlotCardDone, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }],
                ]}
              >
                {/* Top Time & Quality Row */}
                <View style={styles.slotTopRow}>
                  <View style={styles.slotTimeBlock}>
                    <Text style={[styles.slotTimeRange, isDark && { color: theme.primary }]}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Text>
                    <Text style={[styles.slotTitle, isDark && { color: theme.text }]}>
                      {isHi ? slot.titleHi : slot.title}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
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
                          isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                          isAllDone && [styles.slotProgressBadgeDone, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }],
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotProgressBadgeText,
                            isDark && { color: theme.primary },
                            isAllDone && [styles.slotProgressBadgeTextDone, isDark && { color: theme.successText }],
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
                        isDark && { backgroundColor: theme.infoBg },
                        isMahashubh && [styles.qualityBadgeMahashubh, isDark && { backgroundColor: theme.successBg }],
                        isAshubh && [styles.qualityBadgeAshubh, isDark && { backgroundColor: theme.dangerBg }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.qualityBadgeText,
                          isDark && { color: theme.infoText },
                          isMahashubh && [styles.qualityBadgeTextMahashubh, isDark && { color: theme.successText }],
                          isAshubh && [styles.qualityBadgeTextAshubh, isDark && { color: theme.dangerText }],
                        ]}
                      >
                        {isAshubh
                          ? isHi ? '⚠️ त्याज्य' : '⚠️ Avoid'
                          : isMahashubh
                          ? isHi ? '🌟 महाशुभ' : '🌟 Best'
                          : isHi ? '✨ शुभ' : '✨ Good'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* For What this time is for */}
                <View
                  style={[
                    styles.suitabilityBox,
                    isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
                    isAshubh && [styles.suitabilityBoxAshubh, isDark && { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder }],
                  ]}
                >
                  <Text style={[styles.suitabilityHeading, isDark && { color: theme.textSecondary }]}>
                    {isAshubh
                      ? isHi ? '⚠️ इस समय क्या न करें:' : '⚠️ What to avoid now:'
                      : isHi ? '💡 यह समय किस कार्य के लिए है:' : '💡 Best used for:'}
                  </Text>
                  <Text
                    style={[
                      styles.suitabilityText,
                      isDark && { color: theme.text },
                      isAshubh && [styles.suitabilityTextAshubh, isDark && { color: theme.dangerText }],
                    ]}
                  >
                    {isHi ? slot.suitabilityHi : slot.suitability}
                  </Text>
                </View>

                {/* Suggested Quick Chips (Tap to instantly add to To-Do list) */}
                {index === 0 ? (
                  <TourTarget targetId="planner-first-slot-card" borderRadius={14}>
                    <View style={styles.quickChipsRow}>
                      {(isHi ? slot.suggestedTasksHi : slot.suggestedTasks).map((suggestion, sIdx) => (
                        <TouchableOpacity
                          key={sIdx}
                          testID={`planner-subtask-chip-${sIdx}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${isHi ? 'जोड़ें' : 'Add'} ${suggestion}`}
                          style={[styles.suggestionChip, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                          onPress={() => handleApplySuggestion(slot.id, suggestion)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.suggestionChipText, isDark && { color: theme.textSecondary }]}>+ {suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TourTarget>
                ) : (
                  <View style={styles.quickChipsRow}>
                    {(isHi ? slot.suggestedTasksHi : slot.suggestedTasks).map((suggestion, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        testID={`planner-subtask-chip-${sIdx}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${isHi ? 'जोड़ें' : 'Add'} ${suggestion}`}
                        style={[styles.suggestionChip, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                        onPress={() => handleApplySuggestion(slot.id, suggestion)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.suggestionChipText, isDark && { color: theme.textSecondary }]}>+ {suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* To-Do Checklist Items */}
                {todos.length > 0 && (
                  <View style={[styles.slotTodoList, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {todos.map((todo) => (
                      <View key={todo.id} style={[styles.todoItemRow, isDark && { borderBottomColor: theme.border }]}>
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: todo.isCompleted }}
                          accessibilityLabel={
                            todo.isCompleted
                              ? (isHi ? `${todo.text} अपूर्ण चिह्नित करें` : `Mark ${todo.text} incomplete`)
                              : (isHi ? `${todo.text} पूर्ण चिह्नित करें` : `Mark ${todo.text} done`)
                          }
                          style={styles.todoCheckboxBtn}
                          onPress={() => handleToggleTodo(slot.id, todo.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={todo.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={todo.isCompleted ? '#10b981' : theme.primary}
                          />
                        </TouchableOpacity>

                        <Text
                          style={[
                            styles.todoItemText,
                            isDark && { color: theme.text },
                            todo.isCompleted && [styles.todoItemTextDone, isDark && { color: theme.textMuted }],
                          ]}
                        >
                          {todo.text}
                        </Text>

                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={isHi ? `${todo.text} हटाएं` : `Delete ${todo.text}`}
                          style={styles.todoDeleteBtn}
                          onPress={() => handleDeleteTodo(slot.id, todo.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Inline Add Task Input */}
                <View
                  style={[
                    styles.addTodoInputRow,
                    isDark && { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                  ]}
                >
                  <Ionicons name="add" size={20} color={theme.primary} style={{ marginLeft: 6 }} />
                  <TextInput
                    testID="planner-custom-task-input"
                    accessibilityLabel={isHi ? 'कार्य जोड़ें' : 'Add task'}
                    style={[styles.addTodoTextInput, isDark && { color: theme.text }]}
                    placeholder={
                      isAshubh
                        ? isHi
                          ? 'इस समय हेतु शांत कार्य जोड़ें...'
                          : 'Add quiet chore for this slot...'
                        : isHi
                        ? 'इस मुहूर्त में अपना कार्य जोड़ें...'
                        : 'Add task for this auspicious window...'
                    }
                    placeholderTextColor={theme.textSubtle}
                    value={inputValue}
                    onChangeText={(txt) => handleInputChange(slot.id, txt)}
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddTodo(slot.id, inputValue)}
                  />

                  {inputValue.trim().length > 0 && (
                    <TouchableOpacity
                      testID="planner-add-submit-btn"
                      accessibilityRole="button"
                      accessibilityLabel={isHi ? 'कार्य सहेजें' : 'Add task'}
                      style={styles.addTodoSubmitBtn}
                      onPress={() => handleAddTodo(slot.id, inputValue)}
                    >
                      <Text style={styles.addTodoSubmitBtnText}>{isHi ? 'जोड़ें' : 'Add'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );

            return cardNode;
          })
        )}
      </View>

      {/* Quick Astronomical Glance Bar */}
      <View style={[styles.quickAstroRow, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.quickAstroItem, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.quickAstroEmoji}>🌅</Text>
          <View style={{ backgroundColor: 'transparent', flex: 1 }}>
            <Text style={[styles.quickAstroLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'सूर्योदय' : 'Sunrise'}</Text>
            <Text style={[styles.quickAstroVal, isDark && { color: theme.text }]}>{formatTime(panchang.sunTimes.sunrise)}</Text>
          </View>
        </View>

        <View style={[styles.quickAstroItem, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.quickAstroEmoji}>🌇</Text>
          <View style={{ backgroundColor: 'transparent', flex: 1 }}>
            <Text style={[styles.quickAstroLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'सूर्यास्त' : 'Sunset'}</Text>
            <Text style={[styles.quickAstroVal, isDark && { color: theme.text }]}>{formatTime(panchang.sunTimes.sunset)}</Text>
          </View>
        </View>

        <View style={[styles.quickAstroItem, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.quickAstroEmoji}>🌙</Text>
          <View style={{ backgroundColor: 'transparent', flex: 1 }}>
            <Text style={[styles.quickAstroLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'चन्द्रोदय' : 'Moonrise'}</Text>
            <Text style={[styles.quickAstroVal, isDark && { color: theme.text }]}>
              {panchang.moonTimes.moonrise
                ? formatTime(panchang.moonTimes.moonrise)
                : (isHi ? 'दिन में' : 'Daytime')}
            </Text>
          </View>
        </View>

        <View style={[styles.quickAstroItem, isDark && { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder }]}>
          <Text style={styles.quickAstroEmoji}>⚠️</Text>
          <View style={{ backgroundColor: 'transparent', flex: 1 }}>
            <Text style={[styles.quickAstroLabel, { color: isDark ? theme.dangerText : '#b91c1c' }]}>
              {isHi ? 'राहु काल' : 'Rahu Kaal'}
            </Text>
            <Text style={[styles.quickAstroVal, { color: isDark ? theme.dangerText : '#b91c1c' }]}>
              {formatTime(panchang.muhurtas.rahuKaal.startTime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Reusable Pan-Indian Inauspicious Triad Card
  const renderInauspiciousTriad = () => (
    <TourTarget targetId="inauspicious-triad-card" borderRadius={20}>
      <View
        style={[
          styles.inauspiciousTriadCard,
          isDark && { backgroundColor: '#271710', borderColor: theme.dangerBorder },
        ]}
        testID="inauspicious-triad-card"
      >
        <View style={styles.inauspiciousTriadHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent', flex: 1 }}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={[styles.inauspiciousTriadTitle, isDark && { color: '#fdba74' }]}>
              {isHi ? 'त्रिकाल वर्ज्य (इन समयों में नया कार्य न करें)' : 'Times to Avoid Starting New Work'}
            </Text>
          </View>
        </View>

        <View style={[styles.inauspiciousTriadRow, isCompactLayout && { flexDirection: 'column' }]}>
          {/* 1. Rahu Kaal */}
          <View style={[styles.triadItem, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.triadBadgeTextRed, isDark && { color: theme.dangerText }]}>{isHi ? 'राहु काल' : 'Rahu Kalam'}</Text>
            <Text style={[styles.triadTimeText, isDark && { color: theme.text }]}>
              {formatTime(panchang.muhurtas.rahuKaal.startTime)} - {formatTime(panchang.muhurtas.rahuKaal.endTime)}
            </Text>
            <Text style={[styles.triadDescText, isDark && { color: theme.textMuted }]}>
              {isHi ? 'शुभ कार्य आरम्भ न करें' : 'Avoid new beginnings'}
            </Text>
          </View>

          {/* 2. Yamagandam */}
          <View style={[styles.triadItem, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.triadBadgeTextOrange, isDark && { color: theme.primary }]}>{isHi ? 'यमगण्ड' : 'Yamagandam'}</Text>
            <Text style={[styles.triadTimeText, isDark && { color: theme.text }]}>
              {formatTime(panchang.muhurtas.yamaganda.startTime)} - {formatTime(panchang.muhurtas.yamaganda.endTime)}
            </Text>
            <Text style={[styles.triadDescText, isDark && { color: theme.textMuted }]}>
              {isHi ? 'यात्रा व बड़े सौदे टालें' : 'Avoid travel & deals'}
            </Text>
          </View>

          {/* 3. Gulika Kaal */}
          <View style={[styles.triadItem, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.triadBadgeTextPurple, isDark && { color: '#c4b5fd' }]}>{isHi ? 'गुलिक काल' : 'Gulika Kalam'}</Text>
            <Text style={[styles.triadTimeText, isDark && { color: theme.text }]}>
              {formatTime(panchang.muhurtas.gulikaKaal.startTime)} - {formatTime(panchang.muhurtas.gulikaKaal.endTime)}
            </Text>
            <Text style={[styles.triadDescText, isDark && { color: theme.textMuted }]}>
              {isHi ? 'शनि पुत्र प्रभाव काल' : 'Pause major launches'}
            </Text>
          </View>
        </View>
      </View>
    </TourTarget>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView
          ref={mainScrollRef}
          style={[styles.container, { backgroundColor: theme.bg }]}
          contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onTourScroll}
          onMomentumScrollEnd={onTourMomentumScrollEnd}
          onScrollEndDrag={onTourScrollEndDrag}
          scrollEventThrottle={16}
          scrollEnabled={!isInteractiveTourActive || isTryModeActive}
        >
          {/* ========================================================= */}
          {/* TOP PROFILE, GREETING & VIRAL SHARE BAR                  */}
          {/* ========================================================= */}
          {/* 0. IMMERSIVE SACRED APP HEADER                            */}
          {/* ========================================================= */}
          <TourTarget targetId="header-bar" borderRadius={18}>
            <View style={styles.headerBar} testID="header-bar">
              {/* Row 1: Profile Avatar, Greeting Title, and Action Buttons */}
              <View style={[styles.headerTopRow, isCompactLayout && { flexWrap: 'wrap', rowGap: 10 }]}>
                <View style={styles.headerIdentityRow}>
                  {/* Profile Avatar / Quick Nav to Profile */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.avatarContainer,
                      isDark && { backgroundColor: theme.card, borderColor: theme.primary },
                    ]}
                    onPress={() => router.navigate('/(tabs)/more' as any)}
                    activeOpacity={0.8}
                    accessibilityLabel={isHi ? 'प्रोफ़ाइल व अधिक' : 'Profile & More'}
                  >
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarGlyph}>🕉️</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.greetingContainer}>
                    <Text style={[styles.greetingTitle, isDark && { color: theme.text }]}>
                      {isHi
                        ? `${spiritualPeriod.greetingHi}, ${displayProfileName(userProfile.name, true)}`
                        : `${spiritualPeriod.greetingEn}, ${displayProfileName(userProfile.name, false)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerActionsGroup}>
                  {/* Contextual Help Button (?) */}
                  <TouchableOpacity
                    testID="header-help-btn"
                    accessibilityRole="button"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    style={[
                      styles.helpActionBtn,
                      isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                    ]}
                    onPress={() => {
                      triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                      openHelp(effectiveViewMode === 'planner' ? 'dayplanner' : 'dinacharya');
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={isHi ? 'मदद व गाइड' : 'Help & Guide'}
                  >
                    <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
                  </TouchableOpacity>

                  {/* 1-Tap Language Switcher (हिं / EN) */}
                  <TourTarget targetId="header-lang-btn" borderRadius={22} shape="circle">
                    <TouchableOpacity
                      testID="header-lang-btn"
                      accessibilityRole="button"
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={[
                        styles.langActionBtn,
                        isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
                      ]}
                      onPress={() => {
                        triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                        setLanguage(language === 'hi' ? 'en' : 'hi');
                      }}
                      activeOpacity={0.7}
                      accessibilityLabel={
                        isHi ? 'अंग्रेज़ी भाषा चुनें (EN)' : 'Switch to Hindi (हिन्दी)'
                      }
                    >
                      <Text style={[styles.langActionBtnText, isDark && { color: theme.primary }]}>
                        {language === 'hi' ? 'EN' : 'हिं'}
                      </Text>
                    </TouchableOpacity>
                  </TourTarget>

                  {/* Sacred Temple Brass Bell Chime */}
                  <TourTarget targetId="header-bell-btn" borderRadius={22} shape="circle">
                    <TouchableOpacity
                      testID="header-bell-btn"
                      accessibilityRole="button"
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={[
                        styles.bellActionBtn,
                        isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
                      ]}
                      onPress={() => {
                        triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                        playTempleBell(0.8);
                      }}
                      activeOpacity={0.7}
                      accessibilityLabel={isHi ? 'मन्दिर घंटी बजाएं' : 'Ring Temple Bell'}
                    >
                      <Text style={{ fontSize: 18 }}>🔔</Text>
                    </TouchableOpacity>
                  </TourTarget>

                  {/* Viral 1-Tap WhatsApp Daily Share Card Button */}
                  <TourTarget targetId="header-share-btn" borderRadius={22} shape="circle">
                    <TouchableOpacity
                      testID="header-share-btn"
                      accessibilityRole="button"
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={styles.whatsAppShareBtn}
                      onPress={() => {
                        triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                        setIsShareCardModalVisible(true);
                      }}
                      activeOpacity={0.8}
                      accessibilityLabel={isHi ? 'WhatsApp शेयर कार्ड' : 'WhatsApp Share Card'}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </TourTarget>
                </View>
              </View>

              {/* Row 2: Dedicated Panchang & Location Context Bar */}
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.headerSubBar,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => router.navigate('/(tabs)/settings' as any)}
                activeOpacity={0.7}
                accessibilityLabel={
                  isHi ? 'तिथि व स्थान विवरण (सेटिंग्स में शहर बदलें)' : 'Tithi and location details (Tap to change city)'
                }
              >
                <View style={styles.subBarPanchang}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={theme.primary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.subBarDateText, isDark && { color: theme.text }]}>
                    {isHi ? 'आज ' : 'Today '}
                    {currentDate.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={[styles.subBarBullet, isDark && { color: theme.textMuted }]}>•</Text>
                  <Text style={[styles.subBarTithiText, isDark && { color: theme.primary }]}>
                    {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
                  </Text>
                </View>

                <View style={styles.subBarLocation}>
                  <Ionicons
                    name="location-sharp"
                    size={14}
                    color={theme.primary}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.subBarLocationText, isDark && { color: theme.textSecondary }]}>
                    {location.name.split(',')[0]}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isDark ? theme.textMuted : '#71717a'}
                    style={{ marginLeft: 3 }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </TourTarget>

          {/* ========================================================= */}
          {/* 1. HORIZONTAL 7-DAY SACRED HORIZON STRIP (Top Level)      */}
          {/* ========================================================= */}
          <View style={styles.weekStripContainer}>
            {weekDays.map((d, index) => {
              const isSelected = d.toDateString() === currentDate.toDateString();
              const dayNum = d.getDate();
              const isToday = d.toDateString() === new Date().toDateString();

              const pillNode = (
                <TouchableOpacity
                  testID={isSelected ? 'day-pill-selected' : `day-pill-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.toDateString()}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.dayPill,
                    isDark && !isSelected && { backgroundColor: theme.card, borderColor: theme.border },
                    isToday && !isSelected && { borderColor: theme.primary, borderWidth: 1.5 },
                    isSelected && styles.dayPillSelected,
                  ]}
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
                  <Text
                    style={[
                      styles.dayNameText,
                      isDark && !isSelected && { color: theme.textMuted },
                      isSelected && styles.dayNameTextSelected,
                    ]}
                  >
                    {isHi ? dayNamesHi[d.getDay()] : dayNamesEn[d.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumberText,
                      isDark && !isSelected && { color: theme.text },
                      isSelected && styles.dayNumberTextSelected,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );

              return isSelected ? (
                <TourTarget
                  key={index}
                  targetId="day-pill-selected"
                  borderRadius={20}
                  style={styles.dayPillWrapper}
                >
                  {pillNode}
                </TourTarget>
              ) : (
                <View key={index} style={styles.dayPillWrapper}>
                  {pillNode}
                </View>
              );
            })}
          </View>

          {/* View Mode Switcher: Daily vs Planner vs Monthly Calendar Grid */}
          <TourTarget targetId="view-mode-daily-btn" borderRadius={14} style={{ width: '100%' }}>
            <View style={[styles.viewModeSegment, isDark && { backgroundColor: theme.cardMuted }]}>
              <TouchableOpacity
                testID="view-mode-daily-btn"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? 'पञ्चाङ्ग' : 'Panchang'}
                accessibilityState={{ selected: effectiveViewMode === 'daily' }}
                style={[
                  styles.viewModeBtn,
                  effectiveViewMode === 'daily' && [styles.viewModeBtnActive, isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder }],
                ]}
                onPress={() => {
                  triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualViewStepId(currentTourStep.id);
                  }
                  setViewMode('daily');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.viewModeBtnText,
                    isDark && { color: theme.textSecondary },
                    effectiveViewMode === 'daily' && [styles.viewModeBtnTextActive, isDark && { color: theme.primary }],
                  ]}
                >
                  {isHi ? '☀️ पञ्चाङ्ग' : '☀️ Panchang'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="view-mode-planner-btn"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? 'दिन योजना' : 'Day Planner'}
                accessibilityState={{ selected: effectiveViewMode === 'planner' }}
                style={[
                  styles.viewModeBtn,
                  effectiveViewMode === 'planner' && [styles.viewModeBtnActive, isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder }],
                ]}
                onPress={() => {
                  triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualViewStepId(currentTourStep.id);
                  }
                  setViewMode('planner');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.viewModeBtnText,
                    isDark && { color: theme.textSecondary },
                    effectiveViewMode === 'planner' && [styles.viewModeBtnTextActive, isDark && { color: theme.primary }],
                  ]}
                >
                  {isHi ? '🗓️ दिन योजना' : '🗓️ Day Planner'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="view-mode-monthly-btn"
                accessibilityRole="tab"
                accessibilityLabel={isHi ? 'मासिक' : 'Monthly'}
                accessibilityState={{ selected: effectiveViewMode === 'monthly' }}
                style={[
                  styles.viewModeBtn,
                  effectiveViewMode === 'monthly' && [styles.viewModeBtnActive, isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder }],
                ]}
                onPress={() => {
                  triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                  if (isInteractiveTourActive && currentTourStep?.id) {
                    setManualViewStepId(currentTourStep.id);
                  }
                  setViewMode('monthly');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.viewModeBtnText,
                    isDark && { color: theme.textSecondary },
                    effectiveViewMode === 'monthly' && [styles.viewModeBtnTextActive, isDark && { color: theme.primary }],
                  ]}
                >
                  {isHi ? '📅 मासिक' : '📅 Monthly'}
                </Text>
              </TouchableOpacity>
            </View>
          </TourTarget>

          {/* 1. PLANNER VIEW MODE: Direct zero-scroll access */}
          {effectiveViewMode === 'planner' ? (
            <View testID="planner-view-mode-container" style={{ marginTop: 2 }}>
              {isCalculating ? (
                <LoadingIndicator
                  message={isHi ? 'शुभ मुहूर्त दिनचर्या लोड हो रही है...' : 'Calculating Hindu Day Planner...'}
                />
              ) : (
                <>
                  {renderDayPlannerSection()}
                  {renderInauspiciousTriad()}
                  <TouchableOpacity
                    testID="switch-back-daily-btn"
                    accessibilityRole="button"
                    accessibilityLabel={isHi ? 'सम्पूर्ण दैनिक पञ्चाङ्ग देखें' : 'View Full Daily Panchang'}
                    style={[
                      styles.switchBackToDailyBtn,
                      { minHeight: MIN_TOUCH_TARGET },
                      isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
                    ]}
                    onPress={async () => {
                      await triggerHaptic('tap', userProfile.hapticsEnabled);
                      if (isInteractiveTourActive && currentTourStep?.id) {
                        setManualViewStepId(currentTourStep.id);
                      }
                      setViewMode('daily');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.switchBackToDailyBtnText, isDark && { color: theme.primary }]}>
                      {isHi ? '☀️ सम्पूर्ण दैनिक पञ्चाङ्ग देखें →' : '☀️ View Full Daily Panchang →'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <>
              {/* Conditional Monthly Calendar Grid */}
              {effectiveViewMode === 'monthly' && (
                <TourTarget targetId="monthly-calendar-grid" borderRadius={20}>
                  <MonthlyCalendarGrid
                    currentDate={currentDate}
                    onSelectDate={(d) => {
                      handleSelectDate(d);
                    }}
                    location={location}
                    isHi={isHi}
                  />
                </TourTarget>
              )}

          {/* Sacred Vrat Hero Card (Sankashti Moonrise, Ekadashi, Pradosha, Purnima) */}
          {vratGuidance ? (
            <VratHeroCard
              vrat={vratGuidance}
              isHi={isHi}
              hapticsEnabled={userProfile.hapticsEnabled}
            />
          ) : paranaInfo ? (
            <View style={[styles.paranaBanner, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primary }]}>
              <View style={styles.paranaHeaderRow}>
                <View style={styles.paranaTitleGroup}>
                  <Text style={styles.paranaEmoji}>🌟</Text>
                  <Text style={[styles.paranaTitle, isDark && { color: theme.text }]}>
                    {isHi
                      ? (paranaInfo.isDwadashi ? 'एकादशी व्रत पारण मुहूर्त (आज)' : 'एकादशी व्रत पारण मुहूर्त (कल)')
                      : (paranaInfo.isDwadashi ? 'Ekadashi Fast Breaking (Today)' : 'Ekadashi Fast Breaking (Tomorrow)')}
                  </Text>
                </View>
                <View style={[styles.paranaBadge, isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder }]}>
                  <Text style={[styles.paranaBadgeText, isDark && { color: theme.primary }]}>
                    {isHi ? paranaInfo.vratNameHi : paranaInfo.vratNameEn}
                  </Text>
                </View>
              </View>
              <Text style={[styles.paranaTimeWindow, isDark && { color: theme.primary }]}>
                {paranaInfo.startTimeFormatted} — {paranaInfo.endTimeFormatted}
              </Text>
              <Text style={[styles.paranaGuidance, isDark && { color: theme.textSecondary }]}>
                {isHi ? paranaInfo.guidanceHi : paranaInfo.guidanceEn}
              </Text>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* 2. LIVE COSMIC COMPASS (Now & Next Instant Guidance)      */}
          {/* ========================================================= */}
          <TourTarget targetId="live-cosmic-banner" borderRadius={20}>
            <View
              testID="live-cosmic-banner"
              style={[
                styles.liveCosmicBanner,
                {
                  backgroundColor: isDark ? theme.card : liveStatus.badgeBg,
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
                <Text style={[styles.liveCosmicWindow, isDark && { color: theme.textSecondary }]}>
                  {isHi ? liveStatus.windowHi : liveStatus.windowEn}
                </Text>
              </View>

              <Text style={[styles.liveCosmicTitle, isDark && { color: theme.text }]}>
                {isHi ? liveStatus.titleHi : liveStatus.titleEn}
              </Text>

              <Text style={[styles.liveCosmicDesc, isDark && { color: theme.textSecondary }]}>
                {isHi ? liveStatus.descriptionHi : liveStatus.descriptionEn}
              </Text>

              {activeSlotTodos && (
                <View style={[styles.liveCosmicTasksRow, isDark && { borderTopColor: theme.border }]}>
                  <Text style={[styles.liveCosmicTasksTitle, isDark && { color: theme.text }]}>
                    {isHi ? '🎯 इस मुहूर्त हेतु नियोजित कार्य:' : '🎯 Tasks planned for this window:'}
                  </Text>
                  <View style={styles.liveCosmicTasksList}>
                    {activeSlotTodos.tasks.map((t, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.liveCosmicTaskChip,
                          isDark && { backgroundColor: theme.elevatedSurface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.liveCosmicTaskChipText, isDark && { color: theme.text }]}>
                          • {t.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </TourTarget>

          {/* ========================================================= */}
          {/* 3. SACRED ALIGNMENT HUB (Sadhana & Vedic Sankalpa)        */}
          {/* ========================================================= */}
          <View style={[styles.sacredAlignmentRow, isCompactLayout && { flexDirection: 'column' }]}>
            {/* Left Card: Daily Sadhana Checklist */}
            <TourTarget targetId="hero-challenge-card" borderRadius={18} style={{ flex: 1 }}>
              <TouchableOpacity
                testID="hero-challenge-card"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'दैनिक सूक्ष्म साधनाएं चेकलिस्ट' : '5 Sacred Micro-Habits checklist'}
                style={[
                  styles.sacredAlignmentCardLeft,
                  { width: '100%' },
                  isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
                ]}
                activeOpacity={0.88}
                onPress={() => setIsSadhanaModalVisible(true)}
              >
                <View style={styles.alignmentCardHeader}>
                  <Text style={[styles.alignmentCardTag, isDark && { color: theme.primary }]}>
                    {isHi ? '📿 नित्यकर्म साधना' : '📿 Daily Habits'}
                  </Text>
                  {streakCount > 0 && (
                    <Text
                      style={[
                        styles.alignmentCardStreak,
                        isDark && { backgroundColor: theme.primaryBg, color: theme.primary },
                      ]}
                    >
                      🔥 {streakCount}d
                    </Text>
                  )}
                </View>
                <Text style={[styles.alignmentCardTitle, isDark && { color: theme.text }]}>
                  {isHi ? 'दैनिक सूक्ष्म साधनाएं' : '5 Daily Spiritual Habits'}
                </Text>
                <Text style={[styles.alignmentCardSub, isDark && { color: theme.textSecondary }]}>
                  {completedHabits.length}/5 {isHi ? 'साधनाएं पूर्ण' : 'completed today'}
                </Text>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isDark ? theme.cardMuted : 'rgba(217,119,6,0.16)',
                    overflow: 'hidden',
                    marginTop: 8,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      width: `${Math.min(100, (completedHabits.length / 5) * 100)}%`,
                      backgroundColor: completedHabits.length === 5 ? '#10b981' : theme.primary,
                    }}
                  />
                </View>
                <View style={[styles.alignmentCardFooter, isDark && { borderTopColor: theme.border }]}>
                  <Text style={[styles.alignmentCardAction, isDark && { color: theme.primary }]}>
                    {isHi ? 'चेकलिस्ट देखें →' : 'Open Checklist →'}
                  </Text>
                  <Ionicons name="checkmark-done" size={16} color={isDark ? theme.successText : '#047857'} />
                </View>
              </TouchableOpacity>
            </TourTarget>

            {/* Right Card: Vedic Sankalpa Recital */}
            <TourTarget targetId="bento-tall-card" borderRadius={18} style={{ flex: 1 }}>
              <TouchableOpacity
                testID="bento-tall-card"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'दैनिक वैदिक सङ्कल्प पढ़ें' : 'Recite Daily Vedic Sankalpa'}
                style={[
                  styles.sacredAlignmentCardRight,
                  { width: '100%' },
                  isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
                ]}
                activeOpacity={0.88}
                onPress={() => setIsSankalpaModalVisible(true)}
              >
                <View style={styles.alignmentCardHeader}>
                  <Text style={[styles.alignmentCardTag, isDark && { color: theme.primary }]}>
                    {isHi ? '📜 दैनिक सङ्कल्प' : '📜 Daily Prayer Vow'}
                  </Text>
                  <Text
                    style={[
                      styles.alignmentCardStreak,
                      isDark && { backgroundColor: theme.primaryBg, color: theme.primary },
                    ]}
                  >
                    {isHi ? 'आज का व्रत' : 'Today'}
                  </Text>
                </View>
                <Text style={[styles.alignmentCardTitle, isDark && { color: theme.text }]}>
                  {userProfile.gotra ? `${userProfile.gotra} गोत्र` : isHi ? 'वैदिक संकल्प' : 'Morning Sankalpa'}
                </Text>
                <Text style={[styles.alignmentCardSub, isDark && { color: theme.textSecondary }]}>
                  {activeMasa} • {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
                </Text>
                <View style={[styles.alignmentCardFooter, isDark && { borderTopColor: theme.border }]}>
                  <Text style={[styles.alignmentCardAction, isDark && { color: theme.primary }]}>
                    {isHi ? 'सङ्कल्प लें →' : 'Read & Share →'}
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color={theme.primary} />
                </View>
              </TouchableOpacity>
            </TourTarget>
          </View>

          {/* Daily Satvik Rashi Guidance (Vedic Gochara & Remedies) */}
          <TourTarget targetId="daily-rashi-card" borderRadius={22}>
            <DailyRashiCard
              moonRashiIndex={panchang.moonRashi?.current?.index ?? 0}
              savedRashiIndex={userProfile.rashi}
              onSaveRashi={handleSaveRashi}
              isHi={isHi}
              hapticsEnabled={userProfile.hapticsEnabled}
            />
          </TourTarget>

          {/* ========================================================= */}
          {/* 4. THE HEART: HINDU DAY PLANNER (Front & Center!)         */}
          {/* ========================================================= */}
          {isCalculating ? (
            <LoadingIndicator
              message={isHi ? 'शुभ मुहूर्त दिनचर्या लोड हो रही है...' : 'Calculating Hindu Day Planner...'}
            />
          ) : (
            <>
              {renderDayPlannerSection()}
              {renderInauspiciousTriad()}

              {/* ======================================================= */}
              {/* 5 SACRED LIMBS (PANCHA-ANGA) EXPANDABLE ACCORDION       */}
              {/* ======================================================= */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: isLimbsExpanded }}
                accessibilityLabel={isHi ? 'पञ्चाङ्ग के ५ मूल अंग खोलें या बंद करें' : 'Toggle The 5 Sacred Limbs of Panchang'}
                style={[styles.limbsHeaderBtn, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setIsLimbsExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18 }}>🪐</Text>
                  <Text style={[styles.limbsHeaderText, isDark && { color: theme.text }]}>
                    {isHi ? 'पञ्चाङ्ग के ५ मूल अंग (तिथि, नक्षत्र, योग...)' : '5 Parts of Panchang (Tithi, Star, Yoga...)'}
                  </Text>
                </View>
                <Ionicons
                  name={isLimbsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {isLimbsExpanded && (
                <View style={styles.limbsContainer}>
                  {/* 1. Tithi */}
                  <View style={[styles.limbCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.limbTop}>
                      <Text style={[styles.limbIndex, isDark && { color: theme.textSecondary }]}>{isHi ? '१. तिथि (चान्द्र दिन)' : '1. Tithi (Lunar Day)'}</Text>
                      <Text style={[styles.limbStatus, isDark && { backgroundColor: theme.primaryBg, color: theme.primary }]}>
                        {isHi
                          ? `${panchang.tithi.current.pakshaDevanagari} पक्ष`
                          : `${panchang.tithi.current.paksha} Paksha`}
                      </Text>
                    </View>
                    <Text style={[styles.limbName, isDark && { color: theme.text }]}>
                      {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
                    </Text>
                    <View style={styles.limbFooter}>
                      <Text style={[styles.limbEnd, isDark && { color: theme.textMuted }]}>
                        {isHi ? 'समाप्ति:' : 'Ends at'} {formatTime(panchang.tithi.endTime)}
                      </Text>
                      <Text style={[styles.limbDeity, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'देवता:' : 'Deity:'}{' '}
                        {cleanDeityName(panchang.tithi.current.deity, isHi)}
                      </Text>
                    </View>
                  </View>

                  {/* 2. Nakshatra */}
                  <View style={[styles.limbCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.limbTop}>
                      <Text style={[styles.limbIndex, isDark && { color: theme.textSecondary }]}>{isHi ? '२. नक्षत्र (चन्द्र तारामंडल)' : '2. Nakshatra (Moon Star)'}</Text>
                      <Text style={[styles.limbStatus, isDark && { backgroundColor: theme.primaryBg, color: theme.primary }]}>
                        {isHi
                          ? `चरण ${panchang.nakshatra.current.pada}`
                          : `Pada ${panchang.nakshatra.current.pada}`}
                      </Text>
                    </View>
                    <Text style={[styles.limbName, isDark && { color: theme.text }]}>
                      {isHi
                        ? panchang.nakshatra.current.nameDevanagari
                        : panchang.nakshatra.current.name}
                    </Text>
                    <View style={styles.limbFooter}>
                      <Text style={[styles.limbEnd, isDark && { color: theme.textMuted }]}>
                        {isHi ? 'समाप्ति:' : 'Ends at'} {formatTime(panchang.nakshatra.endTime)}
                      </Text>
                      <Text style={[styles.limbDeity, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'स्वामी:' : 'Lord:'}{' '}
                        {cleanPlanetLord(panchang.nakshatra.current.lord, isHi)}
                      </Text>
                    </View>
                  </View>

                  {/* 3. Yoga */}
                  <View style={[styles.limbCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.limbTop}>
                      <Text style={[styles.limbIndex, isDark && { color: theme.textSecondary }]}>{isHi ? '३. योग (सूर्य-चन्द्र संयोग)' : '3. Yoga (Day Energy)'}</Text>
                      <Text
                        style={[
                          styles.limbStatus,
                          panchang.yoga.current.nature === 'Auspicious'
                            ? { color: isDark ? theme.successText : '#047857', backgroundColor: isDark ? theme.successBg : '#ecfdf5' }
                            : { color: isDark ? theme.dangerText : '#b91c1c', backgroundColor: isDark ? theme.dangerBg : '#fef2f2' },
                        ]}
                      >
                        {isHi
                          ? panchang.yoga.current.nature === 'Auspicious'
                            ? '✓ शुभ'
                            : '⚠️ अशुभ'
                          : panchang.yoga.current.nature === 'Auspicious'
                          ? '✓ Good'
                          : '⚠️ Caution'}
                      </Text>
                    </View>
                    <Text style={[styles.limbName, isDark && { color: theme.text }]}>
                      {isHi ? panchang.yoga.current.nameDevanagari : panchang.yoga.current.name}
                    </Text>
                    <View style={styles.limbFooter}>
                      <Text style={[styles.limbEnd, isDark && { color: theme.textMuted }]}>
                        {isHi ? 'समाप्ति:' : 'Ends at'} {formatTime(panchang.yoga.endTime)}
                      </Text>
                      <Text style={[styles.limbDeity, isDark && { color: theme.textSecondary }]}>
                        {isHi
                          ? `संख्या ${panchang.yoga.current.index} / २७`
                          : `#${panchang.yoga.current.index} of 27`}
                      </Text>
                    </View>
                  </View>

                  {/* 4. Karana */}
                  <View style={[styles.limbCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.limbTop}>
                      <Text style={[styles.limbIndex, isDark && { color: theme.textSecondary }]}>{isHi ? '४. करण (अर्ध तिथि)' : '4. Karana (Half Lunar Day)'}</Text>
                      <Text style={[styles.limbStatus, isDark && { backgroundColor: theme.primaryBg, color: theme.primary }]}>
                        {isHi
                          ? panchang.karana.current.type === 'Chara'
                            ? 'चर'
                            : 'स्थिर'
                          : panchang.karana.current.type}
                      </Text>
                    </View>
                    <Text style={[styles.limbName, isDark && { color: theme.text }]}>
                      {isHi ? panchang.karana.current.nameDevanagari : panchang.karana.current.name}
                    </Text>
                    <View style={styles.limbFooter}>
                      <Text style={[styles.limbEnd, isDark && { color: theme.textMuted }]}>
                        {isHi ? 'समाप्ति:' : 'Ends at'} {formatTime(panchang.karana.endTime)}
                      </Text>
                      <Text style={[styles.limbDeity, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'देवता:' : 'Deity:'}{' '}
                        {cleanDeityName(panchang.karana.current.deity, isHi)}
                      </Text>
                    </View>
                  </View>

                  {/* 5. Vara */}
                  <View style={[styles.limbCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.limbTop}>
                      <Text style={[styles.limbIndex, isDark && { color: theme.textSecondary }]}>{isHi ? '५. वार (सौर दिवस)' : '5. Weekday (Vara)'}</Text>
                      <Text style={[styles.limbStatus, isDark && { backgroundColor: theme.primaryBg, color: theme.primary }]}>
                        {isHi ? 'सूर्योदय से' : 'Sunrise-based'}
                      </Text>
                    </View>
                    <Text style={[styles.limbName, isDark && { color: theme.text }]}>
                      {isHi ? panchang.vara.nameDevanagari : panchang.vara.name}
                    </Text>
                    <View style={styles.limbFooter}>
                      <Text style={[styles.limbEnd, isDark && { color: theme.textMuted }]}>
                        {isHi ? 'स्वामी ग्रह:' : 'Ruling Planet:'}{' '}
                        {cleanPlanetLord(panchang.vara.lordPlanet, isHi)}
                      </Text>
                      <Text style={[styles.limbDeity, isDark && { color: theme.textSecondary }]}>
                        {isHi ? `संवत् ${panchang.samvat.vikramSamvat}` : `Vikram ${panchang.samvat.vikramSamvat}`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Daily Wellness / Shastric Shloka Quick Access */}
              <TouchableOpacity
                testID="daily-shloka-card"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'आज का कल्याणकारी श्लोक पढ़ें' : 'Read Daily Sacred Verse'}
                style={[
                  styles.limbsHeaderBtn,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setIsVerseModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 18 }}>📖</Text>
                  <Text style={[styles.limbsHeaderText, isDark && { color: theme.text }]}>
                    {isHi ? selectedVerse.titleHi : selectedVerse.title}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            </>
          )}
        </>
      )}

        </ScrollView>

        {/* ========================================================= */}
        {/* MODAL 1: DAILY VEDIC SANKALPA                             */}
        {/* ========================================================= */}
        <Modal
          visible={isSankalpaModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsSankalpaModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>📜</Text>
                  <Text style={[styles.modalTitle, isDark && { color: theme.text }]}>
                    {isHi ? 'दैनिक वैदिक सङ्कल्प' : 'Daily Vedic Sankalpa'}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="sankalpa-close-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'सङ्कल्प बंद करें' : 'Close Sankalpa modal'}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={[styles.modalCloseBtn, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                  onPress={() => setIsSankalpaModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={isDark ? theme.textSecondary : '#52525b'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
                <View style={[styles.sankalpaPillHeader, isDark && { backgroundColor: theme.cardMuted }]}>
                  <Text style={[styles.sankalpaPillLocation, isDark && { color: theme.text }]}>📍 {location.name}</Text>
                  <Text style={[styles.sankalpaPillDate, isDark && { color: theme.textSecondary }]}>
                    संवत् {panchang.samvat.vikramSamvat} • {activeMasa}
                  </Text>
                  {userProfile.gotra ? (
                    <Text style={[styles.sankalpaPillDate, { color: theme.primary, fontWeight: '700' }]}>
                      गोत्र: {userProfile.gotra} {userProfile.name ? `• यजमान: ${userProfile.name}` : ''}
                    </Text>
                  ) : null}
                </View>

                <Text style={[styles.sankalpaSanskrit, isDark && { color: theme.text }]}>{dailySankalpa.sanskrit}</Text>

                <View style={[styles.meaningDivider, isDark && { backgroundColor: theme.border }]} />

                <Text style={[styles.meaningLabel, isDark && { color: theme.primary }]}>
                  {isHi ? 'भावार्थ (हिंदी):' : 'Meaning (Hindi):'}
                </Text>
                <Text style={[styles.meaningText, isDark && { color: theme.textSecondary }]}>{dailySankalpa.hindi}</Text>

                <View style={[styles.meaningDivider, isDark && { backgroundColor: theme.border }]} />

                <Text style={[styles.meaningLabel, isDark && { color: theme.primary }]}>English Contemplation:</Text>
                <Text style={[styles.meaningText, isDark && { color: theme.textSecondary }]}>{dailySankalpa.english}</Text>
              </ScrollView>

              <View style={styles.modalFooterBtns}>
                <TouchableOpacity
                  testID="sankalpa-share-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'सङ्कल्प साझा करें' : 'Share Sankalpa'}
                  style={[styles.shareBtn, { minHeight: MIN_TOUCH_TARGET }]}
                  onPress={handleShareSankalpa}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                  <Text style={styles.shareBtnText}>{isHi ? 'साझा करें' : 'Share'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="sankalpa-done-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'सङ्कल्प सम्पन्न' : 'Done'}
                  style={[styles.doneBtn, { minHeight: MIN_TOUCH_TARGET }]}
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
        <Modal
          visible={isSadhanaModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsSadhanaModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                  <Text style={[styles.modalTitle, isDark && { color: theme.text }]}>
                    {isHi ? 'दैनिक नित्यकर्म साधना' : 'Daily Sadhana Checklist'}
                  </Text>
                  <Text style={[styles.modalSubtitle, isDark && { color: theme.textMuted }]}>
                    {isHi ? 'प्रतिदिन की ५ सूक्ष्म साधनाएं' : '5 essential daily sacred micro-habits'}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="sadhana-close-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'साधना सूची बंद करें' : 'Close Sadhana checklist'}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={[styles.modalCloseBtn, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                  onPress={() => setIsSadhanaModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={isDark ? theme.textSecondary : '#52525b'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {DAILY_SADHANA_HABITS.map((habit) => {
                  const isDone = completedHabits.includes(habit.id);
                  return (
                    <TouchableOpacity
                      key={habit.id}
                      testID={`sadhana-habit-${habit.id}`}
                      accessibilityRole="checkbox"
                      accessibilityLabel={isHi ? habit.titleHi : habit.titleEn}
                      accessibilityState={{ checked: isDone }}
                      style={[
                        styles.habitRow,
                        isDark && !isDone && { backgroundColor: theme.card, borderColor: theme.border },
                        isDone && [styles.habitRowDone, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }],
                      ]}
                      onPress={() => handleToggleHabit(habit.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.habitIconBox, isDone && styles.habitIconBoxDone]}>
                        <Ionicons
                          name={habit.iconName as any}
                          size={20}
                          color={isDone ? '#ffffff' : theme.primary}
                        />
                      </View>

                      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                        <Text
                          style={[
                            styles.habitTitle,
                            isDark && { color: theme.text },
                            isDone && styles.habitTitleDone,
                          ]}
                        >
                          {isHi ? habit.titleHi : habit.titleEn}
                        </Text>
                        <Text style={[styles.habitDesc, isDark && { color: theme.textMuted }]}>
                          {isHi ? habit.descHi : habit.descEn}
                        </Text>
                        <Text style={[styles.habitTime, isDark && { color: theme.primary }]}>
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
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'साधना सहेजें' : 'Save Sadhana'}
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
        <Modal
          visible={isVerseModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsVerseModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && { color: theme.text }, { flex: 1, paddingRight: 8 }]}>
                  {isHi ? selectedVerse.titleHi : selectedVerse.title}
                </Text>
                <TouchableOpacity
                  testID="verse-close-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'श्लोक बंद करें' : 'Close Verse'}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={[styles.modalCloseBtn, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                  onPress={() => setIsVerseModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color={isDark ? theme.textSecondary : '#52525b'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                <View style={[styles.contextPill, isDark && { backgroundColor: theme.primaryBg }]}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={[styles.contextPillText, isDark && { color: theme.primary }]}>
                    {isHi ? selectedVerse.timeContextHi : selectedVerse.timeContext}
                  </Text>
                </View>

                <Text style={[styles.verseSanskrit, isDark && { color: theme.text, backgroundColor: theme.cardMuted, borderColor: theme.border }]}>{selectedVerse.shloka}</Text>
                <Text style={[styles.verseTranslit, isDark && { color: theme.textMuted }]}>{selectedVerse.transliteration}</Text>

                <View style={[styles.meaningDivider, isDark && { backgroundColor: theme.border }]} />
                <Text style={[styles.meaningLabel, isDark && { color: theme.primary }]}>{isHi ? 'भावार्थ:' : 'Meaning:'}</Text>
                <Text style={[styles.meaningText, isDark && { color: theme.textSecondary }]}>
                  {isHi ? selectedVerse.meaningHi : selectedVerse.meaning}
                </Text>
              </ScrollView>

              <View style={[styles.modalFooterBtns, isCompactLayout && { flexWrap: 'wrap' }]}>
                <TouchableOpacity
                  testID="verse-prev-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'पिछला श्लोक' : 'Previous verse'}
                  style={[styles.shareBtn, { backgroundColor: isDark ? theme.cardMuted : '#52525b', minHeight: COMFORT_TOUCH_TARGET }]}
                  onPress={() => handleCycleVerse(-1)}
                >
                  <Ionicons name="arrow-back" size={18} color="#ffffff" />
                  <Text style={styles.shareBtnText}>{isHi ? 'पिछला' : 'Prev'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="verse-next-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'अगला श्लोक' : 'Next verse'}
                  style={[styles.shareBtn, { minHeight: COMFORT_TOUCH_TARGET }]}
                  onPress={() => handleCycleVerse(1)}
                >
                  <Text style={styles.shareBtnText}>{isHi ? 'अगला श्लोक' : 'Next'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  testID="verse-done-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'बन्द करें' : 'Close'}
                  style={[styles.doneBtn, { minHeight: COMFORT_TOUCH_TARGET }]}
                  onPress={() => setIsVerseModalVisible(false)}
                >
                  <Text style={styles.doneBtnText}>{isHi ? 'बन्द करें' : 'Close'}</Text>
                </TouchableOpacity>
              </View>
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
          userName={userProfile.name}
          timezone={location.timezone}
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
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerIdentityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 160,
  },
  avatarContainer: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginLeft: 10,
    marginRight: 4,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    color: '#18181b',
    letterSpacing: -0.2,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  helpActionBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  langActionBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  langActionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ea580c',
  },
  bellActionBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  whatsAppShareBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppShareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: '#ffffff',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  subBarPanchang: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  subBarDateText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  subBarBullet: {
    fontSize: 13,
    color: '#a1a1aa',
    marginHorizontal: 6,
  },
  subBarTithiText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#b45309',
  },
  subBarLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  subBarLocationText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#52525b',
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

  // View Mode Switcher
  viewModeSegment: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  viewModeBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    textAlign: 'center',
  },
  viewModeBtnTextActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  switchBackToDailyBtn: {
    marginTop: 14,
    marginBottom: 20,
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBackToDailyBtnText: {
    ...Typography.button,
    color: '#b45309',
  },

  // Ekadashi Vrat Parana Banner
  paranaBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 14,
  },
  paranaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  paranaTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  paranaEmoji: {
    fontSize: 18,
  },
  paranaTitle: {
    ...Typography.cardTitle,
    fontWeight: '800',
    color: '#92400e',
    flex: 1,
  },
  paranaBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  paranaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  paranaTimeWindow: {
    fontSize: 19,
    fontWeight: '900',
    color: '#b45309',
    marginVertical: 4,
    letterSpacing: 0.4,
  },
  paranaGuidance: {
    ...Typography.bodyMuted,
    color: '#78350f',
  },

  // Live Cosmic Pulse Banner
  liveCosmicBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  liveCosmicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  livePulseGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  livePulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  liveCosmicBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  liveCosmicWindow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
  },
  liveCosmicTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 4,
  },
  liveCosmicDesc: {
    ...Typography.bodyMuted,
    color: '#3f3f46',
    fontWeight: '500',
  },
  liveCosmicTasksRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'transparent',
  },
  liveCosmicTasksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  liveCosmicTasksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  liveCosmicTaskChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  liveCosmicTaskChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
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
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sacredAlignmentCardLeft: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  sacredAlignmentCardRight: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ffedd5',
    borderWidth: 1,
    borderColor: '#fed7aa',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  alignmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  alignmentCardTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  alignmentCardStreak: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  alignmentCardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 3,
  },
  alignmentCardSub: {
    fontSize: 13.5,
    color: '#52525b',
    lineHeight: 19,
  },
  alignmentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'transparent',
  },
  alignmentCardAction: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#b45309',
  },

  // Quick Astro Glance Bar below planner
  quickAstroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  quickAstroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  quickAstroEmoji: {
    fontSize: 18,
  },
  quickAstroLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#52525b',
  },
  quickAstroVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#18181b',
  },
  quickAstroDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e4e4e7',
  },

  // Pan-Indian Inauspicious Triad (Rahu, Yamagandam, Gulika)
  inauspiciousTriadCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inauspiciousTriadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  inauspiciousTriadTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#9a3412',
    flexShrink: 1,
  },
  inauspiciousTriadSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c2410c',
  },
  inauspiciousTriadRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  triadItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  triadBadgeTextRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
    marginBottom: 3,
    textAlign: 'center',
  },
  triadBadgeTextOrange: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 3,
    textAlign: 'center',
  },
  triadBadgeTextPurple: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6d28d9',
    marginBottom: 3,
    textAlign: 'center',
  },
  triadTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 3,
  },
  triadDescText: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
  },

  // Week Calendar Strip
  weekStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  dayPillWrapper: {
    flex: 1,
    marginHorizontal: 2,
  },
  dayPill: {
    width: '100%',
    minHeight: 62,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  dayPillSelected: {
    backgroundColor: '#b45309',
    borderColor: '#92400e',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontSize: 12.5,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 2,
  },
  dayNameTextSelected: {
    color: '#fef3c7',
    fontWeight: '700',
  },
  dayNumberText: {
    fontSize: 16.5,
    fontWeight: '800',
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
    ...Typography.sectionHeading,
    fontSize: 20,
    color: '#18181b',
  },
  plannerSectionSub: {
    ...Typography.bodyMuted,
    color: '#52525b',
    marginTop: 3,
  },
  plannerProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  plannerProgressText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b45309',
  },
  plannerFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
  },
  plannerFilterTab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  plannerFilterTabActive: {
    backgroundColor: '#b45309',
    borderColor: '#92400e',
  },
  plannerFilterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
    textAlign: 'center',
  },
  plannerFilterTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
  },
  slotTitle: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  currentActiveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentActiveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  qualityBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityBadgeMahashubh: {
    backgroundColor: '#dcfce7',
  },
  qualityBadgeAshubh: {
    backgroundColor: '#fee2e2',
  },
  qualityBadgeText: {
    fontSize: 12,
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
    padding: 12,
    marginBottom: 10,
  },
  suitabilityBoxAshubh: {
    backgroundColor: '#ffe4e6',
  },
  suitabilityHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
  },
  suitabilityText: {
    ...Typography.bodyMuted,
    color: '#334155',
  },
  suitabilityTextAshubh: {
    color: '#9f1239',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  suggestionChip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  suggestionChipText: {
    fontSize: 13.5,
    color: '#3f3f46',
    fontWeight: '600',
  },
  slotProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  slotProgressBadgeDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  slotProgressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  slotProgressBadgeTextDone: {
    color: '#15803d',
  },
  slotTodoList: {
    marginBottom: 10,
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
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  todoCheckboxBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 21,
  },
  todoItemTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: '400',
  },
  todoDeleteBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  addTodoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: COMFORT_TOUCH_TARGET,
    paddingHorizontal: 6,
  },
  addTodoTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#18181b',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  addTodoSubmitBtn: {
    minHeight: MIN_TOUCH_TARGET - 4,
    justifyContent: 'center',
    backgroundColor: '#b45309',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 2,
  },
  addTodoSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
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
    minHeight: 52,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  limbsHeaderText: {
    ...Typography.cardTitle,
    color: '#18181b',
    flexShrink: 1,
  },
  limbsContainer: {
    gap: 10,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  limbCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  limbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  limbIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
  },
  limbStatus: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  limbName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  limbFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  limbEnd: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
  },
  limbDeity: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  modalCloseBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.sectionHeading,
    fontSize: 19,
    color: '#18181b',
  },
  modalSubtitle: {
    ...Typography.bodyMuted,
    color: '#71717a',
    marginTop: 2,
  },
  sankalpaPillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  sankalpaPillLocation: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  sankalpaPillDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  sankalpaSanskrit: {
    fontSize: 15.5,
    lineHeight: 24,
    color: '#18181b',
    fontWeight: '600',
    backgroundColor: '#fafaf9',
    padding: 14,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
    marginBottom: 4,
  },
  meaningText: {
    ...Typography.body,
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
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    minWidth: 96,
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#b45309',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  sadhanaDoneBtn: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#047857',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  sadhanaDoneBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Habits List in Modal
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    backgroundColor: '#fafafa',
    padding: 14,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconBoxDone: {
    backgroundColor: '#10b981',
  },
  habitTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#18181b',
  },
  habitTitleDone: {
    color: '#047857',
  },
  habitDesc: {
    fontSize: 13.5,
    color: '#52525b',
    marginTop: 3,
    lineHeight: 19,
  },
  habitTime: {
    fontSize: 12.5,
    color: '#b45309',
    fontWeight: '700',
    marginTop: 5,
  },

  // Verse Modal
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  contextPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  verseSanskrit: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#18181b',
    lineHeight: 26,
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  verseTranslit: {
    fontSize: 14,
    color: '#78350f',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 21,
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
