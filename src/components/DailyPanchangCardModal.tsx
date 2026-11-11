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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PanchangData } from '@/src/core/panchang/types';
import { DailyDevataInfo, ShastricVerse } from '@/src/services/dinacharya';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { triggerHaptic } from '@/src/services/sacredAudio';

interface DailyPanchangCardModalProps {
  visible: boolean;
  onClose: () => void;
  panchang: PanchangData;
  cityName: string;
  devataInfo: DailyDevataInfo;
  verse: ShastricVerse;
}

export function DailyPanchangCardModal({
  visible,
  onClose,
  panchang,
  cityName,
  devataInfo,
  verse,
}: DailyPanchangCardModalProps) {
  const cardRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const formatTime = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleShareImage = async () => {
    await triggerHaptic('tap');
    setIsSharing(true);
    try {
      if (Platform.OS !== 'web' && cardRef.current) {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'आज का पञ्चाङ्ग WhatsApp पर शेयर करें',
          });
          setIsSharing(false);
          return;
        }
      }

      // Fallback for Web or if native sharing is unavailable: Share formatted text
      await handleShareText();
    } catch {
      await handleShareText();
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareText = async () => {
    await triggerHaptic('tap');
    try {
      const text = `॥ ॐ श्री गणेशाय नमः ॥\n\n🌅 *आज का पञ्चाङ्ग एवं सुविचार*\n📍 स्थान: ${cityName}\n📅 तिथि: ${panchang.tithi.current.pakshaDevanagari} ${panchang.tithi.current.nameDevanagari}\n⭐ नक्षत्र: ${panchang.nakshatra.current.nameDevanagari}\n🧘 योग: ${panchang.yoga.current.nameDevanagari}\n\n🚩 *आज के वार अधिष्ठाता:* ${devataInfo.deityNameHi}\n✨ *मन्त्र:* ${devataInfo.mantraDevanagari}\n\n🌟 *अभिजित मुहूर्त:* ${panchang.muhurtas.abhijitMuhurta ? `${formatTime(panchang.muhurtas.abhijitMuhurta.startTime)} - ${formatTime(panchang.muhurtas.abhijitMuhurta.endTime)}` : 'आज वर्जित'}\n⚠️ *राहु काल:* ${formatTime(panchang.muhurtas.rahuKaal.startTime)} - ${formatTime(panchang.muhurtas.rahuKaal.endTime)}\n\n📖 *आज का श्लोक:*\n${verse.shloka}\n\n[अर्थ]: ${verse.meaningHi}\n\n— सनातन पञ्चाङ्ग (sanatan.cc)\nहर सनातनी का प्रामाणिक दैनिक साथी`;

      await Share.share({ message: text });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>दैनिक पञ्चाङ्ग शेयर कार्ड</Text>
              <Text style={styles.modalSubtitle}>WhatsApp स्टेटस व परिवार ग्रुप्स के लिए</Text>
            </View>
            <TouchableOpacity
              testID="share-card-close-btn"
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#71717a" />
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

                {/* Sacred Shloka Box */}
                <View style={styles.shlokaBox}>
                  <Text style={styles.shlokaTitle}>📖 आज का कल्याणकारी श्लोक</Text>
                  <Text style={styles.shlokaText}>{verse.shloka}</Text>
                  <Text style={styles.shlokaMeaning}>[अर्थ]: {verse.meaningHi}</Text>
                </View>

                {/* Card Footer Watermark */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerBrand}>सनातन पञ्चाङ्ग • sanatan.cc</Text>
                  <Text style={styles.footerTagline}>प्रामाणिक वैदिक दिनचर्या एवं शुभ मुहूर्त</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                testID="share-image-btn"
                style={styles.shareBtnPrimary}
                onPress={handleShareImage}
                activeOpacity={0.8}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                    <Text style={styles.shareBtnPrimaryText}>WhatsApp पर कार्ड शेयर करें</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="share-text-btn"
                style={styles.shareBtnSecondary}
                onPress={handleShareText}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={18} color="#d97706" />
                <Text style={styles.shareBtnSecondaryText}>टेक्स्ट कॉपी करें</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase',
  },
  deityBannerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 1,
  },
  deityMantra: {
    fontSize: 11,
    color: '#d97706',
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
    padding: 9,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  gridLabel: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  muhurtaBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  muhurtaBadgeShubh: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  muhurtaBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
  },
  muhurtaBadgeTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  muhurtaBadgeAshubh: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  muhurtaBadgeLabelAshubh: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991b1b',
  },
  muhurtaBadgeTimeAshubh: {
    fontSize: 12,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#57534e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shlokaText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#1c1917',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Devanagari' : undefined,
  },
  shlokaMeaning: {
    fontSize: 10,
    lineHeight: 14,
    color: '#78716c',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  footerTagline: {
    fontSize: 9,
    color: '#a1a1aa',
    marginTop: 1,
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
  shareBtnSecondary: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  shareBtnSecondaryText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '700',
  },
});
