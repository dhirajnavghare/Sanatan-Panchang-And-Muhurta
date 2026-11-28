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
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ALL_RASHIS, getDailyRashiOutlook } from '../services/rashiBhavishya';
import { triggerHaptic } from '../services/sacredAudio';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET, Typography } from '../utils/theme';

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
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const [loadedStorageRashi, setLoadedStorageRashi] = useState<number | null>(null);
  const [localSelection, setLocalSelection] = useState<{
    baseSaved: number | undefined;
    value: number;
  } | null>(null);
  const cardRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Async storage hydration when savedRashiIndex isn't externally provided
  useEffect(() => {
    let mounted = true;
    if (savedRashiIndex === undefined) {
      AsyncStorage.getItem(SELECTED_RASHI_STORAGE_KEY)
        .then((val) => {
          if (!mounted || val === null) return;
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < ALL_RASHIS.length) {
            setLoadedStorageRashi(parsed);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [savedRashiIndex]);

  const selectedRashi =
    localSelection && localSelection.baseSaved === savedRashiIndex
      ? localSelection.value
      : savedRashiIndex !== undefined
        ? savedRashiIndex
        : loadedStorageRashi ?? (moonRashiIndex || 0);

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
    setLocalSelection({ baseSaved: savedRashiIndex, value: idx });
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
    <View
      style={[
        styles.container,
        isDark && { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      testID="daily-rashi-card"
    >
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={styles.headerBadgeGroup}>
            <Text style={styles.headerIcon}>🪐</Text>
            <Text style={[styles.headerTitle, isDark && { color: theme.text }]}>
              {isHi ? 'दैनिक गोचर राशिफल व उपाय' : 'Daily Vedic Horoscope & Remedy'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, isDark && { color: theme.textMuted }]}>
            {isHi
              ? 'चन्द्र गोचर आधारित प्रामाणिक फल एवं दैनिक साधना'
              : 'Authentic Moon transit outlook & daily spiritual remedies'}
          </Text>
        </View>

        {onSaveRashi && (
          <TouchableOpacity
            testID="rashi-set-my-btn"
            accessibilityRole="button"
            accessibilityLabel={isMyRashi ? (isHi ? 'मेरी राशि चयनित' : 'My sign saved') : (isHi ? 'मेरी राशि चुनें' : 'Set as my sign')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              styles.myRashiPill,
              { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
              isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
              isMyRashi && [styles.myRashiPillActive, isDark && { backgroundColor: theme.successBg, borderColor: theme.successBorder }],
            ]}
            onPress={handleSetAsMyRashi}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.myRashiText,
                isDark && { color: theme.textSecondary },
                isMyRashi && [styles.myRashiTextActive, isDark && { color: theme.successText }],
              ]}
            >
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
              accessibilityRole="button"
              accessibilityLabel={isHi ? `${r.nameHi} राशि` : `${r.nameEn} sign`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.rashiPill,
                { minHeight: MIN_TOUCH_TARGET },
                isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
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
                  isDark && { color: theme.textSecondary },
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
        style={[styles.outlookBody, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {/* Sacred Card Header for Visual Share */}
        <View style={[styles.cardShareHeader, isDark && { borderBottomColor: theme.border }]}>
          <Text style={[styles.cardSacredMantra, isDark && { color: theme.primary }]}>॥ ॐ श्री सूर्याय नमः ॥</Text>
          <Text style={[styles.cardDateText, isDark && { color: theme.textMuted }]}>{formattedDate}</Text>
        </View>

        {/* Rashi & Energy Header */}
        <View style={styles.bodyTopRow}>
          <View style={styles.rashiIdentityRow}>
            <Text style={styles.rashiSymbolLarge}>{outlook.rashi.symbol}</Text>
            <View style={styles.rashiTextCol}>
              <Text style={[styles.rashiNameTitle, isDark && { color: theme.text }]}>
                {isHi ? `${outlook.rashi.nameHi} राशि` : `${outlook.rashi.nameEn} (Sign)`}
              </Text>
              <Text style={[styles.rashiLordText, isDark && { color: theme.textMuted }]}>
                {isHi
                  ? `स्वामी: ${outlook.rashi.lordHi} • ${outlook.rashi.elementHi}`
                  : `Ruler: ${outlook.rashi.lordEn} • ${outlook.rashi.elementEn}`}
              </Text>
            </View>
          </View>

          <View style={[styles.energyBadge, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
            <Text style={[styles.energyBadgeText, isDark && { color: theme.primary }]}>
              {isHi ? outlook.energyLevelHi : outlook.energyLevelEn}
            </Text>
          </View>
        </View>

        {/* House Transit Highlight */}
        <View style={[styles.transitBanner, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.transitTitle, isDark && { color: theme.text }]}>
            {isHi ? outlook.houseTitleHi : outlook.houseTitleEn}
          </Text>
          <Text style={[styles.transitGuidance, isDark && { color: theme.textSecondary }]}>
            {isHi ? outlook.guidanceHi : outlook.guidanceEn}
          </Text>
        </View>

        {/* Lucky Attributes Grid */}
        <View style={styles.attributesContainer}>
          {/* Row 1: Lucky Color & Lucky Number */}
          <View style={styles.attributesRow}>
            {/* Lucky Color */}
            <View style={[styles.attrCard, { flex: 1.6 }, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.attrEmoji}>🎨</Text>
              <View style={styles.attrTextCol}>
                <Text style={[styles.attrLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'शुभ रंग' : 'Lucky Color'}</Text>
                <Text style={[styles.attrValue, isDark && { color: theme.text }]}>{isHi ? outlook.luckyColorHi : outlook.luckyColorEn}</Text>
              </View>
            </View>

            {/* Lucky Number */}
            <View style={[styles.attrCard, { flex: 1 }, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.attrEmoji}>🔢</Text>
              <View style={styles.attrTextCol}>
                <Text style={[styles.attrLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'शुभ अंक' : 'Lucky No.'}</Text>
                <Text style={[styles.attrValue, isDark && { color: theme.text }]}>{outlook.luckyNumber}</Text>
              </View>
            </View>
          </View>

          {/* Row 2: Ishtadev (Full prominence) */}
          <View style={[styles.attrCard, styles.attrCardFull, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.attrEmoji}>🕉️</Text>
            <View style={styles.attrTextCol}>
              <Text style={[styles.attrLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'आराध्य देव' : 'Ishta Deity'}</Text>
              <Text style={[styles.attrValue, isDark && { color: theme.text }]}>
                {isHi ? outlook.rashi.ishtadevHi : outlook.rashi.ishtadevEn}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Satvik Upay */}
        <View style={[styles.upayCard, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
          <View style={styles.upayHeaderRow}>
            <Text style={styles.upayIcon}>🌸</Text>
            <Text style={[styles.upayTitle, isDark && { color: theme.primary }]}>
              {isHi ? 'आज का सात्विक उपाय व कर्म' : 'Simple Daily Good Deed'}
            </Text>
          </View>
          <Text style={[styles.upayText, isDark && { color: theme.textSecondary }]}>
            {isHi ? outlook.satvikActionHi : outlook.satvikActionEn}
          </Text>
        </View>

        {/* Seed Mantra Pill */}
        <View style={[styles.mantraRow, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.mantraLabel, isDark && { color: theme.textMuted }]}>{isHi ? 'दैनिक मन्त्र:' : 'Daily Mantra:'}</Text>
          <Text style={[styles.mantraText, isDark && { color: theme.primary }]}>{outlook.rashi.seedMantra}</Text>
        </View>

        {/* Card Footer for Visual Share (Branding) */}
        <View style={[styles.cardShareFooter, isDark && { borderTopColor: theme.border }]}>
          <Text style={[styles.cardBrandTitle, isDark && { color: theme.primary }]}>
            🚩 {isHi ? 'सनातन — प्रामाणिक वैदिक पञ्चाङ्ग व मुहूर्त साथी' : 'Sanatan — Authentic Vedic Panchang & Muhurta'}
          </Text>
          <Text style={[styles.cardBrandUrl, isDark && { color: theme.textMuted }]}>sanatan.cc</Text>
        </View>
      </View>

      {/* WhatsApp Share Daily Horoscope Button */}
      <TouchableOpacity
        testID="rashi-share-whatsapp-btn"
        accessibilityRole="button"
        accessibilityLabel={isHi ? 'WhatsApp पर राशिफल शेयर करें' : 'Share Horoscope on WhatsApp'}
        style={[styles.whatsAppShareRashiBtn, { minHeight: COMFORT_TOUCH_TARGET }]}
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  headerBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    backgroundColor: 'transparent',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.cardTitle,
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2937',
    flexShrink: 1,
  },
  headerSubtitle: {
    ...Typography.bodyMuted,
    fontSize: 13.5,
    color: '#52525b',
    fontWeight: '500',
  },
  whatsAppShareRashiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  whatsAppShareRashiText: {
    color: '#ffffff',
    ...Typography.button,
  },
  myRashiPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  myRashiPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  myRashiText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  myRashiTextActive: {
    color: '#047857',
  },
  rashiSelectorScroll: {
    paddingBottom: 12,
    gap: 8,
  },
  rashiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rashiSymbol: {
    fontSize: 15,
  },
  rashiPillName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#374151',
  },
  rashiPillNameSelected: {
    color: '#ffffff',
  },
  savedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginLeft: 2,
  },
  outlookBody: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  cardShareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'transparent',
  },
  cardSacredMantra: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#b45309',
    fontFamily: 'serif',
  },
  cardDateText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#52525b',
  },
  cardShareFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  cardBrandTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
    flexShrink: 1,
  },
  cardBrandUrl: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  bodyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  rashiIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    backgroundColor: 'transparent',
  },
  rashiTextCol: {
    flexShrink: 1,
    backgroundColor: 'transparent',
  },
  rashiSymbolLarge: {
    fontSize: 28,
  },
  rashiNameTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  rashiLordText: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
    marginTop: 2,
  },
  energyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignSelf: 'flex-start',
  },
  energyBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  transitBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transitTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  transitGuidance: {
    ...Typography.bodyMuted,
    color: '#3f3f46',
  },
  attributesContainer: {
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  attributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  attrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attrCardFull: {
    width: '100%',
  },
  attrTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  attrEmoji: {
    fontSize: 18,
  },
  attrLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525b',
    textTransform: 'uppercase',
  },
  attrValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
    flexShrink: 1,
    marginTop: 1,
  },
  upayCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  upayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  upayIcon: {
    fontSize: 14,
  },
  upayTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#854d0e',
  },
  upayText: {
    fontSize: 13.5,
    color: '#713f12',
    lineHeight: 19,
  },
  mantraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mantraLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
  },
  mantraText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#7c2d12',
    fontFamily: 'serif',
    flexShrink: 1,
  },
});
