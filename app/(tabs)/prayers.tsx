import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PRAYERS_DATA } from '@/src/core/prayers/data';
import { PrayerRecord } from '@/src/core/prayers/types';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';

export default function PrayersScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRecord>(PRAYERS_DATA[0]);
  const [japaCount, setJapaCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(
    selectedPrayer.recommendedCounts[0] || 1
  );
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const prayerIcons: Record<string, string> = {
    'gayatri': '☀️',
    'maha-mrityunjaya': '🔱',
    'hanuman-chalisa': '🚩',
    'sankat-mochan': '🪔',
    'shiva-tandava': '🌀',
    'vishnu-sahasranama': '📿',
  };

  const handleIncrementJapa = () => {
    setJapaCount((prev) => prev + 1);
  };

  const handleResetJapa = () => {
    setJapaCount(0);
  };

  const handlePrayerSelect = (p: PrayerRecord) => {
    if (p.id === selectedPrayer.id) return;
    setIsCalculating(true);
    setTimeout(() => {
      setSelectedPrayer(p);
      setJapaCount(0);
      setTargetCount(p.recommendedCounts[0] || 1);
      setIsCalculating(false);
    }, 100);
  };

  const handleShareVerse = async (sanskrit: string, meaning: string, index: number) => {
    try {
      await Share.share({
        message: `${selectedPrayer.title} (#${index})\n\n${sanskrit}\n\n[अर्थ]: ${meaning}\n\n— सनातन पञ्चाङ्ग (sanatan.cc)`,
      });
    } catch {
      // ignore
    }
  };

  const progressPercent = Math.min(100, Math.round((japaCount / targetCount) * 100));

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
          {/* Tactile Sacred Japa Mala Counter Card */}
          <View style={styles.japaCard}>
            <View style={styles.japaTopHeader}>
              <View>
                <Text style={styles.japaLabel}>
                  {isHi ? '📿 दैनिक जप सङ्कल्प माला' : '📿 Sacred Japa Mala Counter'}
                </Text>
                <Text style={styles.japaTargetSub}>
                  {isHi ? `लक्ष्य: ${targetCount} आवृत्ति` : `Target: ${targetCount} Chants`}
                </Text>
              </View>

              {/* Target Quick Selectors */}
              <View style={styles.targetPillsRow}>
                {[1, 11, 21, 108].map((cnt) => (
                  <TouchableOpacity
                    key={cnt}
                    style={[
                      styles.targetChip,
                      targetCount === cnt && styles.targetChipActive,
                    ]}
                    onPress={() => setTargetCount(cnt)}
                  >
                    <Text
                      style={[
                        styles.targetChipText,
                        targetCount === cnt && styles.targetChipTextActive,
                      ]}
                    >
                      {cnt === 108 ? (isHi ? '१०८ माला' : '108 Mala') : cnt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Central Tap Area with Bead Visual */}
            <View style={styles.centralBeadArea}>
              <TouchableOpacity
                style={styles.counterBeadCircle}
                onPress={handleIncrementJapa}
                activeOpacity={0.85}
              >
                <Text style={styles.counterLargeNumber}>{japaCount}</Text>
                <Text style={styles.counterTapHint}>
                  {isHi ? '+१ जप' : '+1 CHANT'}
                </Text>
              </TouchableOpacity>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
              </View>

              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabelText}>
                  {japaCount} / {targetCount} ({progressPercent}%)
                </Text>
                {japaCount > 0 && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleResetJapa}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="refresh" size={14} color="#71717a" />
                    <Text style={styles.resetBtnText}>{isHi ? 'पुनः प्रारम्भ' : 'Reset'}</Text>
                  </TouchableOpacity>
                )}
              </View>
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
                style={[styles.fontSizeBtn, fontSizeOffset === -2 && styles.fontSizeBtnActive]}
                onPress={() => setFontSizeOffset(-2)}
              >
                <Text style={styles.fontSizeText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fontSizeBtn, fontSizeOffset === 0 && styles.fontSizeBtnActive]}
                onPress={() => setFontSizeOffset(0)}
              >
                <Text style={styles.fontSizeText}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
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
          {selectedPrayer.verses.map((verse) => (
            <View key={verse.verseNumber} style={styles.verseCard}>
              <View style={styles.verseHeaderRow}>
                <View style={styles.verseTypeBadge}>
                  <Text style={styles.verseTypeBadgeText}>
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
          ))}

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
  verseTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
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
