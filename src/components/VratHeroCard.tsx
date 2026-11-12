import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VratGuidance } from '../services/vratGuidelines';
import { VratDetailModal } from './VratDetailModal';
import { triggerHaptic } from '../services/sacredAudio';

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
        style={styles.cardContainer}
        onPress={handleOpen}
        activeOpacity={0.88}
      >
        <View style={styles.topRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{isHi ? vrat.badgeHi : vrat.badgeEn}</Text>
          </View>
          <View style={styles.guideActionPill}>
            <Text style={styles.guideActionText}>
              {isHi ? 'विधि व आहार नियम →' : 'Vidhi & Diet →'}
            </Text>
          </View>
        </View>

        <Text style={styles.titleText}>{isHi ? vrat.titleHi : vrat.titleEn}</Text>

        {/* Dynamic Metric: Moonrise or Parana */}
        {vrat.moonriseTime && (
          <View style={styles.metricRow}>
            <Text style={styles.metricEmoji}>🌕</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.metricLabel}>
                {isHi ? 'आज का चन्द्रोदय (चन्द्र अर्घ्य)' : "Today's Moonrise (Chandra Arghya)"}
              </Text>
              <Text style={styles.metricValue}>
                {vrat.moonriseTime}{' '}
                {vrat.moonriseCountdown ? `• ${vrat.moonriseCountdown}` : ''}
              </Text>
            </View>
          </View>
        )}

        {vrat.ekadashiParana && !vrat.moonriseTime && (
          <View style={styles.metricRowGreen}>
            <Text style={styles.metricEmoji}>🟢</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.metricLabelGreen}>
                {isHi ? 'द्वादशी पारणा समय' : 'Dwadashi Parana Window'}
              </Text>
              <Text style={styles.metricValueGreen}>
                {vrat.ekadashiParana.startTimeFormatted} — {vrat.ekadashiParana.endTimeFormatted}
              </Text>
            </View>
          </View>
        )}

        {/* Permissible Food Quick Hint */}
        <View style={styles.foodHintRow}>
          <Ionicons name="restaurant-outline" size={13} color="#92400e" />
          <Text style={styles.foodHintText} numberOfLines={1}>
            {isHi ? 'ग्राह्य फलाहार: साबूदाना, फल, कुट्टू, दूध, सेंधा नमक' : 'Allowed: Fruits, Sabudana, Kuttu, Milk, Sendha Salt'}
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
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  badgePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  guideActionPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  guideActionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400e',
  },
  titleText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 8,
  },
  metricRowGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 8,
  },
  metricEmoji: {
    fontSize: 20,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9a3412',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7c2d12',
  },
  metricLabelGreen: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  metricValueGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532d',
  },
  foodHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingTop: 2,
  },
  foodHintText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400e',
    fontWeight: '500',
  },
});
