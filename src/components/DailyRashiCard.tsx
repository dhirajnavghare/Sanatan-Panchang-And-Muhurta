import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ALL_RASHIS, getDailyRashiOutlook } from '../services/rashiBhavishya';
import { triggerHaptic } from '../services/sacredAudio';

export const SELECTED_RASHI_STORAGE_KEY = '@sanatan_selected_rashi_v1';

interface DailyRashiCardProps {
  moonRashiIndex: number;
  savedRashiIndex?: number;
  onSaveRashi?: (rashiIdx: number) => void;
  isHi: boolean;
  hapticsEnabled?: boolean;
}

export const DailyRashiCard: React.FC<DailyRashiCardProps> = ({
  moonRashiIndex,
  savedRashiIndex,
  onSaveRashi,
  isHi,
  hapticsEnabled = true,
}) => {
  const [selectedRashi, setSelectedRashi] = useState<number>(
    savedRashiIndex !== undefined ? savedRashiIndex : (moonRashiIndex || 0)
  );
  const cardRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Sync state whenever savedRashiIndex changes (e.g. after async AsyncStorage loading)
  useEffect(() => {
    if (savedRashiIndex !== undefined) {
      setSelectedRashi(savedRashiIndex);
    } else {
      AsyncStorage.getItem(SELECTED_RASHI_STORAGE_KEY)
        .then((val) => {
          if (val !== null) {
            const parsed = parseInt(val, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < ALL_RASHIS.length) {
              setSelectedRashi(parsed);
            }
          }
        })
        .catch(() => {});
    }
  }, [savedRashiIndex]);

  const outlook = useMemo(() => {
    return getDailyRashiOutlook(selectedRashi, moonRashiIndex, new Date());
  }, [selectedRashi, moonRashiIndex]);

  const formattedDate = useMemo(() => {
    const d = new Date();
    if (isHi) {
      const monthsHi = [
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
      ];
      const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
      return `${daysHi[d.getDay()]}, ${d.getDate()} ${monthsHi[d.getMonth()]} ${d.getFullYear()}`;
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [isHi]);

  const handleSelectRashi = (idx: number) => {
    triggerHaptic('tap', hapticsEnabled).catch(() => {});
    setSelectedRashi(idx);
    AsyncStorage.setItem(SELECTED_RASHI_STORAGE_KEY, String(idx)).catch(() => {});
  };

  const handleSetAsMyRashi = () => {
    triggerHaptic('tap', hapticsEnabled).catch(() => {});
    AsyncStorage.setItem(SELECTED_RASHI_STORAGE_KEY, String(selectedRashi)).catch(() => {});
    if (onSaveRashi) {
      onSaveRashi(selectedRashi);
    }
  };

  const handleShareHoroscopeWhatsApp = async () => {
    triggerHaptic('tap', hapticsEnabled).catch(() => {});
    setIsSharing(true);
    try {
      const rashiName = isHi
        ? `${outlook.rashi.nameHi} (${outlook.rashi.symbol})`
        : `${outlook.rashi.nameEn} (${outlook.rashi.symbol})`;
      const lord = isHi
        ? `${outlook.rashi.lordHi} • ${outlook.rashi.elementHi}`
        : `${outlook.rashi.lordEn} • ${outlook.rashi.elementEn}`;
      const energy = isHi ? outlook.energyLevelHi : outlook.energyLevelEn;
      const transitTitle = isHi ? outlook.houseTitleHi : outlook.houseTitleEn;
      const guidance = isHi ? outlook.guidanceHi : outlook.guidanceEn;
      const luckyColor = isHi ? outlook.luckyColorHi : outlook.luckyColorEn;
      const ishtadev = isHi ? outlook.rashi.ishtadevHi : outlook.rashi.ishtadevEn;
      const satvikUpay = isHi ? outlook.satvikActionHi : outlook.satvikActionEn;

      const message = isHi
        ? `🕉️ *दैनिक वैदिक राशिफल — ${rashiName}* 🕉️\n` +
          `📅 ${formattedDate}\n\n` +
          `✨ *राशि:* ${rashiName}\n` +
          `🪐 *स्वामी:* ${lord}\n` +
          `⚡ *ऊर्जा व प्रभाव:* ${energy}\n\n` +
          `📜 *गोचर फल:* ${transitTitle}\n` +
          `${guidance}\n\n` +
          `🎨 *शुभ रंग:* ${luckyColor} | 🔢 *शुभ अंक:* ${outlook.luckyNumber}\n` +
          `🙏 *आराध्य देव:* ${ishtadev}\n` +
          `🌸 *दैनिक सात्विक उपाय:* ${satvikUpay}\n` +
          `🕉️ *दैनिक मन्त्र:* ${outlook.rashi.seedMantra}\n\n` +
          `📲 *सनातन ऍप डाउनलोड करें (Google Play):*\n` +
          `https://play.google.com/store/apps/details?id=cc.sanatan.app\n` +
          `🌐 https://sanatan.cc\n\n` +
          `_प्रामाणिक वैदिक दिनचर्या, पञ्चाङ्ग व मुहूर्त साथी_ 🙏`
        : `🕉️ *Daily Vedic Horoscope — ${rashiName}* 🕉️\n` +
          `📅 ${formattedDate}\n\n` +
          `✨ *Sign:* ${rashiName}\n` +
          `🪐 *Ruler:* ${lord}\n` +
          `⚡ *Energy Level:* ${energy}\n\n` +
          `📜 *Transit Outlook:* ${transitTitle}\n` +
          `${guidance}\n\n` +
          `🎨 *Lucky Color:* ${luckyColor} | 🔢 *Lucky Number:* ${outlook.luckyNumber}\n` +
          `🙏 *Ishta Deity:* ${ishtadev}\n` +
          `🌸 *Daily Satvik Remedy:* ${satvikUpay}\n` +
          `🕉️ *Seed Mantra:* ${outlook.rashi.seedMantra}\n\n` +
          `📲 *Download Sanatan App (Google Play):*\n` +
          `https://play.google.com/store/apps/details?id=cc.sanatan.app\n` +
          `🌐 https://sanatan.cc\n\n` +
          `_Your authentic daily Vedic companion_ 🙏`;

      if (Platform.OS !== 'web' && cardRef.current) {
        let uri: string | null = null;
        try {
          uri = await captureRef(cardRef, {
            format: 'png',
            quality: 1.0,
            result: 'tmpfile',
          });
        } catch {
          uri = null;
        }

        if (uri) {
          // 1. Android Native custom share (sends Image + Text caption with URL in a single click)
          if (Platform.OS === 'android' && NativeModules.SanatanShare?.shareImageWithText) {
            try {
              await NativeModules.SanatanShare.shareImageWithText(
                uri,
                message,
                isHi ? 'दैनिक राशिफल WhatsApp पर शेयर करें' : 'Share Daily Horoscope on WhatsApp'
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
                message,
                title: isHi ? 'दैनिक राशिफल' : 'Daily Horoscope',
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
              dialogTitle: isHi ? 'दैनिक राशिफल WhatsApp पर शेयर करें' : 'Share Daily Horoscope on WhatsApp',
            });
            setIsSharing(false);
            return;
          }
        }
      }

      // Web or fallback: Share formatted text with URLs (omit title to prevent OEM link-only stripping on Android)
      await Share.share({ message });
    } catch {
      // ignore
    } finally {
      setIsSharing(false);
    }
  };

  const isMyRashi = savedRashiIndex === selectedRashi;

  return (
    <View style={styles.container} testID="daily-rashi-card">
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={styles.headerBadgeGroup}>
            <Text style={styles.headerIcon}>🪐</Text>
            <Text style={styles.headerTitle}>
              {isHi ? 'दैनिक गोचर राशिफल व उपाय' : 'Daily Vedic Horoscope & Remedy'}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {isHi
              ? 'चन्द्र गोचर आधारित प्रामाणिक फल एवं दैनिक साधना'
              : 'Authentic Moon transit outlook & daily spiritual remedies'}
          </Text>
        </View>

        {onSaveRashi && (
          <TouchableOpacity
            testID="rashi-set-my-btn"
            style={[styles.myRashiPill, isMyRashi && styles.myRashiPillActive]}
            onPress={handleSetAsMyRashi}
            activeOpacity={0.7}
          >
            <Text style={[styles.myRashiText, isMyRashi && styles.myRashiTextActive]}>
              {isMyRashi ? (isHi ? '✓ मेरी राशि' : '✓ My Sign') : (isHi ? '+ मेरी राशि चुनें' : '+ Set My Sign')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 12 Rashi Horizontal Pill Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rashiSelectorScroll}
      >
        {ALL_RASHIS.map((r) => {
          const isSelected = r.index === selectedRashi;
          const isUserSaved = savedRashiIndex === r.index;
          return (
            <TouchableOpacity
              key={r.index}
              testID={`rashi-pill-${r.index}`}
              style={[
                styles.rashiPill,
                isSelected && {
                  backgroundColor: r.colorHex,
                  borderColor: r.colorHex,
                },
              ]}
              onPress={() => handleSelectRashi(r.index)}
              activeOpacity={0.8}
            >
              <Text style={styles.rashiSymbol}>{r.symbol}</Text>
              <Text
                style={[
                  styles.rashiPillName,
                  isSelected && styles.rashiPillNameSelected,
                ]}
              >
                {isHi ? r.nameHi : r.nameEn}
              </Text>
              {isUserSaved && !isSelected && (
                <View style={styles.savedDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Detailed Card Body - Capturable for High-Res WhatsApp Visual Card */}
      <View
        ref={cardRef}
        collapsable={false}
        style={styles.outlookBody}
      >
        {/* Sacred Card Header for Visual Share */}
        <View style={styles.cardShareHeader}>
          <Text style={styles.cardSacredMantra}>॥ ॐ श्री सूर्याय नमः ॥</Text>
          <Text style={styles.cardDateText}>{formattedDate}</Text>
        </View>

        {/* Rashi & Energy Header */}
        <View style={styles.bodyTopRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <View style={styles.rashiIdentityRow}>
              <Text style={styles.rashiSymbolLarge}>{outlook.rashi.symbol}</Text>
              <View style={{ backgroundColor: 'transparent' }}>
                <Text style={styles.rashiNameTitle}>
                  {isHi ? `${outlook.rashi.nameHi} राशि` : `${outlook.rashi.nameEn} (Sign)`}
                </Text>
                <Text style={styles.rashiLordText}>
                  {isHi
                    ? `स्वामी: ${outlook.rashi.lordHi} • ${outlook.rashi.elementHi}`
                    : `Ruler: ${outlook.rashi.lordEn} • ${outlook.rashi.elementEn}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.energyBadge}>
            <Text style={styles.energyBadgeText}>
              {isHi ? outlook.energyLevelHi : outlook.energyLevelEn}
            </Text>
          </View>
        </View>

        {/* House Transit Highlight */}
        <View style={styles.transitBanner}>
          <Text style={styles.transitTitle}>
            {isHi ? outlook.houseTitleHi : outlook.houseTitleEn}
          </Text>
          <Text style={styles.transitGuidance}>
            {isHi ? outlook.guidanceHi : outlook.guidanceEn}
          </Text>
        </View>

        {/* Lucky Attributes Row */}
        <View style={styles.attributesRow}>
          {/* Lucky Color */}
          <View style={styles.attrCard}>
            <Text style={styles.attrEmoji}>🎨</Text>
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={styles.attrLabel}>{isHi ? 'शुभ रंग' : 'Lucky Color'}</Text>
              <Text style={styles.attrValue}>{isHi ? outlook.luckyColorHi : outlook.luckyColorEn}</Text>
            </View>
          </View>

          {/* Lucky Number */}
          <View style={styles.attrCard}>
            <Text style={styles.attrEmoji}>🔢</Text>
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={styles.attrLabel}>{isHi ? 'शुभ अंक' : 'Lucky No.'}</Text>
              <Text style={styles.attrValue}>{outlook.luckyNumber}</Text>
            </View>
          </View>

          {/* Ishtadev */}
          <View style={[styles.attrCard, { flex: 1.3 }]}>
            <Text style={styles.attrEmoji}>🕉️</Text>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={styles.attrLabel}>{isHi ? 'आराध्य देव' : 'Ishta Deity'}</Text>
              <Text style={styles.attrValue} numberOfLines={1}>
                {isHi ? outlook.rashi.ishtadevHi : outlook.rashi.ishtadevEn}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Satvik Upay */}
        <View style={styles.upayCard}>
          <View style={styles.upayHeaderRow}>
            <Text style={styles.upayIcon}>🌸</Text>
            <Text style={styles.upayTitle}>
              {isHi ? 'आज का सात्विक उपाय व कर्म' : 'Satvik Remedy of the Day'}
            </Text>
          </View>
          <Text style={styles.upayText}>
            {isHi ? outlook.satvikActionHi : outlook.satvikActionEn}
          </Text>
        </View>

        {/* Seed Mantra Pill */}
        <View style={styles.mantraRow}>
          <Text style={styles.mantraLabel}>{isHi ? 'दैनिक मन्त्र:' : 'Daily Mantra:'}</Text>
          <Text style={styles.mantraText}>{outlook.rashi.seedMantra}</Text>
        </View>

        {/* Card Footer for Visual Share (Branding) */}
        <View style={styles.cardShareFooter}>
          <Text style={styles.cardBrandTitle}>
            🚩 {isHi ? 'सनातन — प्रामाणिक वैदिक पञ्चाङ्ग व मुहूर्त साथी' : 'Sanatan — Authentic Vedic Panchang & Muhurta'}
          </Text>
          <Text style={styles.cardBrandUrl}>sanatan.cc</Text>
        </View>
      </View>

      {/* WhatsApp Share Daily Horoscope Button */}
      <TouchableOpacity
        testID="rashi-share-whatsapp-btn"
        style={styles.whatsAppShareRashiBtn}
        onPress={handleShareHoroscopeWhatsApp}
        activeOpacity={0.8}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
            <Text style={styles.whatsAppShareRashiText}>
              {isHi ? 'WhatsApp पर राशिफल शेयर करें' : 'Share Horoscope on WhatsApp'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  headerBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#6b7280',
    fontWeight: '500',
  },
  whatsAppShareRashiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsAppShareRashiText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  myRashiPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginLeft: 6,
  },
  myRashiPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  myRashiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
  },
  myRashiTextActive: {
    color: '#059669',
  },
  rashiSelectorScroll: {
    paddingBottom: 10,
    gap: 6,
  },
  rashiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rashiSymbol: {
    fontSize: 13,
  },
  rashiPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  rashiPillNameSelected: {
    color: '#ffffff',
  },
  savedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
    marginLeft: 2,
  },
  outlookBody: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  cardShareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'transparent',
  },
  cardSacredMantra: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    fontFamily: 'serif',
  },
  cardDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  cardShareFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardBrandTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  cardBrandUrl: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#9ca3af',
  },
  bodyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  rashiIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  rashiSymbolLarge: {
    fontSize: 26,
  },
  rashiNameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  rashiLordText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  energyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  energyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  transitBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transitTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  transitGuidance: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 17,
  },
  attributesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  attrCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attrEmoji: {
    fontSize: 14,
  },
  attrLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  attrValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1f2937',
  },
  upayCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  upayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
    backgroundColor: 'transparent',
  },
  upayIcon: {
    fontSize: 12,
  },
  upayTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#854d0e',
  },
  upayText: {
    fontSize: 11.5,
    color: '#713f12',
    lineHeight: 16,
  },
  mantraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mantraLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  mantraText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7c2d12',
    fontFamily: 'serif',
  },
});
