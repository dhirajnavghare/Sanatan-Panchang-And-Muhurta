import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VratGuidance } from '../services/vratGuidelines';
import { VratDetailModal } from './VratDetailModal';
import { triggerHaptic } from '../services/sacredAudio';
import { getAppTheme } from '../utils/theme';

interface VratHeroCardProps {
  vrat: VratGuidance | null;
  isHi: boolean;
  hapticsEnabled?: boolean;
}

export const VratHeroCard: React.FC<VratHeroCardProps> = ({
  vrat,
  isHi,
  hapticsEnabled = true,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!vrat) return null;

  const handleOpen = () => {
    triggerHaptic('tap', hapticsEnabled).catch(() => {});
    setIsModalOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        testID="vrat-hero-card"
        accessibilityRole="button"
        accessibilityLabel={`${isHi ? vrat.titleHi : vrat.titleEn}. ${isHi ? 'विधि व नियम खोलें' : 'Open rules and Puja Vidhi'}`}
        style={[
          styles.cardContainer,
          isDark && { backgroundColor: '#251d0e', borderColor: theme.primaryBorder },
        ]}
        onPress={handleOpen}
        activeOpacity={0.88}
      >
        <View style={styles.topRow}>
          <View style={[styles.badgePill, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
            <Text style={[styles.badgeText, isDark && { color: theme.primary }]}>
              {isHi ? vrat.badgeHi : vrat.badgeEn}
            </Text>
          </View>
          <View style={[styles.guideActionPill, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.primaryBorder }]}>
            <Text style={[styles.guideActionText, isDark && { color: theme.primary }]}>
              {isHi ? 'विधि व नियम देखें →' : 'View Rules & Diet →'}
            </Text>
          </View>
        </View>

        <Text style={[styles.titleText, isDark && { color: theme.text }]}>
          {isHi ? vrat.titleHi : vrat.titleEn}
        </Text>

        {/* Dynamic Metric: Moonrise or Parana */}
        {vrat.moonriseTime && (
          <View style={[styles.metricRow, isDark && { backgroundColor: theme.card }]}>
            <Text style={styles.metricEmoji}>🌕</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.metricLabel, isDark && { color: theme.textMuted }]}>
                {isHi ? 'आज का चन्द्रोदय (चन्द्र अर्घ्य)' : "Today's Moonrise (Chandra Arghya)"}
              </Text>
              <Text style={[styles.metricValue, isDark && { color: theme.text }]}>
                {vrat.moonriseTime}{' '}
                {vrat.moonriseCountdown ? `• ${vrat.moonriseCountdown}` : ''}
              </Text>
            </View>
          </View>
        )}

        {vrat.ekadashiParana && !vrat.moonriseTime && (
          <View
            style={[
              styles.metricRowGreen,
              isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder },
            ]}
          >
            <Text style={styles.metricEmoji}>🟢</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.metricLabelGreen, isDark && { color: theme.successText }]}>
                {isHi ? 'द्वादशी पारणा समय' : 'Dwadashi Parana Window'}
              </Text>
              <Text style={[styles.metricValueGreen, isDark && { color: theme.text }]}>
                {vrat.ekadashiParana.startTimeFormatted} — {vrat.ekadashiParana.endTimeFormatted}
              </Text>
            </View>
          </View>
        )}

        {/* Permissible Food Quick Hint */}
        <View style={styles.foodHintRow}>
          <Ionicons name="restaurant-outline" size={16} color={isDark ? theme.primary : '#92400e'} />
          <Text style={[styles.foodHintText, isDark && { color: theme.textSecondary }]}>
            {isHi ? 'ग्राह्य फलाहार: साबूदाना, फल, कुट्टू, दूध, सेंधा नमक' : 'Allowed foods: Fruits, Sabudana, Kuttu, Milk, Sendha Salt'}
          </Text>
        </View>
      </TouchableOpacity>

      <VratDetailModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vrat={vrat}
        isHi={isHi}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fffbeb', // Kesariya cream
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  badgePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  guideActionPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  guideActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400e',
  },
  titleText: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 10,
  },
  metricRowGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 10,
  },
  metricEmoji: {
    fontSize: 22,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9a3412',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#7c2d12',
  },
  metricLabelGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  metricValueGreen: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#14532d',
  },
  foodHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'transparent',
    paddingTop: 2,
  },
  foodHintText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#92400e',
    fontWeight: '600',
  },
});
