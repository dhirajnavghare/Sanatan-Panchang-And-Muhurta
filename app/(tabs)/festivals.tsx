import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFestivalTimeline } from '@/src/core/festivals/timeline';
import {
  FestivalCategory,
  FestivalTimelineItem,
  FestivalTimelineResponse,
} from '@/src/core/festivals/types';
import { PRESET_CITIES } from '@/src/core/panchang';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanPujaMuhurta } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';

export default function FestivalsScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const { openHelp, isInteractiveTourActive, currentTourStep } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Auto-scroll to spotlighted festival elements during guided tour
  useEffect(() => {
    if (isInteractiveTourActive && currentTourStep) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isInteractiveTourActive, currentTourStep]);

  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FestivalCategory>('all');
  const [expandedFestivalId, setExpandedFestivalId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<FestivalTimelineResponse>(() => ({
    year: new Date().getFullYear(),
    totalCount: 0,
    location: PRESET_CITIES[0],
    categories: [],
    months: [],
    festivals: [],
  }));
  const [isCalculating, setIsCalculating] = useState(true);

  // Defer timeline generation off the critical render path
  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);
    const timer = setTimeout(() => {
      try {
        const res = getFestivalTimeline(
          { year, category: selectedCategory, searchQuery },
          PRESET_CITIES[0]
        );
        if (isMounted) {
          setTimeline(res);
          setIsCalculating(false);
        }
      } catch {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [year, selectedCategory, searchQuery]);

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

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!isInteractiveTourActive}
    >
      {/* Top Year Switcher & Search Bar */}
      <View style={styles.topControls}>
        <View style={styles.topHeaderRow}>
          {/* Year Pills */}
          <View style={styles.yearRow}>
            {[2025, 2026, 2027].map((y) => (
              <TouchableOpacity
                key={y}
                testID={`year-btn-${y}`}
                style={[styles.yearBtn, year === y && styles.yearBtnActive]}
                onPress={() => handleYearSelect(y)}
                activeOpacity={0.8}
              >
                <Text style={[styles.yearText, year === y && styles.yearTextActive]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            testID="festivals-help-btn"
            onPress={() => openHelp('festivals')}
            style={styles.helpBtn}
            accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
          >
            <Ionicons name="help-circle-outline" size={20} color={Palette.textSecondaryLight} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TourTarget targetId="festival-search-input" borderRadius={18}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#71717a" />
            <TextInput
              testID="festival-search-input"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                isHi ? 'पर्व, व्रत अथवा देवता खोजें...' : 'Search festivals, fasts, deities...'
              }
              placeholderTextColor="#a1a1aa"
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                testID="clear-search-icon"
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#71717a" />
              </TouchableOpacity>
            ) : null}
          </View>
        </TourTarget>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryChips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2 }}>
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            const chipNode = (
              <TouchableOpacity
                key={c.id}
                testID={`category-chip-${c.id}`}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleCategorySelect(c.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipIcon}>{c.icon}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
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

      {isCalculating ? (
        <LoadingIndicator
          message={
            isHi
              ? 'पर्व एवं व्रत तालिका लोड हो रही है...'
              : 'Loading Festival Calendar...'
          }
        />
      ) : (
        <>
          {/* Summary Row */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              {isHi
                ? `वर्ष ${year} में कुल ${timeline.totalCount} पर्व एवं व्रत (${timeline.festivals.length} प्रदर्शित)`
                : `Total ${timeline.totalCount} events in ${year} (${timeline.festivals.length} listed)`}
            </Text>
          </View>

          {/* Empty Search State */}
          {timeline.festivals.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={{ fontSize: 30 }}>🔍</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {isHi ? 'कोई पर्व नहीं मिला' : 'No festivals found'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? isHi
                    ? `'${searchQuery}' से मिलता-जुलता कोई पर्व अथवा व्रत उपलब्ध नहीं है।`
                    : `No results match '${searchQuery}'. Try another query.`
                  : isHi
                  ? 'चयनित श्रेणी में इस वर्ष कोई पर्व उपलब्ध नहीं है।'
                  : 'No festivals available in this category for this year.'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchBtnText}>
                    {isHi ? 'खोज साफ़ करें' : 'Clear Search'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            timeline.festivals.map((f: FestivalTimelineItem) => {
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
                  key={f.id}
                  style={[
                    styles.festCard,
                    isToday && styles.festCardToday,
                  ]}
                >
                  {/* Card Header & Body */}
                  <View style={styles.festMainRow}>
                    {/* Left Date Block */}
                    <View style={[styles.dateBlock, isToday && styles.dateBlockToday]}>
                      <Text style={[styles.dateDayNumber, isToday && styles.dateDayNumberToday]}>
                        {dayNumber}
                      </Text>
                      <Text style={[styles.dateMonthName, isToday && styles.dateMonthNameToday]}>
                        {monthName}
                      </Text>
                    </View>

                    {/* Middle Info */}
                    <View style={styles.festInfo}>
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
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
                          <View style={styles.statusBadgeTomorrow}>
                            <Text style={styles.statusBadgeTomorrowText}>
                              {isHi ? 'कल' : 'Tomorrow'}
                            </Text>
                          </View>
                        ) : f.daysRemaining !== null && f.daysRemaining > 0 && f.daysRemaining <= 30 ? (
                          <View style={styles.statusBadgeUpcoming}>
                            <Text style={styles.statusBadgeUpcomingText}>
                              {f.daysRemaining} {isHi ? 'दिन शेष' : 'days left'}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.festNameTitle}>
                        {isHi ? f.nameDevanagari : f.name}
                      </Text>

                      <Text style={styles.festTithiSub}>
                        {isHi ? f.dayOfWeekDevanagari : f.dayOfWeek} • {isHi ? f.masaNameDevanagari : f.masaName} • {isHi ? f.tithiNameDevanagari : f.tithiName}
                      </Text>
                    </View>
                  </View>

                  {/* Puja Muhurta Highlight Box */}
                  {f.pujaMuhurta ? (
                    <View style={styles.pujaBox}>
                      <Ionicons name="flame" size={13} color="#047857" />
                      <Text style={styles.pujaLabel}>
                        {isHi ? 'पूजा मुहूर्त:' : 'Puja Muhurta:'}{' '}
                        <Text style={styles.pujaVal}>{cleanPujaMuhurta(f.pujaMuhurta, isHi)}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {/* Expand / Collapse Details Button */}
                  {(f.significance || (f.rituals && f.rituals.length > 0)) && (
                    <TouchableOpacity
                      testID={`fest-expand-${f.id}`}
                      style={styles.expandRow}
                      onPress={() => toggleExpand(f.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandRowText}>
                        {isExpanded
                          ? isHi ? 'संक्षिप्त करें' : 'Hide details'
                          : isHi ? 'माहात्म्य व पूजा विधि' : 'View significance & rituals'}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={Palette.primary}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContentBox}>
                      {f.significance ? (
                        <View style={styles.significanceBox}>
                          <Text style={styles.significanceHeading}>
                            {isHi ? '📜 शास्त्रीय माहात्म्य:' : '📜 Scriptural Significance:'}
                          </Text>
                          <Text style={styles.significanceText}>{f.significance}</Text>
                        </View>
                      ) : null}

                      {f.rituals && f.rituals.length > 0 ? (
                        <View style={styles.rulesBox}>
                          <Text style={styles.rulesHeading}>
                            {isHi ? '🪔 पूजा विधान व अनुष्ठान:' : '🪔 Rituals & Worship:'}
                          </Text>
                          {f.rituals.map((r, rIdx) => (
                            <Text key={rIdx} style={styles.rulesText}>
                              • {r}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
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

  // Top Controls
  topControls: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
    gap: Spacing.sm,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  helpBtn: {
    padding: 7,
    borderRadius: Radius.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.md,
    padding: 3,
  },
  yearBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  yearBtnActive: {
    backgroundColor: '#18181b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717a',
  },
  yearTextActive: {
    color: '#ffffff',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
    padding: 0,
  },

  // Category Chips
  categoryChips: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.xl,
    marginRight: Spacing.sm,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  chipActive: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525b',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Summary
  summaryBar: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },

  // Empty Card
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  clearSearchBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  clearSearchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    width: 50,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlockToday: {
    backgroundColor: Palette.primary,
  },
  dateDayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
    lineHeight: 22,
  },
  dateDayNumberToday: {
    color: '#ffffff',
  },
  dateMonthName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
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
    gap: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  categoryBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
  },
  statusBadgeToday: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusBadgeTodayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  statusBadgeTomorrow: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusBadgeTomorrowText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  statusBadgeUpcomingText: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '600',
  },
  festNameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    letterSpacing: -0.2,
  },
  festTithiSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },

  // Puja Box
  pujaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pujaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
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
    gap: 4,
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  expandRowText: {
    fontSize: 11,
    fontWeight: '600',
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
    padding: 8,
    borderRadius: Radius.sm,
  },
  significanceHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 2,
  },
  significanceText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  rulesBox: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: Radius.sm,
  },
  rulesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2,
  },
  rulesText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
});
