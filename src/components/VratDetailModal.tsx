import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VratGuidance } from '../services/vratGuidelines';

interface VratDetailModalProps {
  visible: boolean;
  onClose: () => void;
  vrat: VratGuidance | null;
  isHi: boolean;
}

export const VratDetailModal: React.FC<VratDetailModalProps> = ({
  visible,
  onClose,
  vrat,
  isHi,
}) => {
  if (!vrat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <View style={styles.badgeRow}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{isHi ? vrat.badgeHi : vrat.badgeEn}</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>{isHi ? vrat.titleHi : vrat.titleEn}</Text>
              <Text style={styles.deitySubtitle}>
                {isHi ? `आराध्य: ${vrat.deityHi}` : `Deity: ${vrat.deityEn}`}
              </Text>
            </View>

            <TouchableOpacity
              testID="vrat-modal-close-btn"
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#78350f" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Significance Card */}
            <View style={styles.significanceBox}>
              <Text style={styles.significanceTitle}>
                {isHi ? '📜 शास्त्रीय माहात्म्य' : '📜 Shastric Significance'}
              </Text>
              <Text style={styles.significanceText}>
                {isHi ? vrat.significanceHi : vrat.significanceEn}
              </Text>
            </View>

            {/* Special Moonrise Card for Sankashti */}
            {vrat.moonriseTime && (
              <View style={styles.moonriseCard}>
                <View style={styles.moonriseTopRow}>
                  <View style={styles.moonriseIconGroup}>
                    <Text style={styles.moonEmoji}>🌕</Text>
                    <View style={{ backgroundColor: 'transparent' }}>
                      <Text style={styles.moonriseLabel}>
                        {isHi ? 'आज का चन्द्रोदय समय' : "Today's Moonrise"}
                      </Text>
                      <Text style={styles.moonriseTimeVal}>{vrat.moonriseTime}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.moonStatusPill,
                      vrat.hasMoonRisen && styles.moonStatusPillDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.moonStatusText,
                        vrat.hasMoonRisen && styles.moonStatusTextDone,
                      ]}
                    >
                      {vrat.hasMoonRisen
                        ? (isHi ? '✓ उदित' : '✓ Risen')
                        : (isHi ? 'प्रतीक्षित' : 'Awaiting')}
                    </Text>
                  </View>
                </View>

                {vrat.moonriseCountdown && (
                  <View style={styles.countdownRow}>
                    <Text style={styles.countdownText}>
                      ⏳ {vrat.moonriseCountdown}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Ekadashi Parana Card */}
            {vrat.ekadashiParana && (
              <View style={styles.paranaCard}>
                <View style={styles.paranaHeaderRow}>
                  <Text style={styles.paranaIcon}>🟢</Text>
                  <Text style={styles.paranaTitle}>
                    {isHi ? 'द्वादशी पारणा समय (व्रत तोड़ने की अवधि)' : 'Dwadashi Parana Fast-Breaking Window'}
                  </Text>
                </View>
                <Text style={styles.paranaTimeWindow}>
                  {vrat.ekadashiParana.startTimeFormatted} — {vrat.ekadashiParana.endTimeFormatted}
                </Text>
                <Text style={styles.paranaGuidance}>
                  {isHi ? vrat.ekadashiParana.guidanceHi : vrat.ekadashiParana.guidanceEn}
                </Text>
              </View>
            )}

            {/* Arghya Mantra */}
            {vrat.arghyaMantraSanskrit && (
              <View style={styles.mantraBox}>
                <View style={styles.mantraHeaderRow}>
                  <Text style={styles.mantraSectionTitle}>
                    {isHi ? '🕉️ पवित्र अर्घ्य मन्त्र' : '🕉️ Sacred Arghya Mantra'}
                  </Text>
                </View>
                <Text style={styles.sanskritMantraText}>
                  {vrat.arghyaMantraSanskrit}
                </Text>
                <Text style={styles.mantraMeaning}>
                  {isHi ? vrat.arghyaMantraMeaningHi : vrat.arghyaMantraMeaningEn}
                </Text>
              </View>
            )}

            {/* Step-by-Step Vidhi */}
            {vrat.arghyaVidhiHi && vrat.arghyaVidhiHi.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {isHi ? '🪔 पूजन एवं अर्घ्य विधि' : '🪔 Step-by-Step Puja & Arghya'}
                </Text>
                {(isHi ? vrat.arghyaVidhiHi : vrat.arghyaVidhiEn || []).map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepDesc}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dietary Rules (ग्राह्य फलाहार vs वर्जित अन्न) */}
            <View style={styles.dietaryCard}>
              <Text style={styles.sectionTitle}>
                {isHi ? '🥗 व्रत आहार नियम (फलाहार विधान)' : '🥗 Fasting Dietary Discipline'}
              </Text>

              {/* Permissible Foods */}
              <View style={styles.permissibleGroup}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={styles.dietaryIconGood}>✓</Text>
                  <Text style={styles.dietaryGroupTitleGood}>
                    {isHi ? 'ग्राह्य फलाहार (खा सकते हैं)' : 'Permissible Foods (Allowed)'}
                  </Text>
                </View>
                <View style={styles.chipsContainer}>
                  {(isHi ? vrat.permissibleFoodsHi : vrat.permissibleFoodsEn).map((item, idx) => (
                    <View key={idx} style={styles.chipGood}>
                      <Text style={styles.chipGoodText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Prohibited Foods */}
              <View style={styles.prohibitedGroup}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={styles.dietaryIconBad}>✕</Text>
                  <Text style={styles.dietaryGroupTitleBad}>
                    {isHi ? 'वर्जित अन्न (सर्वथा त्याज्य)' : 'Strictly Prohibited (Avoid)'}
                  </Text>
                </View>
                <View style={styles.chipsContainer}>
                  {(isHi ? vrat.prohibitedFoodsHi : vrat.prohibitedFoodsEn).map((item, idx) => (
                    <View key={idx} style={styles.chipBad}>
                      <Text style={styles.chipBadText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fasting Rules */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {isHi ? '🚩 व्रत के प्रमुख नियम' : '🚩 Core Fasting Rules'}
              </Text>
              {(isHi ? vrat.fastingRulesHi : vrat.fastingRulesEn).map((rule, idx) => (
                <View key={idx} style={styles.ruleBulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fffbeb', // Warm Kesariya Ivory
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    backgroundColor: 'transparent',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78350f',
  },
  deitySubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollBody: {
    paddingTop: 12,
  },
  significanceBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  significanceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  significanceText: {
    fontSize: 12.5,
    color: '#451a03',
    lineHeight: 18,
  },
  moonriseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  moonriseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moonriseIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  moonEmoji: {
    fontSize: 28,
  },
  moonriseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  moonriseTimeVal: {
    fontSize: 19,
    fontWeight: '900',
    color: '#78350f',
  },
  moonStatusPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  moonStatusPillDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  moonStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#b45309',
  },
  moonStatusTextDone: {
    color: '#15803d',
  },
  countdownRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
    backgroundColor: 'transparent',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  paranaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  paranaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  paranaIcon: {
    fontSize: 14,
  },
  paranaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  paranaTimeWindow: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
    marginBottom: 4,
  },
  paranaGuidance: {
    fontSize: 11.5,
    color: '#065f46',
    lineHeight: 16,
  },
  mantraBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  mantraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  mantraSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#c2410c',
  },
  sanskritMantraText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#7c2d12',
    lineHeight: 22,
    fontFamily: 'serif',
    marginBottom: 6,
  },
  mantraMeaning: {
    fontSize: 11.5,
    color: '#9a3412',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  stepDesc: {
    flex: 1,
    fontSize: 12,
    color: '#451a03',
    lineHeight: 17,
  },
  dietaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  permissibleGroup: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  prohibitedGroup: {
    backgroundColor: 'transparent',
  },
  dietaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  dietaryIconGood: {
    fontSize: 13,
    fontWeight: '900',
    color: '#16a34a',
  },
  dietaryGroupTitleGood: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803d',
  },
  dietaryIconBad: {
    fontSize: 13,
    fontWeight: '900',
    color: '#dc2626',
  },
  dietaryGroupTitleBad: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b91c1c',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  chipGood: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  chipGoodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  chipBad: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  chipBadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
  },
  ruleBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '900',
    color: '#b45309',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: '#451a03',
    lineHeight: 17,
  },
});
