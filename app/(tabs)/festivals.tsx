import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getFestivalTimeline } from '@/src/core/festivals/timeline';
import {
  FestivalCategory,
  FestivalTimelineItem,
  FestivalTimelineResponse,
} from '@/src/core/festivals/types';
import { GeoLocation, PRESET_CITIES } from '@/src/core/panchang';
import { loadUserLocation } from '@/src/services/userProfile';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanPujaMuhurta } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll, useTourHorizontalScroll } from '@/src/hooks/useTourScroll';
import { getAppTheme, MIN_TOUCH_TARGET, COMFORT_TOUCH_TARGET, Typography } from '@/src/utils/theme';
import { ScreenStateView } from '@/src/components/ui/ScreenStateView';

const FESTIVALS_HORIZONTAL_TOUR_TARGETS = ['category-chip-all'] as const;

export default function FestivalsScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const { openHelp, isInteractiveTourActive, isTryModeActive } = useTour();
  const listRef = useRef<FlatList<FestivalTimelineItem>>(null);
  const hScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/festivals', listRef);
  const {
    onHorizontalScroll,
    onHorizontalMomentumScrollEnd,
    onHorizontalScrollEndDrag,
  } = useTourHorizontalScroll(
    '/(tabs)/festivals',
    hScrollRef,
    FESTIVALS_HORIZONTAL_TOUR_TARGETS
  );

  const [userLocation, setUserLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FestivalCategory>('all');
  const [expandedFestivalId, setExpandedFestivalId] = useState<string | null>(null);
  const [timelineState, setTimelineState] = useState<{
    key: string;
    response: FestivalTimelineResponse;
  }>(() => ({
    key: '',
    response: {
      year: new Date().getFullYear(),
      totalCount: 0,
      location: PRESET_CITIES[0],
      categories: [],
      months: [],
      festivals: [],
    },
  }));

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

  const currentQueryKey = `${year}|${selectedCategory}|${searchQuery}|${userLocation.name}_${userLocation.latitude}_${userLocation.longitude}`;
  const isCalculating = timelineState.key !== currentQueryKey;
  const timeline = useMemo(() => timelineState.response, [timelineState.response]);

  // Defer timeline generation off the critical render path
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      try {
        const res = getFestivalTimeline(
          { year, category: selectedCategory, searchQuery },
          userLocation
        );
        if (isMounted) {
          setTimelineState({ key: currentQueryKey, response: res });
        }
      } catch {
        if (isMounted) {
          setTimelineState((prev) => ({ ...prev, key: currentQueryKey }));
        }
      }
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [year, selectedCategory, searchQuery, userLocation, currentQueryKey]);

  const handleYearSelect = (y: number) => {
    if (y === year) return;
    setYear(y);
  };

  const handleCategorySelect = (c: FestivalCategory) => {
    if (c === selectedCategory) return;
    setSelectedCategory(c);
  };

  const toggleExpand = (id: string) => {
    setExpandedFestivalId((prev) => (prev === id ? null : id));
  };

  const categories: { id: FestivalCategory; labelEn: string; labelHi: string; icon: string }[] = [
    { id: 'all', labelEn: 'All', labelHi: 'सभी', icon: '✨' },
    { id: 'major', labelEn: 'Major Festivals', labelHi: 'प्रमुख पर्व', icon: '🪔' },
    { id: 'vrat', labelEn: 'Vrats', labelHi: 'व्रत', icon: '🌾' },
    { id: 'jayanti', labelEn: 'Jayantis', labelHi: 'जयन्तियां', icon: '🕉️' },
    { id: 'sankranti', labelEn: 'Sankranti', labelHi: 'संक्रान्ति', icon: '☀️' },
  ];

  // Kept as a ReactElement so TextInput preserves focus inside FlatList ListHeaderComponent
  const listHeader = (
    <View>
      {/* Top Year Switcher & Search Bar */}
      <View style={styles.topControls}>
        <View style={styles.topHeaderRow}>
          {/* Year Pills */}
          <View style={[styles.yearRow, isDark && { backgroundColor: theme.cardMuted }]}>
            {[2025, 2026, 2027].map((y) => (
              <TouchableOpacity
                key={y}
                testID={`year-btn-${y}`}
                accessibilityRole="button"
                accessibilityLabel={String(y)}
                accessibilityState={{ selected: year === y }}
                style={[
                  styles.yearBtn,
                  year === y && [styles.yearBtnActive, isDark && { backgroundColor: theme.primary }],
                ]}
                onPress={() => handleYearSelect(y)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.yearText,
                    isDark && { color: theme.textMuted },
                    year === y && styles.yearTextActive,
                  ]}
                >
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View
            style={[
              styles.cityPill,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="location-sharp" size={14} color={theme.primary} />
            <Text style={[styles.cityPillText, isDark && { color: theme.text }]}>
              {userLocation.name}
            </Text>
          </View>
          <TouchableOpacity
            testID="festivals-help-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            onPress={() => openHelp('festivals')}
            style={[
              styles.helpBtn,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="help-circle-outline" size={22} color={isDark ? theme.textSecondary : Palette.textSecondaryLight} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TourTarget targetId="festival-search-input" borderRadius={18}>
          <View
            style={[
              styles.searchBar,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={20} color={isDark ? theme.textMuted : '#71717a'} />
            <TextInput
              testID="festival-search-input"
              accessibilityLabel={isHi ? 'पर्व या व्रत खोजें' : 'Search festivals'}
              style={[styles.searchInput, isDark && { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                isHi ? 'पर्व, व्रत अथवा देवता खोजें...' : 'Search festivals, fasts, deities...'
              }
              placeholderTextColor={theme.textSubtle}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                testID="clear-search-icon"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'खोज साफ़ करें' : 'Clear search'}
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={22} color={isDark ? theme.textMuted : '#71717a'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </TourTarget>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryChips}>
        <ScrollView
          ref={hScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          onScroll={onHorizontalScroll}
          onMomentumScrollEnd={onHorizontalMomentumScrollEnd}
          onScrollEndDrag={onHorizontalScrollEndDrag}
          scrollEventThrottle={16}
        >
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            const chipNode = (
              <TouchableOpacity
                key={c.id}
                testID={`category-chip-${c.id}`}
                accessibilityRole="button"
                accessibilityLabel={isHi ? c.labelHi : c.labelEn}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.chip,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && (isDark ? { backgroundColor: theme.primary, borderColor: theme.primary } : styles.chipActive),
                ]}
                onPress={() => handleCategorySelect(c.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipIcon}>{c.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    isDark && { color: theme.textSecondary },
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {isHi ? c.labelHi : c.labelEn}
                </Text>
              </TouchableOpacity>
            );

            return c.id === 'all' ? (
              <TourTarget key={c.id} targetId="category-chip-all" borderRadius={16}>
                {chipNode}
              </TourTarget>
            ) : (
              chipNode
            );
          })}
        </ScrollView>
      </View>

      {!isCalculating && (
        <View style={styles.summaryBar}>
          <Text style={[styles.summaryText, isDark && { color: theme.text }]}>
            {isHi
              ? `वर्ष ${year} में कुल ${timeline.totalCount} पर्व एवं व्रत (${timeline.festivals.length} प्रदर्शित)`
              : `Total ${timeline.totalCount} events in ${year} (${timeline.festivals.length} listed)`}
          </Text>
          {timeline.nextUpcoming ? (
            <View
              style={[
                styles.nextUpcomingPill,
                isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
              ]}
            >
              <Ionicons name="calendar-outline" size={14} color={theme.primary} />
              <Text style={[styles.nextUpcomingText, { color: theme.primary }]}>
                {isHi
                  ? `अगला: ${timeline.nextUpcoming.nameDevanagari}`
                  : `Next: ${timeline.nextUpcoming.name}`}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  const listEmpty = isCalculating ? (
    <LoadingIndicator
      message={
        isHi
          ? 'पर्व एवं व्रत तालिका लोड हो रही है...'
          : 'Loading Festival Calendar...'
      }
    />
  ) : (
    <ScreenStateView
      tone="empty"
      iconName={searchQuery || selectedCategory !== 'all' ? 'search-outline' : 'calendar-outline'}
      title={isHi ? 'कोई पर्व नहीं मिला' : 'No festivals found'}
      description={
        searchQuery
          ? isHi
            ? `'${searchQuery}' से मिलता-जुलता कोई पर्व अथवा व्रत उपलब्ध नहीं है।`
            : `No results match '${searchQuery}'. Try another query.`
          : isHi
          ? 'चयनित श्रेणी में इस वर्ष कोई पर्व उपलब्ध नहीं है।'
          : 'No festivals available in this category for this year.'
      }
      actionLabel={
        searchQuery
          ? (isHi ? 'खोज साफ़ करें' : 'Clear Search')
          : selectedCategory !== 'all'
            ? (isHi ? 'सभी श्रेणियां दिखाएं' : 'Show All Categories')
            : undefined
      }
      onAction={
        searchQuery || selectedCategory !== 'all'
          ? () => {
              setSearchQuery('');
              setSelectedCategory('all');
            }
          : undefined
      }
      actionTestID="clear-search-btn"
    />
  );

  const renderFestivalItem = ({ item: f }: { item: FestivalTimelineItem }) => {
    const isToday = f.timeStatus === 'today';
    const isTomorrow = f.daysRemaining === 1;
    const isExpanded = expandedFestivalId === f.id;

    // Parse date for prominent badge
    const dateParts = f.date.split('-');
    const dayNumber = dateParts[2] || '1';
    const monthIndex = parseInt(dateParts[1] || '1', 10) - 1;
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesHi = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुलाई', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];
    const monthName = isHi ? monthNamesHi[monthIndex] : monthNamesEn[monthIndex];

    return (
      <View
        style={[
          styles.festCard,
          isDark && { backgroundColor: theme.card, borderColor: theme.border },
          isToday && [styles.festCardToday, isDark && { borderColor: theme.primary, backgroundColor: '#251d0e' }],
        ]}
      >
        {/* Card Header & Body */}
        <View style={styles.festMainRow}>
          {/* Left Date Block */}
          <View
            style={[
              styles.dateBlock,
              isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
              isToday && styles.dateBlockToday,
            ]}
          >
            <Text
              style={[
                styles.dateDayNumber,
                isDark && { color: theme.text },
                isToday && styles.dateDayNumberToday,
              ]}
            >
              {dayNumber}
            </Text>
            <Text
              style={[
                styles.dateMonthName,
                isDark && { color: theme.textMuted },
                isToday && styles.dateMonthNameToday,
              ]}
            >
              {monthName}
            </Text>
          </View>

          {/* Middle Info */}
          <View style={styles.festInfo}>
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryBadge,
                  isDark && { backgroundColor: theme.cardMuted },
                ]}
              >
                <Text style={[styles.categoryBadgeText, isDark && { color: theme.textSecondary }]}>
                  {f.category === 'Vrat'
                    ? isHi ? 'व्रत' : 'Vrat'
                    : f.category === 'Sankranti'
                    ? isHi ? 'संक्रान्ति' : 'Sankranti'
                    : f.category === 'Jayanti'
                    ? isHi ? 'जयन्ती' : 'Jayanti'
                    : isHi ? 'प्रमुख पर्व' : 'Major Festival'}
                </Text>
              </View>

              {/* Status Badge */}
              {isToday ? (
                <View style={styles.statusBadgeToday}>
                  <Text style={styles.statusBadgeTodayText}>
                    {isHi ? '● आज' : '● Today'}
                  </Text>
                </View>
              ) : isTomorrow ? (
                <View style={[styles.statusBadgeTomorrow, isDark && { backgroundColor: theme.primaryBg }]}>
                  <Text style={[styles.statusBadgeTomorrowText, isDark && { color: theme.primary }]}>
                    {isHi ? 'कल' : 'Tomorrow'}
                  </Text>
                </View>
              ) : f.daysRemaining !== null && f.daysRemaining > 0 && f.daysRemaining <= 30 ? (
                <View style={[styles.statusBadgeUpcoming, isDark && { backgroundColor: theme.infoBg }]}>
                  <Text style={[styles.statusBadgeUpcomingText, isDark && { color: theme.infoText }]}>
                    {f.daysRemaining} {isHi ? 'दिन शेष' : 'days left'}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.festNameTitle, isDark && { color: theme.text }]}>
              {isHi ? f.nameDevanagari : f.name}
            </Text>

            <Text style={[styles.festTithiSub, isDark && { color: theme.textMuted }]}>
              {isHi ? f.dayOfWeekDevanagari : f.dayOfWeek} • {isHi ? f.masaNameDevanagari : f.masaName} • {isHi ? f.tithiNameDevanagari : f.tithiName}
            </Text>
          </View>
        </View>

        {/* Puja Muhurta Highlight Box */}
        {f.pujaMuhurta ? (
          <View
            style={[
              styles.pujaBox,
              isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder },
            ]}
          >
            <Ionicons name="flame" size={13} color={isDark ? theme.successText : '#047857'} />
            <Text style={[styles.pujaLabel, isDark && { color: theme.successText }]}>
              {isHi ? 'पूजा मुहूर्त:' : 'Puja Muhurta:'}{' '}
              <Text style={[styles.pujaVal, isDark && { color: theme.text }]}>
                {cleanPujaMuhurta(f.pujaMuhurta, isHi)}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Expand / Collapse Details Button */}
        {(f.significance || (f.rituals && f.rituals.length > 0)) && (
          <TouchableOpacity
            testID={`fest-expand-${f.id}`}
            accessibilityRole="button"
            accessibilityLabel={
              isExpanded
                ? isHi ? 'संक्षिप्त करें' : 'Hide details'
                : isHi ? 'माहात्म्य व पूजा विधि' : 'View significance & rituals'
            }
            accessibilityState={{ expanded: isExpanded }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.expandRow, isDark && { borderTopColor: theme.border }]}
            onPress={() => toggleExpand(f.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.expandRowText, isDark && { color: theme.primary }]}>
              {isExpanded
                ? isHi ? 'संक्षिप्त करें' : 'Hide details'
                : isHi ? 'माहात्म्य व पूजा विधि' : 'View significance & rituals'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <View style={[styles.expandedContentBox, isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            {f.significance ? (
              <View
                style={[
                  styles.significanceBox,
                  isDark && { backgroundColor: theme.card },
                ]}
              >
                <Text style={[styles.significanceHeading, isDark && { color: theme.primary }]}>
                  {isHi ? '📜 शास्त्रीय माहात्म्य:' : '📜 Scriptural Significance:'}
                </Text>
                <Text style={[styles.significanceText, isDark && { color: theme.textSecondary }]}>
                  {f.significance}
                </Text>
              </View>
            ) : null}

            {f.rituals && f.rituals.length > 0 ? (
              <View
                style={[
                  styles.rulesBox,
                  isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.rulesHeading, isDark && { color: theme.primary }]}>
                  {isHi ? '🪔 पूजा विधान व अनुष्ठान:' : '🪔 Rituals & Worship:'}
                </Text>
                {f.rituals.map((r, rIdx) => (
                  <Text key={rIdx} style={[styles.rulesText, isDark && { color: theme.textSecondary }]}>
                    • {r}
                  </Text>
                ))}
              </View>
            ) : null}
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
      data={isCalculating ? [] : timeline.festivals}
      keyExtractor={(item) => item.id}
      renderItem={renderFestivalItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      initialNumToRender={15}
      maxToRenderPerBatch={15}
      windowSize={7}
      removeClippedSubviews={Platform.OS !== 'web'}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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

  // Top Controls
  topControls: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
    gap: Spacing.sm,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  helpBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRow: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.md,
    padding: 4,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3f3f46',
  },
  yearBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET - 4,
    justifyContent: 'center',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  yearBtnActive: {
    backgroundColor: Palette.primary,
  },
  yearText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#52525b',
  },
  yearTextActive: {
    color: '#ffffff',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#18181b',
    paddingVertical: 6,
  },
  clearSearchBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Chips
  categoryChips: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.xl,
    marginRight: Spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  chipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipIcon: {
    fontSize: 15,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3f3f46',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  summaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#52525b',
  },
  nextUpcomingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  nextUpcomingText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },

  // Festival Card
  festCard: {
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
  festCardToday: {
    borderColor: Palette.primary,
    borderWidth: 1.5,
    backgroundColor: '#fffdfa',
  },
  festMainRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },

  // Left Date Block
  dateBlock: {
    minWidth: 62,
    minHeight: 62,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockToday: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  dateDayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181b',
    lineHeight: 24,
  },
  dateDayNumberToday: {
    color: '#ffffff',
  },
  dateMonthName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#52525b',
    textTransform: 'uppercase',
  },
  dateMonthNameToday: {
    color: '#ffffff',
  },

  // Middle Info
  festInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 5,
    backgroundColor: 'transparent',
  },
  categoryBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525b',
  },
  statusBadgeToday: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeTodayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  statusBadgeTomorrow: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeTomorrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  statusBadgeUpcomingText: {
    fontSize: 12,
    color: '#52525b',
    fontWeight: '600',
  },
  festNameTitle: {
    ...Typography.cardTitle,
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  festTithiSub: {
    ...Typography.bodyMuted,
    color: '#52525b',
    marginTop: 3,
  },

  // Puja Box
  pujaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pujaLabel: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: '#166534',
    flex: 1,
  },
  pujaVal: {
    fontWeight: '800',
    color: '#15803d',
  },

  // Expand Row
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  expandRowText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.primary,
  },

  // Expanded Content Box
  expandedContentBox: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  significanceBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: Radius.sm,
  },
  significanceHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 4,
  },
  significanceText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
  },
  rulesBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: Radius.sm,
  },
  rulesHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
    marginBottom: 2,
  },
});
