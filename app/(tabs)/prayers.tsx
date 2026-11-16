import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Share, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRAYERS_DATA } from '@/src/core/prayers/data';
import { PrayerRecord } from '@/src/core/prayers/types';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { JapaMalaView } from '@/src/components/JapaMalaView';
import { playTempleBell, playShankhNaad, triggerHaptic } from '@/src/services/sacredAudio';
import { loadUserProfile, UserSacredProfile, DEFAULT_USER_PROFILE } from '@/src/services/userProfile';

export default function PrayersScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRecord>(PRAYERS_DATA[0]);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);

  // Sacred Chanting Loop Player State
  const [isPlayingChant, setIsPlayingChant] = useState(false);
  const [targetLoops, setTargetLoops] = useState<number>(1);
  const [completedLoops, setCompletedLoops] = useState<number>(0);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(null);
  const chantTimerRef = useRef<any>(null);

  useEffect(() => {
    loadUserProfile().then(setUserProfile);
  }, []);

  const stopChanting = () => {
    if (chantTimerRef.current) {
      clearInterval(chantTimerRef.current);
      chantTimerRef.current = null;
    }
    setIsPlayingChant(false);
    setActiveVerseIndex(null);
  };

  const handleToggleChant = async () => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
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
    chantTimerRef.current = setInterval(async () => {
      currentIdx++;
      if (currentIdx >= totalVerses) {
        currentIdx = 0;
        setCompletedLoops((prev) => {
          const nextVal = prev + 1;
          if (userProfile.audioEnabled) {
            playTempleBell(0.85);
          }
          triggerHaptic('quarter', userProfile.hapticsEnabled);
          if (nextVal >= targetLoops) {
            stopChanting();
            triggerHaptic('malaComplete', userProfile.hapticsEnabled);
            Alert.alert(
              isHi ? 'पाठ सम्पन्न 🙏' : 'Chanting Completed 🙏',
              isHi
                ? `${selectedPrayer.titleDevanagari} के ${targetLoops} पाठ सफलतापूर्वक सम्पन्न हुए।`
                : `Successfully completed ${targetLoops} sacred rounds of ${selectedPrayer.title}.`
            );
            return 0;
          }
          return nextVal;
        });
      }
      setActiveVerseIndex(currentIdx);
    }, 3500);
  };

  const handleResetChant = async () => {
    await triggerHaptic('tap', userProfile.hapticsEnabled);
    stopChanting();
    setCompletedLoops(0);
  };

  useEffect(() => {
    return () => {
      if (chantTimerRef.current) {
        clearInterval(chantTimerRef.current);
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
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Horizontal Prayer Selector with Emojis */}
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2 }}>
          {PRAYERS_DATA.map((p) => {
            const isSelected = p.id === selectedPrayer.id;
            const icon = prayerIcons[p.id] || '🕉️';
            return (
              <TouchableOpacity
                key={p.id}
                testID={`prayer-pill-${p.id}`}
                style={[styles.prayerPill, isSelected && styles.prayerPillSelected]}
                onPress={() => handlePrayerSelect(p)}
                activeOpacity={0.8}
              >
                <Text style={styles.prayerIconText}>{icon}</Text>
                <Text
                  style={[styles.prayerPillText, isSelected && styles.prayerPillTextSelected]}
                >
                  {isHi ? p.titleDevanagari : p.title}
                </Text>
              </TouchableOpacity>
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
          {/* Sacred Temple Sound Bar */}
          <View style={styles.soundBar}>
            <TouchableOpacity
              testID="prayers-bell-btn"
              style={styles.soundBtn}
              onPress={async () => {
                await triggerHaptic('tap', userProfile.hapticsEnabled);
                playTempleBell(0.7);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.soundBtnIcon}>🔔</Text>
              <Text style={styles.soundBtnText}>{isHi ? 'मन्दिर घंटी नाद' : 'Ring Mandir Bell'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="prayers-shankh-btn"
              style={styles.soundBtn}
              onPress={async () => {
                await triggerHaptic('heavy', userProfile.hapticsEnabled);
                playShankhNaad(1.0);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.soundBtnIcon}>🐚</Text>
              <Text style={styles.soundBtnText}>{isHi ? 'पवित्र शंख नाद' : 'Auspicious Shankha'}</Text>
            </TouchableOpacity>
          </View>

          {/* Tactile 108-Bead Interactive Japa Mala */}
          <JapaMalaView
            mantraTitle={isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
            mantraDevanagari={selectedPrayer.verses[0]?.sanskrit || selectedPrayer.titleDevanagari}
            mantraMeaning={isHi ? selectedPrayer.verses[0]?.hindiMeaning : selectedPrayer.verses[0]?.englishMeaning}
            audioEnabled={userProfile.audioEnabled}
            hapticsEnabled={userProfile.hapticsEnabled}
          />

          {/* Interactive Sacred Chanting & Japa Loop Player */}
          <View style={styles.chantPlayerCard}>
            <View style={styles.chantPlayerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chantPlayerTag}>
                  {isHi ? '📿 नित्य पाठ एवं जप आवर्तन' : '📿 Sacred Chanting & Japa Loop'}
                </Text>
                <Text style={styles.chantPlayerTitle}>
                  {isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
                </Text>
              </View>

              <View style={styles.loopCounterBadge}>
                <Text style={styles.loopCounterText}>
                  {isHi ? `पाठ ${completedLoops}/${targetLoops}` : `Round ${completedLoops}/${targetLoops}`}
                </Text>
              </View>
            </View>

            {/* Loop Target Selector */}
            <View style={styles.loopSelectorRow}>
              <Text style={styles.loopSelectorLabel}>
                {isHi ? 'आवर्तन (Loops):' : 'Target Loops:'}
              </Text>
              {[1, 7, 11, 21, 108].map((num) => (
                <TouchableOpacity
                  key={num}
                  testID={`loop-btn-${num}`}
                  style={[styles.loopBtn, targetLoops === num && styles.loopBtnActive]}
                  onPress={async () => {
                    await triggerHaptic('tap', userProfile.hapticsEnabled);
                    setTargetLoops(num);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.loopBtnText, targetLoops === num && styles.loopBtnTextActive]}>
                    {num}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chanting Action Buttons */}
            <View style={styles.chantActionRow}>
              <TouchableOpacity
                testID="chant-play-toggle-btn"
                style={[styles.chantPlayBtn, isPlayingChant && styles.chantPlayBtnActive]}
                onPress={handleToggleChant}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlayingChant ? 'pause' : 'play'}
                  size={18}
                  color="#ffffff"
                />
                <Text style={styles.chantPlayBtnText}>
                  {isPlayingChant
                    ? (isHi ? 'विराम (Pause)' : 'Pause Chanting')
                    : (isHi ? `पाठ प्रारंभ करें (${targetLoops} बार)` : `Start Chanting (${targetLoops}x)`)}
                </Text>
              </TouchableOpacity>

              {(isPlayingChant || completedLoops > 0) && (
                <TouchableOpacity
                  testID="chant-reset-btn"
                  style={styles.chantResetBtn}
                  onPress={handleResetChant}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color="#71717a" />
                  <Text style={styles.chantResetBtnText}>{isHi ? 'रीसेट' : 'Reset'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reader Controls Bar: Font Size & Header */}
          <View style={styles.readerControlsCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prayerTitle} numberOfLines={1}>
                {isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
              </Text>
              <Text style={styles.prayerAuthor}>
                {isHi
                  ? `${selectedPrayer.authorDevanagari} • ${selectedPrayer.totalVerses} पद`
                  : `${selectedPrayer.author} • ${selectedPrayer.totalVerses} Verses`}
              </Text>
            </View>

            {/* Font Size Buttons */}
            <View style={styles.fontControls}>
              <TouchableOpacity
                testID="font-size-decrease"
                style={[styles.fontSizeBtn, fontSizeOffset === -2 && styles.fontSizeBtnActive]}
                onPress={() => setFontSizeOffset(-2)}
              >
                <Text style={styles.fontSizeText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="font-size-reset"
                style={[styles.fontSizeBtn, fontSizeOffset === 0 && styles.fontSizeBtnActive]}
                onPress={() => setFontSizeOffset(0)}
              >
                <Text style={styles.fontSizeText}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="font-size-increase"
                style={[styles.fontSizeBtn, fontSizeOffset === 3 && styles.fontSizeBtnActive]}
                onPress={() => setFontSizeOffset(3)}
              >
                <Text style={styles.fontSizeText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtitle / Focus Callout */}
          <View style={styles.prayerSubtitleCard}>
            <Text style={styles.prayerSubtitle}>
              {isHi ? selectedPrayer.subtitleDevanagari : selectedPrayer.subtitle}
            </Text>
          </View>

          {/* Verses List */}
          {selectedPrayer.verses.map((verse, index) => {
            const isChantingActive = activeVerseIndex === index;
            return (
              <View
                key={verse.verseNumber}
                style={[styles.verseCard, isChantingActive && styles.verseCardActive]}
              >
                <View style={styles.verseHeaderRow}>
                  <View style={[styles.verseTypeBadge, isChantingActive && styles.verseTypeBadgeActive]}>
                    <Text
                      style={[
                        styles.verseTypeBadgeText,
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
                    style={styles.verseShareBtn}
                    onPress={() =>
                      handleShareVerse(
                        verse.sanskrit,
                        isHi ? verse.hindiMeaning : verse.englishMeaning,
                        verse.verseNumber
                      )
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="share-outline" size={15} color="#71717a" />
                  </TouchableOpacity>
                </View>

              {/* Sanskrit Text */}
              <Text
                style={[
                  styles.sanskritText,
                  { fontSize: 16 + fontSizeOffset, lineHeight: (16 + fontSizeOffset) * 1.6 },
                ]}
              >
                {verse.sanskrit}
              </Text>

              {/* Transliteration for English mode */}
              {!isHi && (
                <Text
                  style={[
                    styles.translitText,
                    { fontSize: 13 + fontSizeOffset, lineHeight: (13 + fontSizeOffset) * 1.5 },
                  ]}
                >
                  {verse.transliteration}
                </Text>
              )}

              {/* Meaning */}
              <View style={styles.meaningBox}>
                <Text style={styles.meaningLabel}>
                  {isHi ? 'भावार्थ:' : 'Spiritual Meaning:'}
                </Text>
                <Text
                  style={[
                    styles.meaningText,
                    { fontSize: 13 + fontSizeOffset, lineHeight: (13 + fontSizeOffset) * 1.5 },
                  ]}
                >
                  {isHi ? verse.hindiMeaning : verse.englishMeaning}
                </Text>
              </View>
            </View>
          );
        })}

          {/* Phala-shruti */}
          <View style={styles.phalaCard}>
            <View style={styles.phalaHeaderRow}>
              <Ionicons name="sparkles" size={16} color={Palette.primary} />
              <Text style={styles.phalaTitle}>
                {isHi ? 'फलश्रुति एवं माहात्म्य:' : 'Divine Fruits & Phala Shruti:'}
              </Text>
            </View>
            <Text style={styles.phalaText}>
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
    paddingVertical: 8,
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
    fontSize: 14,
  },
  prayerPillText: {
    fontSize: 12,
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
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
  },
  prayerAuthor: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  fontControls: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.sm,
    padding: 2,
  },
  fontSizeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  fontSizeBtnActive: {
    backgroundColor: '#ffffff',
  },
  fontSizeText: {
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  soundBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  soundBtn: {
    flex: 1,
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
    fontSize: 16,
  },
  soundBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  verseTypeBadgeActive: {
    backgroundColor: '#fef3c7',
  },
  verseTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chantPlayerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  chantPlayerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    marginTop: 2,
  },
  loopCounterBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  loopCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#c2410c',
  },
  loopSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  loopSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    marginRight: 2,
  },
  loopBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  loopBtnActive: {
    backgroundColor: '#ea580c',
    borderColor: '#c2410c',
  },
  loopBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
  },
  loopBtnTextActive: {
    color: '#ffffff',
  },
  chantActionRow: {
    flexDirection: 'row',
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
    paddingVertical: 11,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  chantResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  chantResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#52525b',
  },
  verseShareBtn: {
    padding: 2,
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
    borderColor: '#f1f5f9',
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.primary,
    marginBottom: 2,
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
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  phalaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  phalaText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350f',
  },
});
