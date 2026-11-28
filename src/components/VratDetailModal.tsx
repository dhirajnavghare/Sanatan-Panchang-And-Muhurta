import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VratGuidance } from '../services/vratGuidelines';
import { getAppTheme, MIN_TOUCH_TARGET, Typography } from '../utils/theme';
import { AppButton } from './ui/AppButton';

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
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const insets = useSafeAreaInsets();

  if (!vrat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 },
            { paddingBottom: Math.max(24, insets.bottom + 12) },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.modalHeader, isDark && { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1, backgroundColor: 'transparent', paddingRight: 8 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.badgePill, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
                  <Text style={[styles.badgeText, isDark && { color: theme.primary }]}>
                    {isHi ? vrat.badgeHi : vrat.badgeEn}
                  </Text>
                </View>
              </View>
              <Text style={[styles.headerTitle, isDark && { color: theme.text }]}>
                {isHi ? vrat.titleHi : vrat.titleEn}
              </Text>
              <Text style={[styles.deitySubtitle, isDark && { color: theme.textSecondary }]}>
                {isHi ? `आराध्य: ${vrat.deityHi}` : `Deity: ${vrat.deityEn}`}
              </Text>
            </View>

            <TouchableOpacity
              testID="vrat-modal-close-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'व्रत विवरण बंद करें' : 'Close Vrat details'}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={[styles.closeBtn, isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Ionicons name="close" size={22} color={isDark ? theme.textSecondary : '#78350f'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Significance Card */}
            <View style={[styles.significanceBox, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.significanceTitle, isDark && { color: theme.primary }]}>
                {isHi ? '📜 शास्त्रीय माहात्म्य' : '📜 Why This Fast Matters'}
              </Text>
              <Text style={[styles.significanceText, isDark && { color: theme.textSecondary }]}>
                {isHi ? vrat.significanceHi : vrat.significanceEn}
              </Text>
            </View>

            {/* Special Moonrise Card for Sankashti */}
            {vrat.moonriseTime && (
              <View style={[styles.moonriseCard, isDark && { backgroundColor: theme.card, borderColor: theme.primary }]}>
                <View style={styles.moonriseTopRow}>
                  <View style={styles.moonriseIconGroup}>
                    <Text style={styles.moonEmoji}>🌕</Text>
                    <View style={{ backgroundColor: 'transparent', flex: 1 }}>
                      <Text style={[styles.moonriseLabel, isDark && { color: theme.primary }]}>
                        {isHi ? 'आज का चन्द्रोदय समय' : "Today's Moonrise"}
                      </Text>
                      <Text style={[styles.moonriseTimeVal, isDark && { color: theme.text }]}>{vrat.moonriseTime}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.moonStatusPill,
                      isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                      vrat.hasMoonRisen && [styles.moonStatusPillDone, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.moonStatusText,
                        isDark && { color: theme.primary },
                        vrat.hasMoonRisen && [styles.moonStatusTextDone, isDark && { color: theme.successText }],
                      ]}
                    >
                      {vrat.hasMoonRisen
                        ? (isHi ? '✓ उदित' : '✓ Risen')
                        : (isHi ? '⏳ प्रतीक्षित' : '⏳ Awaiting')}
                    </Text>
                  </View>
                </View>

                {vrat.moonriseCountdown && (
                  <View style={[styles.countdownRow, isDark && { borderTopColor: theme.border }]}>
                    <Text style={[styles.countdownText, isDark && { color: theme.primary }]}>
                      ⏳ {vrat.moonriseCountdown}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Ekadashi Parana Card */}
            {vrat.ekadashiParana && (
              <View style={[styles.paranaCard, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }]}>
                <View style={styles.paranaHeaderRow}>
                  <Text style={styles.paranaIcon}>🟢</Text>
                  <Text style={[styles.paranaTitle, isDark && { color: theme.successText }]}>
                    {isHi ? 'द्वादशी पारणा समय (व्रत खोलने की अवधि)' : 'Fast-Breaking Window (Parana)'}
                  </Text>
                </View>
                <Text style={[styles.paranaTimeWindow, isDark && { color: theme.text }]}>
                  {vrat.ekadashiParana.startTimeFormatted} — {vrat.ekadashiParana.endTimeFormatted}
                </Text>
                <Text style={[styles.paranaGuidance, isDark && { color: theme.textSecondary }]}>
                  {isHi ? vrat.ekadashiParana.guidanceHi : vrat.ekadashiParana.guidanceEn}
                </Text>
              </View>
            )}

            {/* Arghya Mantra */}
            {vrat.arghyaMantraSanskrit && (
              <View style={[styles.mantraBox, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
                <View style={styles.mantraHeaderRow}>
                  <Text style={[styles.mantraSectionTitle, isDark && { color: theme.primary }]}>
                    {isHi ? '🕉️ पवित्र अर्घ्य मन्त्र' : '🕉️ Sacred Prayer Mantra'}
                  </Text>
                </View>
                <Text style={[styles.sanskritMantraText, isDark && { color: theme.text }]}>
                  {vrat.arghyaMantraSanskrit}
                </Text>
                {(vrat.arghyaMantraMeaningHi || vrat.arghyaMantraMeaningEn) ? (
                  <Text style={[styles.mantraMeaning, isDark && { color: theme.textSecondary }]}>
                    {isHi ? vrat.arghyaMantraMeaningHi : vrat.arghyaMantraMeaningEn}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Step-by-Step Vidhi */}
            {vrat.arghyaVidhiHi && vrat.arghyaVidhiHi.length > 0 && (
              <View style={[styles.sectionCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
                  {isHi ? '🪔 पूजन एवं अर्घ्य विधि' : '🪔 Step-by-Step Puja Guide'}
                </Text>
                {(isHi ? vrat.arghyaVidhiHi : vrat.arghyaVidhiEn || []).map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={[styles.stepNumberBadge, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
                      <Text style={[styles.stepNumberText, isDark && { color: theme.primary }]}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.stepDesc, isDark && { color: theme.textSecondary }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dietary Rules */}
            <View style={[styles.dietaryCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
                {isHi ? '🥗 व्रत आहार नियम (क्या खाएं / क्या न खाएं)' : '🥗 Fasting Food Guide'}
              </Text>

              {/* Permissible Foods */}
              <View style={styles.permissibleGroup}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={[styles.dietaryIconGood, isDark && { color: theme.successText }]}>✓</Text>
                  <Text style={[styles.dietaryGroupTitleGood, isDark && { color: theme.successText }]}>
                    {isHi ? 'ग्राह्य फलाहार (खा सकते हैं)' : 'Allowed Foods (You Can Eat)'}
                  </Text>
                </View>
                <View style={styles.chipsContainer}>
                  {(isHi ? vrat.permissibleFoodsHi : vrat.permissibleFoodsEn).map((item, idx) => (
                    <View key={idx} style={[styles.chipGood, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }]}>
                      <Text style={[styles.chipGoodText, isDark && { color: theme.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Prohibited Foods */}
              <View style={styles.prohibitedGroup}>
                <View style={styles.dietaryHeaderRow}>
                  <Text style={[styles.dietaryIconBad, isDark && { color: theme.dangerText }]}>✕</Text>
                  <Text style={[styles.dietaryGroupTitleBad, isDark && { color: theme.dangerText }]}>
                    {isHi ? 'वर्जित अन्न (कृपया न खाएं)' : 'Foods to Avoid'}
                  </Text>
                </View>
                <View style={styles.chipsContainer}>
                  {(isHi ? vrat.prohibitedFoodsHi : vrat.prohibitedFoodsEn).map((item, idx) => (
                    <View key={idx} style={[styles.chipBad, isDark && { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder }]}>
                      <Text style={[styles.chipBadText, isDark && { color: theme.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fasting Rules */}
            <View style={[styles.sectionCard, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, isDark && { color: theme.text }]}>
                {isHi ? '🚩 व्रत के प्रमुख नियम' : '🚩 Simple Fasting Rules'}
              </Text>
              {(isHi ? vrat.fastingRulesHi : vrat.fastingRulesEn).map((rule, idx) => (
                <View key={idx} style={styles.ruleBulletRow}>
                  <Text style={[styles.bulletDot, isDark && { color: theme.primary }]}>•</Text>
                  <Text style={[styles.ruleText, isDark && { color: theme.textSecondary }]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 12 }} />
          </ScrollView>

          <View style={styles.footerWrap}>
            <AppButton
              testID="vrat-modal-done-btn"
              variant="primary"
              label={isHi ? 'बन्द करें' : 'Close'}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fffbeb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 18,
    paddingHorizontal: 18,
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
    marginBottom: 6,
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
  headerTitle: {
    ...Typography.screenTitle,
    color: '#78350f',
  },
  deitySubtitle: {
    ...Typography.bodyMuted,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 3,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollBody: {
    paddingTop: 14,
  },
  significanceBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  significanceTitle: {
    ...Typography.cardTitle,
    color: '#92400e',
    marginBottom: 6,
  },
  significanceText: {
    ...Typography.body,
    color: '#451a03',
  },
  moonriseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  moonriseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  moonriseIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  moonEmoji: {
    fontSize: 30,
  },
  moonriseLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  moonriseTimeVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#78350f',
  },
  moonStatusPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  moonStatusPillDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  moonStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  moonStatusTextDone: {
    color: '#15803d',
  },
  countdownRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
    backgroundColor: 'transparent',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  paranaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  paranaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  paranaIcon: {
    fontSize: 16,
  },
  paranaTitle: {
    ...Typography.cardTitle,
    color: '#065f46',
    flex: 1,
  },
  paranaTimeWindow: {
    fontSize: 19,
    fontWeight: '900',
    color: '#047857',
    marginBottom: 6,
  },
  paranaGuidance: {
    ...Typography.bodyMuted,
    color: '#065f46',
  },
  mantraBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
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
    ...Typography.label,
    fontSize: 14,
    color: '#c2410c',
  },
  sanskritMantraText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c2d12',
    lineHeight: 24,
    fontFamily: 'serif',
    marginBottom: 6,
  },
  mantraMeaning: {
    ...Typography.bodyMuted,
    color: '#9a3412',
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  sectionTitle: {
    ...Typography.cardTitle,
    color: '#78350f',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  stepDesc: {
    flex: 1,
    ...Typography.bodyMuted,
    color: '#451a03',
  },
  dietaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  permissibleGroup: {
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  prohibitedGroup: {
    backgroundColor: 'transparent',
  },
  dietaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  dietaryIconGood: {
    fontSize: 15,
    fontWeight: '900',
    color: '#16a34a',
  },
  dietaryGroupTitleGood: {
    ...Typography.label,
    fontSize: 14,
    color: '#15803d',
  },
  dietaryIconBad: {
    fontSize: 15,
    fontWeight: '900',
    color: '#dc2626',
  },
  dietaryGroupTitleBad: {
    ...Typography.label,
    fontSize: 14,
    color: '#b91c1c',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  chipGood: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  chipGoodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  chipBad: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  chipBadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
  },
  ruleBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  bulletDot: {
    fontSize: 16,
    fontWeight: '900',
    color: '#b45309',
  },
  ruleText: {
    flex: 1,
    ...Typography.bodyMuted,
    color: '#451a03',
  },
  footerWrap: {
    paddingTop: 10,
  },
});
