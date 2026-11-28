import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  View,
  Platform,
  useColorScheme,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { MUHURTA_CATEGORIES } from '@/src/core/muhurta-finder/categories';
import { findMuhurtas } from '@/src/core/muhurta-finder/calculator';
import { MuhurtaCategoryId, MuhurtaDayEvaluation } from '@/src/core/muhurta-finder/types';
import { calculatePanchang, GeoLocation, PRESET_CITIES } from '@/src/core/panchang';
import { loadUserLocation } from '@/src/services/userProfile';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle, formatHumanIsoDate } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll, useTourHorizontalScroll } from '@/src/hooks/useTourScroll';
import { getAppTheme, MIN_TOUCH_TARGET, Typography } from '@/src/utils/theme';
import { ScreenStateView } from '@/src/components/ui/ScreenStateView';

const MUHURTA_HORIZONTAL_TOUR_TARGETS = ['category-pill-griha_pravesh'] as const;

export default function MuhurtaScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactWidth = windowWidth < 400 || PixelRatio.getFontScale() > 1.2;

  const { openHelp, isInteractiveTourActive, isTryModeActive, currentTourStep } = useTour();
  const listRef = useRef<FlatList<MuhurtaDayEvaluation>>(null);
  const hListRef = useRef<FlatList<(typeof MUHURTA_CATEGORIES)[number]>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/muhurta', listRef);
  const {
    onHorizontalScroll,
    onHorizontalMomentumScrollEnd,
    onHorizontalScrollEndDrag,
  } = useTourHorizontalScroll(
    '/(tabs)/muhurta',
    hListRef,
    MUHURTA_HORIZONTAL_TOUR_TARGETS
  );

  const [userLocation, setUserLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [selectedCategory, setSelectedCategory] = useState<MuhurtaCategoryId>('griha_pravesh');
  const [daysCount, setDaysCount] = useState<30 | 60 | 90>(60);
  const [suitabilityFilter, setSuitabilityFilter] = useState<'All' | 'Good' | 'Optimal'>('Good');
  const [calcResult, setCalcResult] = useState<{
    key: string;
    evaluations: MuhurtaDayEvaluation[];
  } | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isAvoidExpanded, setIsAvoidExpanded] = useState(false);
  const [manualAvoidStepId, setManualAvoidStepId] = useState<string | null>(null);
  const effectiveAvoidExpanded =
    isInteractiveTourActive &&
    currentTourStep?.tab === '/(tabs)/muhurta' &&
    currentTourStep.muhurtaExpandAvoid !== undefined &&
    manualAvoidStepId !== currentTourStep.id
      ? Boolean(currentTourStep.muhurtaExpandAvoid)
      : isAvoidExpanded;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadUserLocation()
        .then((loc) => {
          if (mounted && loc) {
            setUserLocation(loc);
          }
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }, [])
  );

  const currentQueryKey = `${selectedCategory}|${daysCount}|${suitabilityFilter}|${userLocation.name}_${userLocation.latitude}_${userLocation.longitude}`;
  const isCalculating = calcResult?.key !== currentQueryKey;
  const evaluations = useMemo(
    () => (calcResult?.key === currentQueryKey ? calcResult.evaluations : []),
    [calcResult, currentQueryKey]
  );

  // Defer heavy astrological search off the critical render path
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      try {
        const all = findMuhurtas(
          { category: selectedCategory, daysCount, minimumSuitability: suitabilityFilter },
          userLocation,
          new Date(),
          'Lahiri'
        );
        if (isMounted) {
          setCalcResult({ key: currentQueryKey, evaluations: all });
        }
      } catch {
        if (isMounted) {
          setCalcResult({ key: currentQueryKey, evaluations: [] });
        }
      }
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, daysCount, suitabilityFilter, userLocation, currentQueryKey]);

  const handleCategorySelect = (id: MuhurtaCategoryId) => {
    if (id === selectedCategory) return;
    setSelectedCategory(id);
  };

  const handleDaysSelect = (d: 30 | 60 | 90) => {
    if (d === daysCount) return;
    setDaysCount(d);
  };

  const handleSuitabilitySelect = (s: 'All' | 'Good' | 'Optimal') => {
    if (s === suitabilityFilter) return;
    setSuitabilityFilter(s);
  };

  const toggleExpand = (dateStr: string) => {
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const activeCategoryMeta = useMemo(() => {
    return MUHURTA_CATEGORIES.find((c) => c.id === selectedCategory) || MUHURTA_CATEGORIES[0];
  }, [selectedCategory]);

  const todayPanchang = useMemo(() => {
    return calculatePanchang(new Date(), userLocation);
  }, [userLocation]);

  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: userLocation.timezone,
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const listHeader = (
    <View>
      {/* Category Horizontal Pill Selector */}
      <View style={styles.categoryContainer}>
        <FlatList
          ref={hListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MUHURTA_CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          onScroll={onHorizontalScroll}
          onMomentumScrollEnd={onHorizontalMomentumScrollEnd}
          onScrollEndDrag={onHorizontalScrollEndDrag}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedCategory;
            const pillNode = (
              <TouchableOpacity
                testID={`category-pill-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={isHi ? item.titleDevanagari : item.title}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.categoryPill,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && (isDark ? { backgroundColor: theme.primary, borderColor: theme.primary } : styles.categoryPillSelected),
                ]}
                onPress={() => handleCategorySelect(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isDark && { color: theme.textSecondary },
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {isHi ? item.titleDevanagari : item.title}
                </Text>
              </TouchableOpacity>
            );

            return item.id === 'griha_pravesh' ? (
              <TourTarget key={item.id} targetId="category-pill-griha_pravesh" borderRadius={24}>
                {pillNode}
              </TourTarget>
            ) : (
              pillNode
            );
          }}
        />
      </View>

      {/* Active Category Shastric Reference Callout Banner */}
      <View
        style={[
          styles.categoryBanner,
          isDark && { backgroundColor: '#251d0e', borderColor: theme.primaryBorder },
        ]}
      >
        <View style={styles.bannerHeader}>
          <Text style={[styles.bannerTitle, isDark && { color: theme.primary }]}>
            {isHi ? activeCategoryMeta.titleDevanagari : activeCategoryMeta.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={[
                styles.cityBadge,
                isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
              ]}
            >
              <Ionicons name="location-sharp" size={13} color={theme.primary} />
              <Text style={[styles.cityBadgeText, isDark && { color: theme.primary }]}>
                {userLocation.name}
              </Text>
            </View>
            <TouchableOpacity
              testID="muhurta-help-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              onPress={() => openHelp('muhurta')}
              style={[
                styles.helpBtn,
                isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
              ]}
            >
              <Ionicons name="help-circle-outline" size={22} color={isDark ? theme.textSecondary : Palette.textSecondaryLight} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.bannerDesc, isDark && { color: theme.textSecondary }]}>
          {activeCategoryMeta.description}
        </Text>
        <View style={[styles.scriptureBadge, isDark && { backgroundColor: theme.card }]}>
          <Text style={[styles.scriptureBadgeText, isDark && { color: theme.primary }]}>
            📜 {activeCategoryMeta.traditionalReference}
          </Text>
        </View>
      </View>

      {/* Today's Inauspicious & Avoidable Windows (Compact Collapsible Strip above fold) */}
      <TourTarget targetId="muhurta-inauspicious-card" borderRadius={20}>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ expanded: effectiveAvoidExpanded }}
          accessibilityLabel={
            isHi
              ? 'आज के त्याज्य काल विस्तृत करें या समेटें'
              : 'Toggle all inauspicious windows today'
          }
          onPress={() => {
            if (isInteractiveTourActive && currentTourStep?.id) {
              setManualAvoidStepId(currentTourStep.id);
            }
            setIsAvoidExpanded(!effectiveAvoidExpanded);
          }}
          style={[
            styles.inauspiciousCard,
            isDark && { backgroundColor: '#271710', borderColor: theme.primaryBorder },
          ]}
          testID="muhurta-inauspicious-card"
        >
          <View style={styles.inauspiciousHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={[styles.inauspiciousTitle, isDark && { color: '#fdba74' }]}>
                {isHi ? 'आज के त्याज्य काल' : "Today's Avoid Windows"}
              </Text>
              {!effectiveAvoidExpanded && (
                <Text style={[styles.inauspiciousCompactTime, isDark && { color: theme.dangerText }]}>
                  • {isHi ? 'राहु' : 'Rahu'}{' '}
                  {formatTime(todayPanchang.muhurtas.rahuKaal.startTime)} -{' '}
                  {formatTime(todayPanchang.muhurtas.rahuKaal.endTime)}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.inauspiciousSub, isDark && { color: '#fb923c' }]}>
                {effectiveAvoidExpanded ? (isHi ? 'छुपाएं' : 'Hide') : (isHi ? 'सभी ३ काल' : 'Show All 3')}
              </Text>
              <Ionicons
                name={effectiveAvoidExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#fb923c' : '#c2410c'}
              />
            </View>
          </View>

          {effectiveAvoidExpanded && (
            <View style={[styles.inauspiciousRow, isCompactWidth && { flexDirection: 'column' }]}>
              {/* Rahu Kaal */}
              <View
                style={[
                  styles.inauspiciousItem,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={styles.inauspiciousBadgeRed}>{isHi ? 'राहु काल' : 'Rahu Kalam'}</Text>
                <Text style={[styles.inauspiciousTime, isDark && { color: theme.text }]}>
                  {formatTime(todayPanchang.muhurtas.rahuKaal.startTime)} - {formatTime(todayPanchang.muhurtas.rahuKaal.endTime)}
                </Text>
                <Text style={[styles.inauspiciousDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'शुभ कार्य त्याज्य' : 'Avoid beginnings'}
                </Text>
              </View>

              {/* Yamagandam */}
              <View
                style={[
                  styles.inauspiciousItem,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={styles.inauspiciousBadgeOrange}>{isHi ? 'यमगण्ड' : 'Yamagandam'}</Text>
                <Text style={[styles.inauspiciousTime, isDark && { color: theme.text }]}>
                  {formatTime(todayPanchang.muhurtas.yamaganda.startTime)} - {formatTime(todayPanchang.muhurtas.yamaganda.endTime)}
                </Text>
                <Text style={[styles.inauspiciousDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'यात्रा व सौदा वर्जित' : 'Avoid deals/travel'}
                </Text>
              </View>

              {/* Gulika Kaal */}
              <View
                style={[
                  styles.inauspiciousItem,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={styles.inauspiciousBadgePurple}>{isHi ? 'गुलिक काल' : 'Gulika Kalam'}</Text>
                <Text style={[styles.inauspiciousTime, isDark && { color: theme.text }]}>
                  {formatTime(todayPanchang.muhurtas.gulikaKaal.startTime)} - {formatTime(todayPanchang.muhurtas.gulikaKaal.endTime)}
                </Text>
                <Text style={[styles.inauspiciousDesc, isDark && { color: theme.textMuted }]}>
                  {isHi ? 'शनि पुत्र प्रभाव' : 'Saturn son window'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </TourTarget>

      {/* Responsive Filter Strip: Horizon & Quality */}
      <TourTarget targetId="days-pill-30" borderRadius={16}>
        <View
          style={[
            styles.filterSection,
            isCompactWidth && { flexDirection: 'column' },
          ]}
        >
          {/* Horizon Filter (30 / 60 / 90 Days) */}
          <View style={[styles.segmentedFilter, isDark && { backgroundColor: theme.cardMuted }]}>
            {([30, 60, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                testID={`days-pill-${d}`}
                accessibilityRole="button"
                accessibilityLabel={`${d} ${isHi ? 'दिन' : 'Days'}`}
                accessibilityState={{ selected: daysCount === d }}
                style={[
                  styles.segmentBtn,
                  daysCount === d && [styles.segmentBtnActive, isDark && { backgroundColor: theme.card }],
                ]}
                onPress={() => handleDaysSelect(d)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isDark && { color: theme.textMuted },
                    daysCount === d && [styles.segmentTextActive, isDark && { color: theme.text }],
                  ]}
                >
                  {d} {isHi ? 'दिन' : 'Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quality Filter (Good / Optimal) */}
          <View style={[styles.segmentedFilter, isDark && { backgroundColor: theme.cardMuted }]}>
            {(['Good', 'Optimal'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                testID={`suitability-pill-${s}`}
                accessibilityRole="button"
                accessibilityLabel={s}
                accessibilityState={{ selected: suitabilityFilter === s }}
                style={[
                  styles.segmentBtn,
                  suitabilityFilter === s && [styles.segmentBtnActive, isDark && { backgroundColor: theme.card }],
                ]}
                onPress={() => handleSuitabilitySelect(s)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isDark && { color: theme.textMuted },
                    suitabilityFilter === s && [styles.segmentTextActive, isDark && { color: theme.text }],
                  ]}
                >
                  {s === 'Optimal' ? (isHi ? '🌟 श्रेष्ठ' : '🌟 Best (Optimal)') : (isHi ? '✨ उत्तम' : '✨ Good')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TourTarget>

      {!isCalculating && (
        <View style={styles.resultsSummaryBar}>
          <Text style={[styles.resultsCountText, isDark && { color: theme.text }]}>
            {isHi
              ? `कुल ${evaluations.length} अनुकूल मुहूर्त उपलब्ध (${daysCount} दिनों में)`
              : `Found ${evaluations.length} auspicious dates across ${daysCount} days`}
          </Text>
        </View>
      )}
    </View>
  );

  const listEmpty = isCalculating ? (
    <LoadingIndicator
      message={
        isHi
          ? 'शास्त्रसम्मत शुभ मुहूर्त की खगोलीय गणना जारी है...'
          : 'Calculating Astrological Muhurtas...'
      }
    />
  ) : (
    <ScreenStateView
      iconEmoji="🔍"
      title={isHi ? 'कोई अनुकूल मुहूर्त नहीं मिला' : 'No matching muhurta found'}
      description={
        isHi
          ? 'चयनित मापदंडों में कोई निर्दोष काल उपलब्ध नहीं है। समय सीमा ९० दिन करें अथवा "उत्तम" चुनें।'
          : 'No dates match the current criteria. Expand to 90 days or switch quality filter to Good.'
      }
      actionLabel={isHi ? '९० दिनों में खोजें' : 'Search Next 90 Days'}
      actionTestID="expand-days-90-btn"
      onAction={() => {
        setDaysCount(90);
        setSuitabilityFilter('Good');
      }}
    />
  );

  const renderEvaluationItem = ({ item }: { item: MuhurtaDayEvaluation }) => {
    const isOptimal = item.suitability === 'Optimal';
    const isExpanded = expandedDate === item.isoDate;

    return (
      <View
        style={[
          styles.evalCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {/* Top Date & Score Row */}
        <View style={styles.evalHeaderRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent', paddingRight: 8 }}>
            <Text style={[styles.evalDateText, isDark && { color: theme.text }]}>
              {formatHumanIsoDate(item.isoDate, isHi)}
            </Text>
            <Text style={[styles.evalLimbSummaryText, isDark && { color: theme.textMuted }]}>
              {isHi
                ? `${item.panchangSummary.tithiNameDevanagari || item.panchangSummary.tithiName} • ${item.panchangSummary.nakshatraNameDevanagari || item.panchangSummary.nakshatraName}`
                : `${item.panchangSummary.tithiName} • ${item.panchangSummary.nakshatraName}`}
            </Text>
          </View>

          <View
            style={[
              styles.suitabilityBadge,
              isOptimal
                ? [styles.badgeOptimal, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }]
                : [styles.badgeGood, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }],
            ]}
          >
            <Text
              style={[
                styles.suitabilityBadgeText,
                isOptimal
                  ? [styles.suitTextOptimal, isDark && { color: theme.successText }]
                  : [styles.suitTextGood, isDark && { color: theme.primary }],
              ]}
            >
              {isOptimal ? (isHi ? '🌟 अति उत्तम' : '🌟 Best') : (isHi ? '✨ उत्तम' : '✨ Good')}{' '}
              {item.score}%
            </Text>
          </View>
        </View>

        {/* Special Auspicious Yogas Chips */}
        {item.specialYogas.length > 0 && (
          <View style={styles.yogasRow}>
            {item.specialYogas.map((y) => (
              <View
                key={y}
                style={[
                  styles.yogaPill,
                  isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                ]}
              >
                <Text style={[styles.yogaPillText, isDark && { color: theme.primary }]}>
                  ✨ {cleanBilingualTitle(y, isHi)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommended Time Windows */}
        {item.windows.length > 0 && (
          <View
            style={[
              styles.windowsContainer,
              isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder },
            ]}
          >
            <View style={styles.windowHeaderRow}>
              <Ionicons name="time" size={13} color={isDark ? theme.successText : '#047857'} />
              <Text style={[styles.windowLabel, isDark && { color: theme.successText }]}>
                {isHi ? 'सर्वोत्तम समय खिड़की:' : 'Recommended Time Window:'}
              </Text>
            </View>
            {item.windows.slice(0, 2).map((w, idx) => (
              <View key={idx} style={styles.windowItem}>
                <Text style={[styles.windowName, isDark && { color: theme.text }]}>
                  {cleanBilingualTitle(w.label, isHi)}
                </Text>
                <Text style={[styles.windowTime, isDark && { color: theme.successText }]}>
                  {formatTime(w.startTime)} - {formatTime(w.endTime)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Avoid Windows Warning Callout */}
        {item.avoidWindows.length > 0 && (
          <View
            style={[
              styles.avoidContainer,
              isDark && { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder },
            ]}
          >
            <Ionicons name="alert-circle" size={16} color={isDark ? theme.dangerText : '#b91c1c'} />
            <Text style={[styles.avoidLabel, isDark && { color: theme.dangerText }]}>
              {isHi ? 'त्याज्य काल:' : 'Avoid:'}
            </Text>
            <Text style={[styles.avoidText, isDark && { color: theme.textSecondary }]}>
              {item.avoidWindows
                .map((a) => cleanBilingualTitle(a.label, isHi))
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Expand/Collapse Shastric Details */}
        <TouchableOpacity
          testID={`expand-toggle-${item.isoDate}`}
          accessibilityRole="button"
          accessibilityLabel={
            isExpanded
              ? isHi ? 'संक्षिप्त करें' : 'Hide astrological breakdown'
              : isHi ? 'विस्तृत शास्त्रीय विश्लेषण देखें' : 'View astrological breakdown'
          }
          accessibilityState={{ expanded: isExpanded }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.expandToggleRow,
            isDark && { borderTopColor: theme.border },
          ]}
          onPress={() => toggleExpand(item.isoDate)}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandToggleText, isDark && { color: theme.primary }]}>
            {isExpanded
              ? isHi ? 'संक्षिप्त करें' : 'Hide astrological breakdown'
              : isHi ? 'विस्तृत शास्त्रीय विश्लेषण देखें' : 'View astrological breakdown'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.primary}
          />
        </TouchableOpacity>

        {/* Collapsible Details */}
        {isExpanded && (
          <View
            style={[
              styles.expandedDetailsBox,
              isDark && { backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.expandedDetailTitle, isDark && { color: theme.text }]}>
              {isHi ? 'पञ्चाङ्ग शुद्धि:' : 'Panchang Purity:'}
            </Text>
            <Text style={[styles.expandedDetailText, isDark && { color: theme.textSecondary }]}>
              • {isHi ? 'तिथि:' : 'Tithi:'} {item.panchangSummary.tithiName} (
              {item.panchangSummary.tithiPaksha} Paksha)
            </Text>
            <Text style={[styles.expandedDetailText, isDark && { color: theme.textSecondary }]}>
              • {isHi ? 'नक्षत्र:' : 'Nakshatra:'} {item.panchangSummary.nakshatraName}
            </Text>
            <Text style={[styles.expandedDetailText, isDark && { color: theme.textSecondary }]}>
              • {isHi ? 'सौर वार:' : 'Weekday:'} {item.panchangSummary.varaName}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      data={isCalculating ? [] : evaluations}
      keyExtractor={(item) => item.isoDate}
      renderItem={renderEvaluationItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews={Platform.OS !== 'web'}
      showsVerticalScrollIndicator={false}
      onScroll={onTourScroll}
      onMomentumScrollEnd={onTourMomentumScrollEnd}
      onScrollEndDrag={onTourScrollEndDrag}
      scrollEventThrottle={16}
      scrollEnabled={!isInteractiveTourActive || isTryModeActive}
    />
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

  // Category Selector
  categoryContainer: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    marginRight: Spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  categoryPillSelected: {
    backgroundColor: '#b45309',
    borderColor: '#b45309',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },

  // Active Category Banner
  categoryBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
    marginBottom: Spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  bannerTitle: {
    ...Typography.sectionHeading,
    color: '#92400e',
    flexShrink: 1,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  cityBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  helpBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDesc: {
    ...Typography.bodyMuted,
    color: '#78350f',
    marginBottom: 10,
  },
  scriptureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  scriptureBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b45309',
  },

  // Filters Strip
  filterSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  segmentedFilter: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.md,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#18181b',
    fontWeight: '800',
  },

  // Results Summary Bar
  resultsSummaryBar: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  resultsCountText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#18181b',
  },
  inauspiciousCompactTime: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#b91c1c',
    flexShrink: 1,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginTop: Spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  expandDaysBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  expandDaysBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Evaluation Cards
  evalCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  evalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  evalDateText: {
    ...Typography.cardTitle,
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  evalLimbSummaryText: {
    ...Typography.bodyMuted,
    color: '#52525b',
    marginTop: 2,
  },
  suitabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  badgeOptimal: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeGood: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  suitabilityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  suitTextOptimal: {
    color: '#047857',
  },
  suitTextGood: {
    color: '#b45309',
  },

  // Yogas Row
  yogasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  yogaPill: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  yogaPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },

  // Windows
  windowsContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  windowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  windowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  windowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
    paddingVertical: 3,
  },
  windowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  windowTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },

  // Avoid Container
  avoidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 10,
  },
  avoidLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  avoidText: {
    fontSize: 13,
    color: '#991b1b',
    flex: 1,
  },

  // Expand Toggle
  expandToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  expandToggleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.primary,
  },
  expandedDetailsBox: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: Radius.sm,
    gap: 5,
  },
  expandedDetailTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  expandedDetailText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },

  // Today's Inauspicious Windows Card
  inauspiciousCard: {
    backgroundColor: '#fff7ed',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 14,
    marginBottom: 16,
  },
  inauspiciousHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET - 8,
    marginBottom: 6,
  },
  inauspiciousIcon: {
    fontSize: 16,
  },
  inauspiciousTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#9a3412',
  },
  inauspiciousSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#c2410c',
  },
  inauspiciousRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  inauspiciousItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  inauspiciousBadgeRed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 3,
    textAlign: 'center',
  },
  inauspiciousBadgeOrange: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 3,
    textAlign: 'center',
  },
  inauspiciousBadgePurple: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 3,
    textAlign: 'center',
  },
  inauspiciousTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 3,
  },
  inauspiciousDesc: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
  },
});
