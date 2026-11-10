import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { getFestivalTimeline } from '@/src/core/festivals/timeline';
import { FestivalCategory, FestivalTimelineItem } from '@/src/core/festivals/types';
import { PRESET_CITIES } from '@/src/core/panchang';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle, cleanPujaMuhurta } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function FestivalsScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FestivalCategory>('all');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleYearSelect = (y: number) => {
    if (y === year) return;
    setIsCalculating(true);
    setTimeout(() => {
      setYear(y);
      setIsCalculating(false);
    }, 120);
  };

  const handleCategorySelect = (c: FestivalCategory) => {
    if (c === selectedCategory) return;
    setIsCalculating(true);
    setTimeout(() => {
      setSelectedCategory(c);
      setIsCalculating(false);
    }, 120);
  };

  // 100% On-Device Offline Calculation (< 5ms)
  const timeline = useMemo(() => {
    return getFestivalTimeline(
      { year, category: selectedCategory, searchQuery },
      PRESET_CITIES[0]
    );
  }, [year, selectedCategory, searchQuery]);

  const categories: { id: FestivalCategory; labelEn: string; labelHi: string }[] = [
    { id: 'all', labelEn: 'All', labelHi: 'सभी' },
    { id: 'major', labelEn: 'Major Festivals', labelHi: 'प्रमुख पर्व' },
    { id: 'vrat', labelEn: 'Ekadashi Vrats', labelHi: 'एकादशी व्रत' },
    { id: 'jayanti', labelEn: 'Jayantis', labelHi: 'जयन्तियां' },
    { id: 'sankranti', labelEn: 'Sankranti', labelHi: 'संक्रान्ति' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Year & Search Bar */}
      <View style={styles.topControls}>
        <View style={styles.yearRow}>
          {[2025, 2026, 2027].map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearBtn, year === y && styles.yearBtnActive]}
              onPress={() => handleYearSelect(y)}
            >
              <Text style={[styles.yearText, year === y && styles.yearTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#a1a1aa" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isHi ? 'पर्व, व्रत अथवा देवता खोजें...' : 'Search festivals, fasts, deities...'
            }
            placeholderTextColor="#a1a1aa"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#a1a1aa" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryChips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleCategorySelect(c.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {isHi ? c.labelHi : c.labelEn}
                </Text>
              </TouchableOpacity>
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
          {/* Summary */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              {isHi
                ? `वर्ष ${year} में कुल ${timeline.totalCount} पर्व एवं व्रत (${timeline.festivals.length} प्रदर्शित)`
                : `Total ${timeline.totalCount} events in ${year} (${timeline.festivals.length} listed)`}
            </Text>
          </View>

          {/* Timeline List */}
      {timeline.festivals.map((f: FestivalTimelineItem) => {
        const isToday = f.timeStatus === 'today';
        const isTomorrow = f.daysRemaining === 1;

        return (
          <View key={f.id} style={[styles.festCard, isToday && styles.festCardToday]}>
            <View style={styles.festHeader}>
              <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                <Text style={styles.festDate}>
                  📅 {isHi ? (f.formattedDateDevanagari || f.formattedDate) : f.formattedDate}
                </Text>
                <Text style={styles.festMasa}>
                  {isHi
                    ? `${f.masaNameDevanagari || f.masaName} • ${f.paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'} ${f.tithiNameDevanagari || f.tithiName}`
                    : `${f.masaName} • ${f.paksha} ${f.tithiName}`}
                </Text>
              </View>

              {f.daysRemaining >= 0 && (
                <View
                  style={[
                    styles.countdownBadge,
                    isToday ? styles.badgeToday : styles.badgeUpcoming,
                  ]}
                >
                  <Text style={styles.countdownText}>
                    {isToday
                      ? (isHi ? 'आज' : 'Today')
                      : isTomorrow
                      ? (isHi ? 'कल' : 'Tomorrow')
                      : (isHi ? `${f.daysRemaining} दिन शेष` : `In ${f.daysRemaining} days`)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.festName}>
              {isHi ? f.nameDevanagari : f.name}
            </Text>

            {f.pujaMuhurta && (
              <View style={styles.pujaBox}>
                <Ionicons name="time" size={14} color="#d97706" />
                <Text style={styles.pujaText}>
                  {isHi ? 'पूजा मुहूर्त:' : 'Puja Muhurta:'}{' '}
                  {cleanPujaMuhurta(f.pujaMuhurta, isHi)}
                </Text>
              </View>
            )}

            <Text style={styles.festSignificance} numberOfLines={2}>
              {f.significance}
            </Text>

            {f.deity && (
              <View style={styles.deityPill}>
                <Text style={styles.deityText}>
                  🙏 {isHi ? 'आराध्य:' : 'Deity:'} {cleanBilingualTitle(f.deity, isHi)}
                </Text>
              </View>
            )}
          </View>
        );
      })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  topControls: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  yearRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    padding: 3,
    marginBottom: 10,
  },
  yearBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  yearBtnActive: {
    backgroundColor: '#d97706',
  },
  yearText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#71717a',
  },
  yearTextActive: {
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181b',
  },
  categoryChips: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  chip: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#d97706',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  summaryBar: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  summaryText: {
    fontSize: 11,
    color: '#71717a',
  },
  festCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  festCardToday: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  festHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  festDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
  },
  festMasa: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeToday: {
    backgroundColor: '#10b981',
  },
  badgeUpcoming: {
    backgroundColor: '#e0e7ff',
  },
  countdownText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  festName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 6,
  },
  pujaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 6,
  },
  pujaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    flex: 1,
  },
  festSignificance: {
    fontSize: 12,
    color: '#52525b',
    lineHeight: 18,
    marginBottom: 8,
  },
  deityPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deityText: {
    fontSize: 11,
    color: '#52525b',
  },
});
