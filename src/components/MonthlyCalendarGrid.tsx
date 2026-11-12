import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculatePanchang, GeoLocation, PanchangData } from '@/src/core/panchang';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { Palette, Radius, Spacing } from '@/constants/Colors';

interface MonthlyCalendarGridProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  location: GeoLocation;
  isHi: boolean;
}

interface CalendarDayInfo {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tithiName: string;
  tithiIndex: number;
  isEkadashi: boolean;
  isPurnima: boolean;
  isAmavasya: boolean;
  isPradosh: boolean;
  hasFestival: boolean;
  festivalName?: string;
}

export function MonthlyCalendarGrid({
  currentDate,
  onSelectDate,
  location,
  isHi,
}: MonthlyCalendarGridProps) {
  // Viewing month state (year & month index 0-11)
  const [viewYear, setViewYear] = useState(() => currentDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => currentDate.getMonth());

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesHi = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर',
  ];

  const weekHeadersEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekHeadersHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  const handlePrevMonth = async () => {
    await triggerHaptic('tap');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = async () => {
    await triggerHaptic('tap');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleJumpToday = async () => {
    await triggerHaptic('tap');
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(today);
  };

  // Build grid days for the viewing month
  const gridDays = useMemo(() => {
    const days: CalendarDayInfo[] = [];
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

    const todayStr = new Date().toDateString();
    const selectedStr = currentDate.toDateString();

    // 1. Previous month trailing days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i, 12, 0, 0);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toDateString() === todayStr,
        isSelected: d.toDateString() === selectedStr,
        tithiName: '',
        tithiIndex: 0,
        isEkadashi: false,
        isPurnima: false,
        isAmavasya: false,
        isPradosh: false,
        hasFestival: false,
      });
    }

    // 2. Current month days with calculated sacred attributes
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day, 12, 0, 0);
      const isToday = d.toDateString() === todayStr;
      const isSelected = d.toDateString() === selectedStr;

      try {
        const p = calculatePanchang(d, location);
        const tithi = p.tithi.current;
        const pakshaIdx = tithi.pakshaIndex; // 1 to 15
        const isEkadashi = pakshaIdx === 11;
        const isPurnima = tithi.index === 15;
        const isAmavasya = tithi.index === 30;
        const isPradosh = pakshaIdx === 13;
        const hasFest = p.festivals && p.festivals.length > 0;
        const festName = hasFest ? p.festivals[0].name : undefined;

        days.push({
          date: d,
          dayNumber: day,
          isCurrentMonth: true,
          isToday,
          isSelected,
          tithiName: isHi ? tithi.nameDevanagari : tithi.name,
          tithiIndex: tithi.index,
          isEkadashi,
          isPurnima,
          isAmavasya,
          isPradosh,
          hasFestival: hasFest,
          festivalName: festName,
        });
      } catch {
        days.push({
          date: d,
          dayNumber: day,
          isCurrentMonth: true,
          isToday,
          isSelected,
          tithiName: '',
          tithiIndex: 0,
          isEkadashi: false,
          isPurnima: false,
          isAmavasya: false,
          isPradosh: false,
          hasFestival: false,
        });
      }
    }

    // 3. Next month leading days to complete the 7-column rows
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        const d = new Date(viewYear, viewMonth + 1, i, 12, 0, 0);
        days.push({
          date: d,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: d.toDateString() === todayStr,
          isSelected: d.toDateString() === selectedStr,
          tithiName: '',
          tithiIndex: 0,
          isEkadashi: false,
          isPurnima: false,
          isAmavasya: false,
          isPradosh: false,
          hasFestival: false,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth, currentDate, location, isHi]);

  // Representative Panchang for the 15th of the viewing month to get Vikram Samvat and Lunar Month (Masa)
  const monthHeaderInfo = useMemo(() => {
    try {
      const midMonth = new Date(viewYear, viewMonth, 15, 12, 0, 0);
      const p = calculatePanchang(midMonth, location);
      const samvat = p.samvat.vikramSamvat;
      const masaHi = p.masa.purnimantaNameDevanagari;
      const masaEn = p.masa.purnimantaName;
      return {
        samvat,
        masa: isHi ? masaHi : masaEn,
      };
    } catch {
      return { samvat: 2083, masa: isHi ? 'मार्गशीर्ष' : 'Margashirsha' };
    }
  }, [viewYear, viewMonth, location, isHi]);

  return (
    <View style={styles.container} testID="monthly-calendar-grid">
      {/* Month Navigation & Samvat Bar */}
      <View style={styles.monthHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.samvatSubtitle}>
            {isHi
              ? `विक्रम संवत् ${monthHeaderInfo.samvat} • ${monthHeaderInfo.masa} मास`
              : `Vikram Samvat ${monthHeaderInfo.samvat} • ${monthHeaderInfo.masa}`}
          </Text>
          <Text style={styles.gregorianTitle}>
            {isHi ? monthNamesHi[viewMonth] : monthNamesEn[viewMonth]} {viewYear}
          </Text>
        </View>

        <View style={styles.navControlsGroup}>
          <TouchableOpacity
            testID="month-nav-prev"
            style={styles.navBtn}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#18181b" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="month-nav-today"
            style={styles.todayPill}
            onPress={handleJumpToday}
            activeOpacity={0.7}
          >
            <Text style={styles.todayPillText}>{isHi ? 'आज' : 'Today'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="month-nav-next"
            style={styles.navBtn}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color="#18181b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Header */}
      <View style={styles.weekdayRow}>
        {(isHi ? weekHeadersHi : weekHeadersEn).map((dayName, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                idx === 0 && { color: '#dc2626' }, // Sunday red accent
              ]}
            >
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid Cells */}
      <View style={styles.gridContainer}>
        {gridDays.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <View key={idx} style={styles.cellMuted}>
                <Text style={styles.dayNumMuted}>{cell.dayNumber}</Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={idx}
              testID={`calendar-cell-${cell.dayNumber}`}
              style={[
                styles.cell,
                cell.isSelected && styles.cellSelected,
                cell.isToday && !cell.isSelected && styles.cellToday,
              ]}
              onPress={async () => {
                await triggerHaptic('tap');
                onSelectDate(cell.date);
              }}
              activeOpacity={0.75}
            >
              {/* Day Number */}
              <View style={styles.cellHeader}>
                <Text
                  style={[
                    styles.dayNum,
                    cell.isSelected && styles.dayNumSelected,
                    cell.isToday && !cell.isSelected && styles.dayNumToday,
                  ]}
                >
                  {cell.dayNumber}
                </Text>

                {/* Sacred Badge Icon */}
                {cell.isEkadashi && <Text style={styles.badgeEmoji}>🟢</Text>}
                {cell.isPurnima && <Text style={styles.badgeEmoji}>🌕</Text>}
                {cell.isAmavasya && <Text style={styles.badgeEmoji}>🌑</Text>}
                {cell.isPradosh && !cell.isEkadashi && <Text style={styles.badgeEmoji}>🔱</Text>}
                {cell.hasFestival && !cell.isEkadashi && !cell.isPurnima && !cell.isAmavasya && (
                  <Text style={styles.badgeEmoji}>🚩</Text>
                )}
              </View>

              {/* Short Tithi Name */}
              <Text
                style={[
                  styles.tithiText,
                  cell.isSelected && styles.tithiTextSelected,
                  (cell.isEkadashi || cell.isPurnima) && styles.tithiHighlight,
                ]}
                numberOfLines={1}
              >
                {cell.tithiName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sacred Calendar Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🟢</Text>
          <Text style={styles.legendLabel}>{isHi ? 'एकादशी' : 'Ekadashi'}</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🌕</Text>
          <Text style={styles.legendLabel}>{isHi ? 'पूर्णिमा' : 'Purnima'}</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🌑</Text>
          <Text style={styles.legendLabel}>{isHi ? 'अमावस्या' : 'Amavasya'}</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🔱</Text>
          <Text style={styles.legendLabel}>{isHi ? 'प्रदोष' : 'Pradosh'}</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🚩</Text>
          <Text style={styles.legendLabel}>{isHi ? 'पर्व/त्योहार' : 'Festival'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#f1f1f4',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  samvatSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    letterSpacing: 0.2,
  },
  gregorianTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  navControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1.05,
    padding: 3,
    borderRadius: 8,
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  cellMuted: {
    width: '14.28%',
    aspectRatio: 1.05,
    padding: 3,
    justifyContent: 'flex-start',
    opacity: 0.25,
  },
  cellSelected: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
  },
  cellToday: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181b',
  },
  dayNumMuted: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  dayNumSelected: {
    color: '#b45309',
    fontWeight: '800',
  },
  dayNumToday: {
    color: '#15803d',
    fontWeight: '800',
  },
  badgeEmoji: {
    fontSize: 9,
  },
  tithiText: {
    fontSize: 8.5,
    color: '#71717a',
    marginTop: 1,
  },
  tithiTextSelected: {
    color: '#92400e',
    fontWeight: '700',
  },
  tithiHighlight: {
    color: '#b45309',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendEmoji: {
    fontSize: 10,
  },
  legendLabel: {
    fontSize: 10,
    color: '#52525b',
    fontWeight: '600',
  },
});
