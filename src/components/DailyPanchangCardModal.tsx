import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  ActivityIndicator,
  NativeModules,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PanchangData } from '@/src/core/panchang/types';
import { DailyDevataInfo, ShastricVerse } from '@/src/services/dinacharya';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET, Typography } from '@/src/utils/theme';
import { AppButton } from './ui/AppButton';

interface DailyPanchangCardModalProps {
  visible: boolean;
  onClose: () => void;
  panchang: PanchangData;
  cityName: string;
  devataInfo: DailyDevataInfo;
  verse: ShastricVerse;
  userName?: string;
  timezone?: string;
}

export function DailyPanchangCardModal({
  visible,
  onClose,
  panchang,
  cityName,
  devataInfo,
  verse,
  userName,
  timezone = 'Asia/Kolkata',
}: DailyPanchangCardModalProps) {
  const cardRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const insets = useSafeAreaInsets();

  const formatTime = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(date);
    } catch {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleShareCard = async () => {
    await triggerHaptic('tap');
    setIsSharing(true);
    try {
      const sunrise = formatTime(panchang.sunTimes.sunrise);
      const moonrise = panchang.moonTimes.moonrise
        ? formatTime(panchang.moonTimes.moonrise)
        : 'दिन में';
      const senderText = userName ? `\n🙏 प्रेषक: ${userName}` : '';

      const text = `॥ ॐ श्री गणेशाय नमः ॥\n\n🌅 *आज का पञ्चाङ्ग एवं सुविचार*\n📍 स्थान: ${cityName}\n📅 तिथि: ${panchang.tithi.current.pakshaDevanagari} ${panchang.tithi.current.nameDevanagari}\n⭐ नक्षत्र: ${panchang.nakshatra.current.nameDevanagari}\n🧘 योग: ${panchang.yoga.current.nameDevanagari}\n\n🌅 *सूर्योदय:* ${sunrise} | 🌙 *चन्द्रोदय:* ${moonrise}\n🚩 *आज के वार अधिष्ठाता:* ${devataInfo.deityNameHi}\n✨ *मन्त्र:* ${devataInfo.mantraDevanagari}\n\n🌟 *अभिजित मुहूर्त:* ${panchang.muhurtas.abhijitMuhurta ? `${formatTime(panchang.muhurtas.abhijitMuhurta.startTime)} - ${formatTime(panchang.muhurtas.abhijitMuhurta.endTime)}` : 'आज वर्जित'}\n⚠️ *राहु काल:* ${formatTime(panchang.muhurtas.rahuKaal.startTime)} - ${formatTime(panchang.muhurtas.rahuKaal.endTime)}\n\n📖 *आज का श्लोक:*\n${verse.shloka}\n\n[अर्थ]: ${verse.meaningHi}${senderText}\n\n📲 *सनातन ऍप डाउनलोड करें (Google Play):*\nhttps://play.google.com/store/apps/details?id=cc.sanatan.app\n🌐 https://sanatan.cc\n\n— सनातन पञ्चाङ्ग: हर सनातनी का प्रामाणिक दैनिक साथी`;

      if (Platform.OS !== 'web' && cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        // 1. Android Native custom share (sends Image + Text caption with URL in a single click)
        if (Platform.OS === 'android' && NativeModules.SanatanShare?.shareImageWithText) {
          try {
            await NativeModules.SanatanShare.shareImageWithText(
              uri,
              text,
              'आज का पञ्चाङ्ग WhatsApp पर शेयर करें'
            );
            setIsSharing(false);
            return;
          } catch {
            // fallback
          }
        }

        // 2. iOS Native Share (sends Image file URL + Message text with URL in a single click)
        if (Platform.OS === 'ios') {
          try {
            await Share.share({
              url: uri,
              message: text,
              title: 'आज का पञ्चाङ्ग',
            });
            setIsSharing(false);
            return;
          } catch {
            // fallback
          }
        }

        // 3. Fallback: Share Image via Expo Sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'आज का पञ्चाङ्ग WhatsApp पर शेयर करें',
          });
          setIsSharing(false);
          return;
        }
      }

      // Web or fallback: Share formatted text with URLs
      await Share.share({ message: text });
    } catch {
      // ignore
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetContainer,
            isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 },
            { paddingBottom: Math.max(20, insets.bottom + 12) },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.modalHeader, isDark && { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, isDark && { color: theme.text }]}>
                दैनिक पञ्चाङ्ग शेयर कार्ड
              </Text>
              <Text style={[styles.modalSubtitle, isDark && { color: theme.textMuted }]}>
                WhatsApp स्टेटस व परिवार ग्रुप्स के लिए
              </Text>
            </View>
            <TouchableOpacity
              testID="share-card-close-btn"
              accessibilityRole="button"
              accessibilityLabel="बंद करें"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClose}
              style={[styles.closeBtn, isDark && { backgroundColor: theme.cardMuted }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={isDark ? theme.textSecondary : '#71717a'} />
            </TouchableOpacity>
          </View>

          {/* Action Button: Fixed at the TOP right below header */}
          <View style={[styles.topActionContainer, isDark && { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              testID="share-card-btn"
              accessibilityRole="button"
              accessibilityLabel="WhatsApp पर कार्ड शेयर करें"
              style={[styles.shareBtnPrimary, { minHeight: COMFORT_TOUCH_TARGET }]}
              onPress={handleShareCard}
              activeOpacity={0.8}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={22} color="#ffffff" />
                  <Text style={styles.shareBtnPrimaryText}>WhatsApp पर कार्ड शेयर करें</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* The Captureable Visual Card */}
            <View ref={cardRef} collapsable={false} style={styles.captureCard}>
              {/* Sacred Corner Ornaments */}
              <View style={styles.cardBorderFrame}>
                {/* Card Top Branding */}
                <View style={styles.cardTopHeader}>
                  <Text style={styles.omBadge}>॥ ॐ श्री गणेशाय नमः ॥</Text>
                  <Text style={styles.cardSuprabhat}>शुभ प्रभात • आज का पञ्चाङ्ग</Text>
                  <Text style={styles.cardCityText}>
                    📍 {cityName} • {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>

                {/* Deity of the Day Banner */}
                <View style={styles.deityBanner}>
                  <Text style={styles.deityIcon}>🚩</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deityBannerTitle}>आज के वार अधिष्ठाता</Text>
                    <Text style={styles.deityBannerName}>{devataInfo.deityNameHi}</Text>
                    <Text style={styles.deityMantra}>{devataInfo.mantraDevanagari}</Text>
                  </View>
                </View>

                {/* Panchang Grid */}
                <View style={styles.panchangGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>तिथि</Text>
                    <Text style={styles.gridValue}>
                      {panchang.tithi.current.pakshaDevanagari} {panchang.tithi.current.nameDevanagari}
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>नक्षत्र</Text>
                    <Text style={styles.gridValue}>{panchang.nakshatra.current.nameDevanagari}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>योग</Text>
                    <Text style={styles.gridValue}>{panchang.yoga.current.nameDevanagari}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>करण</Text>
                    <Text style={styles.gridValue}>{panchang.karana.current.nameDevanagari}</Text>
                  </View>
                </View>

                {/* Muhurta Highlight Bar */}
                <View style={styles.muhurtaBar}>
                  <View style={styles.muhurtaBadgeShubh}>
                    <Text style={styles.muhurtaBadgeLabel}>✨ अभिजित मुहूर्त</Text>
                    <Text style={styles.muhurtaBadgeTime}>
                      {panchang.muhurtas.abhijitMuhurta
                        ? `${formatTime(panchang.muhurtas.abhijitMuhurta.startTime)} - ${formatTime(panchang.muhurtas.abhijitMuhurta.endTime)}`
                        : 'आज वर्जित'}
                    </Text>
                  </View>
                  <View style={styles.muhurtaBadgeAshubh}>
                    <Text style={styles.muhurtaBadgeLabelAshubh}>⚠️ राहु काल</Text>
                    <Text style={styles.muhurtaBadgeTimeAshubh}>
                      {formatTime(panchang.muhurtas.rahuKaal.startTime)} - {formatTime(panchang.muhurtas.rahuKaal.endTime)}
                    </Text>
                  </View>
                </View>

                {/* Celestial Sunrise & Moonrise Bar */}
                <View style={styles.celestialRow}>
                  <View style={styles.celestialItem}>
                    <Text style={styles.celestialEmoji}>🌅</Text>
                    <Text style={styles.celestialText}>सूर्योदय: {formatTime(panchang.sunTimes.sunrise)}</Text>
                  </View>
                  <View style={styles.celestialDivider} />
                  <View style={styles.celestialItem}>
                    <Text style={styles.celestialEmoji}>🌙</Text>
                    <Text style={styles.celestialText}>
                      चन्द्रोदय: {panchang.moonTimes.moonrise ? formatTime(panchang.moonTimes.moonrise) : 'दिन में'}
                    </Text>
                  </View>
                </View>

                {/* Sacred Shloka Box */}
                <View style={styles.shlokaBox}>
                  <Text style={styles.shlokaTitle}>📖 आज का कल्याणकारी श्लोक</Text>
                  <Text style={styles.shlokaText}>{verse.shloka}</Text>
                  <Text style={styles.shlokaMeaning}>[अर्थ]: {verse.meaningHi}</Text>
                </View>

                {/* Personalized Sender Tag if provided */}
                {userName ? (
                  <View style={styles.senderPill}>
                    <Text style={styles.senderPillText}>🙏 सप्रेम प्रेषक: {userName}</Text>
                  </View>
                ) : null}

                {/* Card Footer Watermark */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerBrand}>सनातन पञ्चाङ्ग • sanatan.cc</Text>
                  <Text style={styles.footerTagline}>प्रामाणिक वैदिक दिनचर्या एवं शुभ मुहूर्त</Text>
                  <View style={styles.footerAppBadge}>
                    <Text style={styles.footerAppBadgeText}>📲 Google Play: Sanatan (cc.sanatan.app)</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.bottomCloseRow, isDark && { borderTopColor: theme.border }]}>
            <AppButton
              testID="share-card-done-btn"
              variant="outline"
              label="बन्द करें"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  modalTitle: {
    ...Typography.sectionHeading,
    color: '#18181b',
  },
  modalSubtitle: {
    ...Typography.bodyMuted,
    color: '#71717a',
    marginTop: 2,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  captureCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fffdf5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fcd34d',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  cardBorderFrame: {
    padding: 18,
  },
  cardTopHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  omBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 1,
  },
  cardSuprabhat: {
    fontSize: 20,
    fontWeight: '900',
    color: '#78350f',
    marginTop: 4,
  },
  cardCityText: {
    fontSize: 12.5,
    color: '#92400e',
    fontWeight: '600',
    marginTop: 3,
  },
  deityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 10,
  },
  deityIcon: {
    fontSize: 26,
  },
  deityBannerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase',
  },
  deityBannerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 1,
  },
  deityMantra: {
    fontSize: 12.5,
    color: '#b45309',
    fontWeight: '700',
    marginTop: 2,
  },
  panchangGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  gridLabel: {
    fontSize: 11.5,
    color: '#52525b',
    fontWeight: '700',
  },
  gridValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  muhurtaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  celestialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  celestialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  celestialDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#fde68a',
  },
  celestialEmoji: {
    fontSize: 14,
  },
  celestialText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#44403c',
  },
  senderPill: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  senderPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  muhurtaBadgeShubh: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  muhurtaBadgeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065f46',
  },
  muhurtaBadgeTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  muhurtaBadgeAshubh: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  muhurtaBadgeLabelAshubh: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#991b1b',
  },
  muhurtaBadgeTimeAshubh: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
    marginTop: 2,
  },
  shlokaBox: {
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  shlokaTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#57534e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shlokaText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Devanagari' : undefined,
  },
  shlokaMeaning: {
    fontSize: 12,
    lineHeight: 17,
    color: '#57534e',
    marginTop: 4,
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
  },
  footerBrand: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  footerTagline: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  footerAppBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 6,
  },
  footerAppBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  bottomCloseRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  topActionContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  actionRow: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'column',
    gap: 10,
    marginTop: 16,
  },
  shareBtnPrimary: {
    backgroundColor: '#25D366', // WhatsApp Brand Green
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  shareBtnTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shareBtnSubtext: {
    color: '#dcfce7',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  shareBtnSubtextSecondary: {
    color: '#b45309',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  shareBtnSecondary: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  shareBtnSecondaryText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '700',
  },
});
