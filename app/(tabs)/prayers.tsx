import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Text,
  View,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { PRAYERS_DATA } from '@/src/core/prayers/data';
import { PrayerRecord } from '@/src/core/prayers/types';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { JapaMalaView } from '@/src/components/JapaMalaView';
import { playTempleBell, playShankhNaad, triggerHaptic } from '@/src/services/sacredAudio';
import { loadUserProfile, UserSacredProfile, DEFAULT_USER_PROFILE } from '@/src/services/userProfile';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll, useTourHorizontalScroll } from '@/src/hooks/useTourScroll';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { InlineFeedbackBanner } from '@/src/components/ui/ScreenStateView';

const PRAYERS_HORIZONTAL_TOUR_TARGETS = ['prayer-pill-hanuman-chalisa'] as const;

export default function PrayersScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const { openHelp, isInteractiveTourActive, isTryModeActive } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const hScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/prayers', scrollRef);
  const {
    onHorizontalScroll,
    onHorizontalMomentumScrollEnd,
    onHorizontalScrollEndDrag,
  } = useTourHorizontalScroll(
    '/(tabs)/prayers',
    hScrollRef,
    PRAYERS_HORIZONTAL_TOUR_TARGETS
  );

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRecord>(PRAYERS_DATA[0]);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);

  // Sacred Chanting Loop Player State
  const [isPlayingChant, setIsPlayingChant] = useState(false);
  const [targetLoops, setTargetLoops] = useState<number>(1);
  const [completedLoops, setCompletedLoops] = useState<number>(0);
  const completedLoopsRef = useRef<number>(0);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(null);
  const chantTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((message: string) => {
    setFeedbackMsg(message);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMsg(null);
      feedbackTimerRef.current = null;
    }, 2400);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadUserProfile()
        .then((p) => {
          if (mounted) setUserProfile(p);
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }, [])
  );

  const stopChanting = useCallback(() => {
    if (chantTimerRef.current) {
      clearInterval(chantTimerRef.current);
      chantTimerRef.current = null;
    }
    setIsPlayingChant(false);
    setActiveVerseIndex(null);
  }, []);

  const handleToggleChant = () => {
    void triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    if (isPlayingChant) {
      stopChanting();
      return;
    }

    if (userProfile.audioEnabled) {
      playTempleBell(0.8);
    }
    setIsPlayingChant(true);
    let currentIdx = activeVerseIndex !== null ? activeVerseIndex : 0;
    setActiveVerseIndex(currentIdx);

    const totalVerses = selectedPrayer.verses.length;
    chantTimerRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx >= totalVerses) {
        currentIdx = 0;
        const nextVal = completedLoopsRef.current + 1;
        completedLoopsRef.current = nextVal;
        if (userProfile.audioEnabled) {
          playTempleBell(0.85);
        }
        triggerHaptic('quarter', userProfile.hapticsEnabled).catch(() => {});
        if (nextVal >= targetLoops) {
          completedLoopsRef.current = 0;
          setCompletedLoops(0);
          stopChanting();
          triggerHaptic('malaComplete', userProfile.hapticsEnabled).catch(() => {});
          showFeedback(
            isHi
              ? `${selectedPrayer.titleDevanagari} के ${targetLoops} पाठ पूर्ण हुए`
              : `Completed ${targetLoops} rounds of ${selectedPrayer.title}`
          );
          Alert.alert(
            isHi ? 'पाठ सम्पन्न 🙏' : 'Chanting Completed 🙏',
            isHi
              ? `${selectedPrayer.titleDevanagari} के ${targetLoops} पाठ सफलतापूर्वक सम्पन्न हुए।`
              : `Successfully completed ${targetLoops} sacred rounds of ${selectedPrayer.title}.`
          );
          return;
        }
        setCompletedLoops(nextVal);
      }
      setActiveVerseIndex(currentIdx);
    }, 3500);
  };

  const handleResetChant = () => {
    void triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
    stopChanting();
    completedLoopsRef.current = 0;
    setCompletedLoops(0);
    showFeedback(isHi ? 'जप-पाठ गणना रीसेट हो गई' : 'Chanting progress reset');
  };

  useEffect(() => {
    return () => {
      if (chantTimerRef.current) {
        clearInterval(chantTimerRef.current);
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const prayerIcons: Record<string, string> = {
    'hanuman-chalisa': '🚩',
    'shiv-tandav-stotram': '🔱',
    'shri-suktam': '🪷',
    'sankat-mochan-hanuman-ashtak': '🪔',
    'aditya-hridaya-stotram': '☀️',
    'ganesh-chalisa': '🐘',
    'om-jai-jagdish-hare': '🐚',
    'pratahsmarana-slokas': '🌅',
  };

  const handlePrayerSelect = (p: PrayerRecord) => {
    if (p.id === selectedPrayer.id) return;
    stopChanting();
    completedLoopsRef.current = 0;
    setCompletedLoops(0);
    setIsCalculating(true);
    setTimeout(() => {
      setSelectedPrayer(p);
      setIsCalculating(false);
    }, 100);
  };

  const handleShareVerse = async (sanskrit: string, meaning: string, index: number) => {
    try {
      await Share.share({
        message: `${selectedPrayer.title} (#${index})\n\n${sanskrit}\n\n[अर्थ]: ${meaning}\n\n📲 *सनातन ऍप डाउनलोड करें (Google Play):*\nhttps://play.google.com/store/apps/details?id=cc.sanatan.app\n🌐 https://sanatan.cc\n\n— सनातन पञ्चाङ्ग: हर सनातनी का प्रामाणिक दैनिक साथी`,
      });
      showFeedback(isHi ? `पद #${index} साझा किया गया` : `Verse #${index} shared`);
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onTourScroll}
      onMomentumScrollEnd={onTourMomentumScrollEnd}
      onScrollEndDrag={onTourScrollEndDrag}
      scrollEventThrottle={16}
      scrollEnabled={!isInteractiveTourActive || isTryModeActive}
    >
      {/* Horizontal Prayer Selector with Emojis */}
      <View style={styles.selectorContainer}>
        <ScrollView
          ref={hScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          onScroll={onHorizontalScroll}
          onMomentumScrollEnd={onHorizontalMomentumScrollEnd}
          onScrollEndDrag={onHorizontalScrollEndDrag}
          scrollEventThrottle={16}
        >
          {PRAYERS_DATA.map((p) => {
            const isSelected = p.id === selectedPrayer.id;
            const icon = prayerIcons[p.id] || '🕉️';
            const pillNode = (
              <TouchableOpacity
                key={p.id}
                testID={`prayer-pill-${p.id}`}
                accessibilityRole="button"
                accessibilityLabel={isHi ? p.titleDevanagari : p.title}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.prayerPill,
                  { minHeight: MIN_TOUCH_TARGET },
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && (isDark ? { backgroundColor: theme.primary, borderColor: theme.primary } : styles.prayerPillSelected),
                ]}
                onPress={() => handlePrayerSelect(p)}
                activeOpacity={0.8}
              >
                <Text style={styles.prayerIconText}>{icon}</Text>
                <Text
                  style={[
                    styles.prayerPillText,
                    isDark && { color: theme.textSecondary },
                    isSelected && styles.prayerPillTextSelected,
                  ]}
                >
                  {isHi ? p.titleDevanagari : p.title}
                </Text>
              </TouchableOpacity>
            );

            return p.id === 'hanuman-chalisa' ? (
              <TourTarget key={p.id} targetId="prayer-pill-hanuman-chalisa" borderRadius={20}>
                {pillNode}
              </TourTarget>
            ) : (
              pillNode
            );
          })}
        </ScrollView>
      </View>

      {isCalculating ? (
        <LoadingIndicator
          message={
            isHi
              ? 'स्तोत्र एवं पवित्र मन्त्र लोड हो रहे हैं...'
              : 'Loading Sacred Prayer & Verses...'
          }
        />
      ) : (
        <>
          {feedbackMsg ? (
            <InlineFeedbackBanner
              message={feedbackMsg}
              tone="success"
              style={{ marginBottom: Spacing.sm }}
            />
          ) : null}

          {/* Sacred Temple Sound Bar */}
          <View style={styles.soundBar}>
            <TouchableOpacity
              testID="prayers-bell-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'मन्दिर घंटी नाद' : 'Ring Mandir Bell'}
              style={[
                styles.soundBtn,
                { minHeight: COMFORT_TOUCH_TARGET },
                isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
              ]}
              onPress={() => {
                void triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                playTempleBell(0.7);
                showFeedback(isHi ? 'मन्दिर घंटी नाद बज रहा है 🔔' : 'Temple bell sounded');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.soundBtnIcon}>🔔</Text>
              <Text style={[styles.soundBtnText, isDark && { color: theme.primary }]}>
                {isHi ? 'मन्दिर घंटी नाद' : 'Ring Mandir Bell'}
              </Text>
            </TouchableOpacity>

            <TourTarget targetId="prayers-shankh-btn" borderRadius={18} style={{ flex: 1, minWidth: 130 }}>
              <TouchableOpacity
                testID="prayers-shankh-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'पवित्र शंख नाद' : 'Auspicious Shankha'}
                style={[
                  styles.soundBtn,
                  { width: '100%', minHeight: COMFORT_TOUCH_TARGET },
                  isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
                ]}
                onPress={() => {
                  void triggerHaptic('heavy', userProfile.hapticsEnabled).catch(() => {});
                  playShankhNaad(1.0);
                  showFeedback(isHi ? 'पवित्र शंख नाद बज रहा है 🐚' : 'Auspicious Shankha sounded');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.soundBtnIcon}>🐚</Text>
                <Text style={[styles.soundBtnText, isDark && { color: theme.primary }]}>
                  {isHi ? 'पवित्र शंख नाद' : 'Auspicious Shankha'}
                </Text>
              </TouchableOpacity>
            </TourTarget>

            <TouchableOpacity
              testID="prayers-help-btn"
              accessibilityRole="button"
              style={[
                styles.helpBtn,
                { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET },
                isDark && { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => openHelp('prayers')}
              accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={22} color={isDark ? theme.textSecondary : Palette.textSecondaryLight} />
            </TouchableOpacity>
          </View>

          {/* Tactile 108-Bead Interactive Japa Mala */}
          <TourTarget targetId="prayers-japa-mala" borderRadius={22}>
            <JapaMalaView
              mantraTitle={isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
              mantraDevanagari={selectedPrayer.verses[0]?.sanskrit || selectedPrayer.titleDevanagari}
              mantraMeaning={isHi ? selectedPrayer.verses[0]?.hindiMeaning : selectedPrayer.verses[0]?.englishMeaning}
              audioEnabled={userProfile.audioEnabled}
              hapticsEnabled={userProfile.hapticsEnabled}
              isHi={isHi}
            />
          </TourTarget>

          {/* Interactive Sacred Chanting & Japa Loop Player */}
          <View
            style={[
              styles.chantPlayerCard,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.chantPlayerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chantPlayerTag, isDark && { color: theme.primary }]}>
                  {isHi ? '📿 नित्य पाठ एवं जप आवर्तन' : '📿 Sacred Chanting & Japa Loop'}
                </Text>
                <Text style={[styles.chantPlayerTitle, isDark && { color: theme.text }]}>
                  {isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
                </Text>
              </View>

              <View style={[styles.loopCounterBadge, isDark && { backgroundColor: theme.primaryBg }]}>
                <Text style={[styles.loopCounterText, isDark && { color: theme.primary }]}>
                  {isHi ? `पाठ ${completedLoops}/${targetLoops}` : `Round ${completedLoops}/${targetLoops}`}
                </Text>
              </View>
            </View>

            {/* Loop Target Selector */}
            <View style={styles.loopSelectorRow}>
              <Text style={[styles.loopSelectorLabel, isDark && { color: theme.textMuted }]}>
                {isHi ? 'आवर्तन (Loops):' : 'Target Loops:'}
              </Text>
              {[1, 7, 11, 21, 108].map((num) => (
                <TouchableOpacity
                  key={num}
                  testID={`loop-btn-${num}`}
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? `${num} आवर्तन` : `${num} loops`}
                  accessibilityState={{ selected: targetLoops === num }}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  style={[
                    styles.loopBtn,
                    isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    targetLoops === num && styles.loopBtnActive,
                  ]}
                  onPress={() => {
                    void triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
                    setTargetLoops(num);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.loopBtnText,
                      isDark && { color: theme.textSecondary },
                      targetLoops === num && styles.loopBtnTextActive,
                    ]}
                  >
                    {num}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chanting Action Buttons */}
            <View style={styles.chantActionRow}>
              <TourTarget targetId="chant-play-toggle-btn" borderRadius={18} style={{ flex: 1, minWidth: 180 }}>
                <TouchableOpacity
                  testID="chant-play-toggle-btn"
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPlayingChant
                      ? (isHi ? 'पाठ विराम करें' : 'Pause chanting')
                      : (isHi ? 'पाठ प्रारंभ करें' : 'Start chanting')
                  }
                  style={[
                    styles.chantPlayBtn,
                    { width: '100%', minHeight: COMFORT_TOUCH_TARGET },
                    isPlayingChant && styles.chantPlayBtnActive,
                  ]}
                  onPress={handleToggleChant}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isPlayingChant ? 'pause' : 'play'}
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.chantPlayBtnText}>
                    {isPlayingChant
                      ? (isHi ? 'विराम (Pause)' : 'Pause Chanting')
                      : (isHi ? `पाठ प्रारंभ करें (${targetLoops} बार)` : `Start Chanting (${targetLoops}x)`)}
                  </Text>
                </TouchableOpacity>
              </TourTarget>

              {(isPlayingChant || completedLoops > 0) && (
                <TouchableOpacity
                  testID="chant-reset-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'पाठ रीसेट करें' : 'Reset chanting'}
                  style={[
                    styles.chantResetBtn,
                    { minHeight: COMFORT_TOUCH_TARGET },
                    isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                  ]}
                  onPress={handleResetChant}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color={isDark ? theme.textSecondary : '#52525b'} />
                  <Text style={[styles.chantResetBtnText, isDark && { color: theme.textSecondary }]}>
                    {isHi ? 'रीसेट' : 'Reset'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reader Controls Bar: Font Size & Header */}
          <View
            style={[
              styles.readerControlsCard,
              isDark && { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={[styles.prayerTitle, isDark && { color: theme.text }]}>
                {isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
              </Text>
              <Text style={[styles.prayerAuthor, isDark && { color: theme.textMuted }]}>
                {isHi
                  ? `${selectedPrayer.authorDevanagari} • ${selectedPrayer.totalVerses} पद`
                  : `${selectedPrayer.author} • ${selectedPrayer.totalVerses} Verses`}
              </Text>
            </View>

            {/* Font Size Buttons */}
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[styles.fontControls, isDark && { backgroundColor: theme.cardMuted }]}>
                <TouchableOpacity
                  testID="font-size-decrease"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'फ़ॉन्ट छोटा करें' : 'Decrease font size'}
                  accessibilityState={{ selected: fontSizeOffset === -2 }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={[
                    styles.fontSizeBtn,
                    fontSizeOffset === -2 && [styles.fontSizeBtnActive, isDark && { backgroundColor: theme.card }],
                  ]}
                  onPress={() => setFontSizeOffset(-2)}
                >
                  <Text style={[styles.fontSizeText, isDark && { color: theme.text }]}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="font-size-reset"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'मानक फ़ॉन्ट आकार' : 'Reset font size'}
                  accessibilityState={{ selected: fontSizeOffset === 0 }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={[
                    styles.fontSizeBtn,
                    fontSizeOffset === 0 && [styles.fontSizeBtnActive, isDark && { backgroundColor: theme.card }],
                  ]}
                  onPress={() => setFontSizeOffset(0)}
                >
                  <Text style={[styles.fontSizeText, isDark && { color: theme.text }]}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="font-size-increase"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'फ़ॉन्ट बड़ा करें' : 'Increase font size'}
                  accessibilityState={{ selected: fontSizeOffset === 3 }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={[
                    styles.fontSizeBtn,
                    fontSizeOffset === 3 && [styles.fontSizeBtnActive, isDark && { backgroundColor: theme.card }],
                  ]}
                  onPress={() => setFontSizeOffset(3)}
                >
                  <Text style={[styles.fontSizeText, isDark && { color: theme.text }]}>A+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.fontScaleHint, isDark && { color: theme.textMuted }]}>
                {fontSizeOffset < 0
                  ? (isHi ? 'छोटा • 85%' : 'Compact • 85%')
                  : fontSizeOffset > 0
                    ? (isHi ? 'बड़ा • 120%' : 'Large • 120%')
                    : (isHi ? 'मानक • 100%' : 'Standard • 100%')}
              </Text>
            </View>
          </View>

          {/* Subtitle / Focus Callout */}
          <View
            style={[
              styles.prayerSubtitleCard,
              isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
            ]}
          >
            <Text style={[styles.prayerSubtitle, isDark && { color: theme.text }]}>
              {isHi ? selectedPrayer.subtitleDevanagari : selectedPrayer.subtitle}
            </Text>
          </View>

          {/* Verses List */}
          {selectedPrayer.verses.map((verse, index) => {
            const isChantingActive = activeVerseIndex === index;
            return (
              <View
                key={verse.verseNumber}
                style={[
                  styles.verseCard,
                  isDark && { backgroundColor: theme.card, borderColor: theme.border },
                  isChantingActive && [styles.verseCardActive, isDark && { backgroundColor: '#251d0e', borderColor: theme.primary }],
                ]}
              >
                <View style={styles.verseHeaderRow}>
                  <View
                    style={[
                      styles.verseTypeBadge,
                      isDark && { backgroundColor: theme.cardMuted },
                      isChantingActive && styles.verseTypeBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.verseTypeBadgeText,
                        isDark && { color: theme.textSecondary },
                        isChantingActive && styles.verseTypeBadgeTextActive,
                      ]}
                    >
                      {isChantingActive ? (isHi ? '✨ सक्रिय पाठ • ' : '✨ Chanting • ') : ''}
                      {isHi
                        ? verse.verseType === 'doha'
                          ? 'दोहा'
                          : verse.verseType === 'chaupai'
                          ? 'चौपाई'
                          : 'श्लोक'
                        : verse.verseType.toUpperCase()}{' '}
                      #{verse.verseNumber}
                    </Text>
                  </View>

                  <TouchableOpacity
                    testID={`verse-share-${verse.verseNumber}`}
                    accessibilityRole="button"
                    accessibilityLabel={isHi ? `श्लोक ${verse.verseNumber} शेयर करें` : `Share verse ${verse.verseNumber}`}
                    style={[
                      styles.verseShareBtn,
                      isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    ]}
                    onPress={() =>
                      handleShareVerse(
                        verse.sanskrit,
                        isHi ? verse.hindiMeaning : verse.englishMeaning,
                        verse.verseNumber
                      )
                    }
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons name="share-outline" size={16} color={isDark ? theme.textSecondary : '#52525b'} />
                    <Text style={[styles.verseShareText, isDark && { color: theme.textSecondary }]}>
                      {isHi ? 'साझा' : 'Share'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sanskrit Text */}
                <Text
                  style={[
                    styles.sanskritText,
                    isDark && { color: theme.text },
                    { fontSize: 17 + fontSizeOffset, lineHeight: (17 + fontSizeOffset) * 1.65 },
                  ]}
                >
                  {verse.sanskrit}
                </Text>

                {/* Transliteration for English mode */}
                {!isHi && (
                  <Text
                    style={[
                      styles.translitText,
                      isDark && { color: theme.textMuted },
                      { fontSize: 14 + fontSizeOffset, lineHeight: (14 + fontSizeOffset) * 1.55 },
                    ]}
                  >
                    {verse.transliteration}
                  </Text>
                )}

                {/* Meaning */}
                <View style={[styles.meaningBox, isDark && { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.meaningLabel, isDark && { color: theme.primary }]}>
                    {isHi ? 'भावार्थ:' : 'Meaning:'}
                  </Text>
                  <Text
                    style={[
                      styles.meaningText,
                      isDark && { color: theme.textSecondary },
                      { fontSize: 14 + fontSizeOffset, lineHeight: (14 + fontSizeOffset) * 1.55 },
                    ]}
                  >
                    {isHi ? verse.hindiMeaning : verse.englishMeaning}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Phala-shruti */}
          <View
            style={[
              styles.phalaCard,
              isDark && { backgroundColor: theme.card, borderColor: theme.primaryBorder },
            ]}
          >
            <View style={styles.phalaHeaderRow}>
              <Ionicons name="sparkles" size={16} color={theme.primary} />
              <Text style={[styles.phalaTitle, isDark && { color: theme.primary }]}>
                {isHi ? 'फलश्रुति एवं माहात्म्य:' : 'Divine Fruits & Phala Shruti:'}
              </Text>
            </View>
            <Text style={[styles.phalaText, isDark && { color: theme.textSecondary }]}>
              {isHi ? selectedPrayer.phalaShrutiDevanagari : selectedPrayer.phalaShruti}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.dockClearance,
  },

  // Prayer Selector
  selectorContainer: {
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  prayerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    marginRight: Spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  prayerPillSelected: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  prayerIconText: {
    fontSize: 16,
  },
  prayerPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f3f46',
  },
  prayerPillTextSelected: {
    color: '#ffffff',
  },

  // Japa Mala Card
  japaCard: {
    backgroundColor: '#18181b',
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  japaTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  japaLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.accent,
  },
  japaTargetSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
    fontWeight: '500',
  },
  targetPillsRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'transparent',
  },
  targetChip: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  targetChipActive: {
    backgroundColor: Palette.primary,
  },
  targetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  targetChipTextActive: {
    color: '#ffffff',
  },

  // Central Bead
  centralBeadArea: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  counterBeadCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#27272a',
    borderWidth: 3,
    borderColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: Spacing.md,
  },
  counterLargeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 38,
  },
  counterTapHint: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.accent,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Palette.accent,
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  progressLabelText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  resetBtnText: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '600',
  },

  // Reader Controls
  readerControlsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  prayerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
    lineHeight: 24,
  },
  prayerAuthor: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 2,
    fontWeight: '600',
  },
  fontControls: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.sm,
    padding: 3,
    gap: 2,
  },
  fontSizeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  fontSizeBtnActive: {
    backgroundColor: '#ffffff',
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3f3f46',
  },
  fontScaleHint: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#52525b',
  },

  // Subtitle Card
  prayerSubtitleCard: {
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  prayerSubtitle: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '600',
  },
  soundBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  soundBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  soundBtnIcon: {
    fontSize: 17,
  },
  soundBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#92400e',
  },
  helpBtn: {
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Verses
  verseCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  verseCardActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    shadowColor: '#d97706',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  verseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  verseTypeBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  verseTypeBadgeActive: {
    backgroundColor: '#fef3c7',
  },
  verseTypeBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#52525b',
  },
  verseTypeBadgeTextActive: {
    color: '#b45309',
    fontWeight: '800',
  },

  // Sacred Chanting Loop Player
  chantPlayerCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chantPlayerHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chantPlayerTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c2410c',
  },
  chantPlayerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  loopCounterBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  loopCounterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c2410c',
  },
  loopSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  loopSelectorLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#52525b',
    marginRight: 2,
  },
  loopBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  loopBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#c2410c',
  },
  loopBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  loopBtnTextActive: {
    color: '#ffffff',
  },
  chantActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  chantPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chantPlayBtnActive: {
    backgroundColor: '#b45309',
  },
  chantPlayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  chantResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  chantResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f3f46',
  },
  verseShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  verseShareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3f3f46',
  },
  sanskritText: {
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  translitText: {
    color: '#52525b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  meaningBox: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  meaningLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
    marginBottom: 4,
  },
  meaningText: {
    color: '#334155',
  },

  // Phala Card
  phalaCard: {
    backgroundColor: '#fffdf5',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  phalaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  phalaTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400e',
  },
  phalaText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#78350f',
  },
});
