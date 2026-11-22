import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MUHURTA_CATEGORIES } from '@/src/core/muhurta-finder/categories';
import { findMuhurtas } from '@/src/core/muhurta-finder/calculator';
import { MuhurtaCategoryId, MuhurtaDayEvaluation } from '@/src/core/muhurta-finder/types';
import { calculatePanchang, PRESET_CITIES } from '@/src/core/panchang';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';

export default function MuhurtaScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const { openHelp, isInteractiveTourActive, currentTourStep } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Auto-scroll to spotlighted muhurta elements during guided tour
  useEffect(() => {
    if (isInteractiveTourActive && currentTourStep) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isInteractiveTourActive, currentTourStep]);

  const [selectedCategory, setSelectedCategory] = useState<MuhurtaCategoryId>('griha_pravesh');
  const [daysCount, setDaysCount] = useState<30 | 60 | 90>(60);
  const [suitabilityFilter, setSuitabilityFilter] = useState<'All' | 'Good' | 'Optimal'>('Good');
  const [evaluations, setEvaluations] = useState<MuhurtaDayEvaluation[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Defer heavy astrological search off the critical render path
  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);
    const timer = setTimeout(() => {
      try {
        const all = findMuhurtas(
          { category: selectedCategory, daysCount, minimumSuitability: suitabilityFilter },
          PRESET_CITIES[0],
          new Date(),
          'Lahiri'
        );
        if (isMounted) {
          setEvaluations(all);
          setIsCalculating(false);
        }
      } catch {
        if (isMounted) {
          setEvaluations([]);
          setIsCalculating(false);
        }
      }
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, daysCount, suitabilityFilter]);

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
    return calculatePanchang(new Date(), PRESET_CITIES[0]);
  }, []);

  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isInteractiveTourActive}
    >
      {/* Category Horizontal Pill Selector */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MUHURTA_CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedCategory;
            const pillNode = (
              <TouchableOpacity
                testID={`category-pill-${item.id}`}
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => handleCategorySelect(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
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
      <View style={styles.categoryBanner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>
            {isHi ? activeCategoryMeta.titleDevanagari : activeCategoryMeta.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.cityBadge}>
              <Ionicons name="location-sharp" size={11} color={Palette.primary} />
              <Text style={styles.cityBadgeText}>{PRESET_CITIES[0].name}</Text>
            </View>
            <TouchableOpacity
              testID="muhurta-help-btn"
              onPress={() => openHelp('muhurta')}
              style={styles.helpBtn}
              accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
            >
              <Ionicons name="help-circle-outline" size={18} color={Palette.textSecondaryLight} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.bannerDesc}>{activeCategoryMeta.description}</Text>
        <View style={styles.scriptureBadge}>
          <Text style={styles.scriptureBadgeText}>
            📜 {activeCategoryMeta.traditionalReference}
          </Text>
        </View>
      </View>

      {/* Today's Inauspicious & Avoidable Windows */}
      <TourTarget targetId="muhurta-inauspicious-card" borderRadius={20}>
        <View style={styles.inauspiciousCard} testID="muhurta-inauspicious-card">
          <View style={styles.inauspiciousHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13 }}>⚠️</Text>
              <Text style={styles.inauspiciousTitle}>
                {isHi ? 'आज के त्याज्य व अशुभ काल' : "Today's Inauspicious Windows"}
              </Text>
            </View>
            <Text style={styles.inauspiciousSub}>
              {isHi ? 'आरम्भ वर्जित' : 'Avoid Beginnings'}
            </Text>
          </View>

          <View style={styles.inauspiciousRow}>
            {/* Rahu Kaal */}
            <View style={styles.inauspiciousItem}>
              <Text style={styles.inauspiciousBadgeRed}>{isHi ? 'राहु काल' : 'Rahu Kalam'}</Text>
              <Text style={styles.inauspiciousTime}>
                {formatTime(todayPanchang.muhurtas.rahuKaal.startTime)} - {formatTime(todayPanchang.muhurtas.rahuKaal.endTime)}
              </Text>
              <Text style={styles.inauspiciousDesc}>
                {isHi ? 'शुभ कार्य त्याज्य' : 'Avoid beginnings'}
              </Text>
            </View>

            {/* Yamagandam */}
            <View style={styles.inauspiciousItem}>
              <Text style={styles.inauspiciousBadgeOrange}>{isHi ? 'यमगण्ड' : 'Yamagandam'}</Text>
              <Text style={styles.inauspiciousTime}>
                {formatTime(todayPanchang.muhurtas.yamaganda.startTime)} - {formatTime(todayPanchang.muhurtas.yamaganda.endTime)}
              </Text>
              <Text style={styles.inauspiciousDesc}>
                {isHi ? 'यात्रा व सौदा वर्जित' : 'Avoid deals/travel'}
              </Text>
            </View>

            {/* Gulika Kaal */}
            <View style={styles.inauspiciousItem}>
              <Text style={styles.inauspiciousBadgePurple}>{isHi ? 'गुलिक काल' : 'Gulika Kalam'}</Text>
              <Text style={styles.inauspiciousTime}>
                {formatTime(todayPanchang.muhurtas.gulikaKaal.startTime)} - {formatTime(todayPanchang.muhurtas.gulikaKaal.endTime)}
              </Text>
              <Text style={styles.inauspiciousDesc}>
                {isHi ? 'शनि पुत्र प्रभाव' : 'Saturn son window'}
              </Text>
            </View>
          </View>
        </View>
      </TourTarget>

      {/* Modern Filter Strip: Horizon & Quality */}
      <TourTarget targetId="days-pill-30" borderRadius={16}>
        <View style={styles.filterSection}>
          {/* Horizon Filter (30 / 60 / 90 Days) */}
          <View style={styles.segmentedFilter}>
            {([30, 60, 90] as const).map((d) => (
              <TouchableOpacity
                key={d}
                testID={`days-pill-${d}`}
                style={[styles.segmentBtn, { width: '100%' }, daysCount === d && styles.segmentBtnActive]}
                onPress={() => handleDaysSelect(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, daysCount === d && styles.segmentTextActive]}>
                  {d} {isHi ? 'दिन' : 'Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quality Filter (Good / Optimal) */}
          <View style={styles.segmentedFilter}>
            {(['Good', 'Optimal'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                testID={`suitability-pill-${s}`}
                style={[styles.segmentBtn, suitabilityFilter === s && styles.segmentBtnActive]}
                onPress={() => handleSuitabilitySelect(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, suitabilityFilter === s && styles.segmentTextActive]}>
                  {s === 'Optimal' ? (isHi ? '🌟 श्रेष्ठ' : '🌟 Optimal') : (isHi ? '✨ उत्तम' : '✨ Good')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TourTarget>

      {isCalculating ? (
        <LoadingIndicator
          message={
            isHi
              ? 'शास्त्रसम्मत शुभ मुहूर्त की खगोलीय गणना जारी है...'
              : 'Calculating Astrological Muhurtas...'
          }
        />
      ) : (
        <>
          {/* Results Summary Bar */}
          <View style={styles.resultsSummaryBar}>
            <Text style={styles.resultsCountText}>
              {isHi
                ? `कुल ${evaluations.length} अनुकूल मुहूर्त उपलब्ध (${daysCount} दिनों में)`
                : `Found ${evaluations.length} auspicious dates across ${daysCount} days`}
            </Text>
          </View>

          {/* Evaluations List */}
          {evaluations.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={{ fontSize: 32 }}>🔍</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {isHi ? 'कोई अनुकूल मुहूर्त नहीं मिला' : 'No matching muhurta found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isHi
                  ? 'चयनित मापदंडों में कोई निर्दोष काल उपलब्ध नहीं है। कृपया समय सीमा को ९० दिन करें अथवा उत्तम गुणवत्ता चुनें।'
                  : 'No dates match the strict astrological criteria in this period. Try expanding to 90 days.'}
              </Text>
              <TouchableOpacity
                style={styles.expandDaysBtn}
                onPress={() => {
                  setDaysCount(90);
                  setSuitabilityFilter('Good');
                }}
              >
                <Text style={styles.expandDaysBtnText}>
                  {isHi ? '९० दिनों में खोजें' : 'Search Next 90 Days'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            evaluations.map((item) => {
              const isOptimal = item.suitability === 'Optimal';
              const isExpanded = expandedDate === item.isoDate;

              return (
                <View key={item.isoDate} style={styles.evalCard}>
                  {/* Top Date & Score Row */}
                  <View style={styles.evalHeaderRow}>
                    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                      <Text style={styles.evalDateText}>{item.isoDate}</Text>
                      <Text style={styles.evalLimbSummaryText}>
                        {isHi
                          ? `${item.panchangSummary.tithiNameDevanagari || item.panchangSummary.tithiName} • ${item.panchangSummary.nakshatraNameDevanagari || item.panchangSummary.nakshatraName}`
                          : `${item.panchangSummary.tithiName} • ${item.panchangSummary.nakshatraName}`}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.suitabilityBadge,
                        isOptimal ? styles.badgeOptimal : styles.badgeGood,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suitabilityBadgeText,
                          isOptimal ? styles.suitTextOptimal : styles.suitTextGood,
                        ]}
                      >
                        {isOptimal ? (isHi ? 'अति उत्तम' : 'Optimal') : (isHi ? 'उत्तम' : 'Good')}{' '}
                        {item.score}%
                      </Text>
                    </View>
                  </View>

                  {/* Special Auspicious Yogas Chips */}
                  {item.specialYogas.length > 0 && (
                    <View style={styles.yogasRow}>
                      {item.specialYogas.map((y) => (
                        <View key={y} style={styles.yogaPill}>
                          <Text style={styles.yogaPillText}>✨ {cleanBilingualTitle(y, isHi)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recommended Time Windows (Highlighted Box) */}
                  {item.windows.length > 0 && (
                    <View style={styles.windowsContainer}>
                      <View style={styles.windowHeaderRow}>
                        <Ionicons name="time" size={13} color="#047857" />
                        <Text style={styles.windowLabel}>
                          {isHi ? 'सर्वोत्तम समय खिड़की:' : 'Recommended Time Window:'}
                        </Text>
                      </View>
                      {item.windows.slice(0, 2).map((w, idx) => (
                        <View key={idx} style={styles.windowItem}>
                          <Text style={styles.windowName}>
                            {cleanBilingualTitle(w.label, isHi)}
                          </Text>
                          <Text style={styles.windowTime}>
                            {new Date(w.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(w.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Avoid Windows Warning Callout */}
                  {item.avoidWindows.length > 0 && (
                    <View style={styles.avoidContainer}>
                      <Ionicons name="alert-circle" size={13} color="#b91c1c" />
                      <Text style={styles.avoidLabel}>{isHi ? 'त्याज्य काल:' : 'Avoid:'}</Text>
                      <Text style={styles.avoidText} numberOfLines={1}>
                        {item.avoidWindows
                          .map((a) => cleanBilingualTitle(a.label, isHi))
                          .join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Expand/Collapse Shastric Details */}
                  <TouchableOpacity
                    testID={`expand-toggle-${item.isoDate}`}
                    style={styles.expandToggleRow}
                    onPress={() => toggleExpand(item.isoDate)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandToggleText}>
                      {isExpanded
                        ? isHi ? 'संक्षिप्त करें' : 'Hide astrological breakdown'
                        : isHi ? 'विस्तृत शास्त्रीय विश्लेषण देखें' : 'View astrological breakdown'}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={Palette.primary}
                    />
                  </TouchableOpacity>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsBox}>
                      <Text style={styles.expandedDetailTitle}>
                        {isHi ? 'पञ्चाङ्ग शुद्धि:' : 'Panchang Purity:'}
                      </Text>
                      <Text style={styles.expandedDetailText}>
                        • {isHi ? 'तिथि:' : 'Tithi:'} {item.panchangSummary.tithiName} (
                        {item.panchangSummary.tithiPaksha} Paksha)
                      </Text>
                      <Text style={styles.expandedDetailText}>
                        • {isHi ? 'नक्षत्र:' : 'Nakshatra:'} {item.panchangSummary.nakshatraName}
                      </Text>
                      <Text style={styles.expandedDetailText}>
                        • {isHi ? 'सौर वार:' : 'Weekday:'} {item.panchangSummary.varaName}
                      </Text>
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

  // Category Selector
  categoryContainer: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.xl,
    marginRight: Spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillSelected: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  cityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  helpBtn: {
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDesc: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
    marginBottom: 8,
  },
  scriptureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  scriptureBadgeText: {
    fontSize: 10,
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
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  segmentTextActive: {
    color: '#18181b',
    fontWeight: '700',
  },

  // Results Summary Bar
  resultsSummaryBar: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181b',
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
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  evalDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
  },
  evalLimbSummaryText: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  suitabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 11,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  yogaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },

  // Windows
  windowsContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  windowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  windowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  windowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  windowName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  windowTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },

  // Avoid Container
  avoidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 8,
  },
  avoidLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  avoidText: {
    fontSize: 11,
    color: '#991b1b',
    flex: 1,
  },

  // Expand Toggle
  expandToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primary,
  },
  expandedDetailsBox: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: Radius.sm,
    gap: 3,
  },
  expandedDetailTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  expandedDetailText: {
    fontSize: 11,
    color: '#64748b',
  },

  // Today's Inauspicious Windows Card
  inauspiciousCard: {
    backgroundColor: '#fff7ed',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    marginBottom: 16,
  },
  inauspiciousHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inauspiciousIcon: {
    fontSize: 13,
  },
  inauspiciousTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#9a3412',
  },
  inauspiciousSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#c2410c',
  },
  inauspiciousRow: {
    flexDirection: 'row',
    gap: 6,
  },
  inauspiciousItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  inauspiciousBadgeRed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 2,
  },
  inauspiciousBadgeOrange: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
    marginBottom: 2,
  },
  inauspiciousBadgePurple: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 2,
  },
  inauspiciousTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  inauspiciousDesc: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
});
