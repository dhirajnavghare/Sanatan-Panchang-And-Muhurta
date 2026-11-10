import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { PRAYERS_DATA } from '@/src/core/prayers/data';
import { PrayerRecord } from '@/src/core/prayers/types';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function PrayersScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [selectedPrayer, setSelectedPrayer] = useState<PrayerRecord>(PRAYERS_DATA[0]);
  const [japaCount, setJapaCount] = useState<number>(0);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const targetCount = selectedPrayer.recommendedCounts[0] || 1;

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
      setIsCalculating(false);
    }, 120);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Horizontal Prayer Selector */}
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRAYERS_DATA.map((p) => {
            const isSelected = p.id === selectedPrayer.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.prayerPill, isSelected && styles.prayerPillSelected]}
                onPress={() => handlePrayerSelect(p)}
              >
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
          {/* Japa Counter Card */}
      <View style={styles.japaCard}>
        <View style={styles.japaTop}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.japaLabel}>
              {isHi ? '📿 जप सङ्कल्प गणक' : '📿 Japa Mala Repetition Counter'}
            </Text>
            <Text style={styles.japaCount}>
              {japaCount} / {targetCount} {isHi ? 'पाठ' : 'Chants'}
            </Text>
          </View>

          <View style={styles.japaButtons}>
            <TouchableOpacity style={styles.incrementBtn} onPress={handleIncrementJapa}>
              <Text style={styles.incrementBtnText}>+1 {isHi ? 'पाठ' : 'Chant'}</Text>
            </TouchableOpacity>

            {japaCount > 0 && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetJapa}>
                <Ionicons name="refresh" size={16} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Font size toggles */}
        <View style={styles.fontControls}>
          <Text style={styles.fontLabel}>{isHi ? 'अक्षर आकार:' : 'Font Size:'}</Text>
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

      {/* Prayer Details Header */}
      <View style={styles.prayerHeader}>
        <Text style={styles.prayerTitle}>
          {isHi ? selectedPrayer.titleDevanagari : selectedPrayer.title}
        </Text>
        <Text style={styles.prayerAuthor}>
          {isHi
            ? `${selectedPrayer.authorDevanagari} • ${selectedPrayer.totalVerses} पद`
            : `${selectedPrayer.author} • ${selectedPrayer.totalVerses} Verses`}
        </Text>
        <Text style={styles.prayerSubtitle}>
          {isHi ? selectedPrayer.subtitleDevanagari : selectedPrayer.subtitle}
        </Text>
      </View>

      {/* Verses List */}
      {selectedPrayer.verses.map((verse) => (
        <View key={verse.verseNumber} style={styles.verseCard}>
          <Text style={styles.verseIndex}>
            {isHi
              ? (verse.verseType === 'doha' ? 'दोहा' : verse.verseType === 'chaupai' ? 'चौपाई' : 'श्लोक')
              : verse.verseType.toUpperCase()}{' '}
            #{verse.verseNumber}
          </Text>

          {/* Sanskrit Text */}
          <Text style={[styles.sanskritText, { fontSize: 16 + fontSizeOffset }]}>
            {verse.sanskrit}
          </Text>

          {/* Transliteration for English mode */}
          {!isHi && (
            <Text style={[styles.translitText, { fontSize: 14 + fontSizeOffset }]}>
              {verse.transliteration}
            </Text>
          )}

          {/* Meaning */}
          <View style={styles.meaningBox}>
            <Text style={styles.meaningLabel}>
              {isHi ? 'भावार्थ:' : 'Spiritual Meaning:'}
            </Text>
            <Text style={styles.meaningText}>
              {isHi ? verse.hindiMeaning : verse.englishMeaning}
            </Text>
          </View>
        </View>
      ))}

      {/* Phala-shruti */}
      <View style={styles.phalaCard}>
        <Text style={styles.phalaTitle}>
          {isHi ? 'फलश्रुति एवं माहात्म्य:' : 'Divine Fruits & Phala Shruti:'}
        </Text>
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
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  selectorContainer: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  prayerPill: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  prayerPillSelected: {
    backgroundColor: '#d97706',
  },
  prayerPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  prayerPillTextSelected: {
    color: '#ffffff',
  },
  japaCard: {
    backgroundColor: '#16173d',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  japaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  japaLabel: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
  },
  japaCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  japaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  incrementBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  incrementBtnText: {
    color: '#1e1b4b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 12,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  fontLabel: {
    color: '#c7d2fe',
    fontSize: 11,
  },
  fontSizeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  fontSizeBtnActive: {
    backgroundColor: '#f59e0b',
  },
  fontSizeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  prayerHeader: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  prayerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#18181b',
  },
  prayerAuthor: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
    marginTop: 2,
  },
  prayerSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  verseCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  verseIndex: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sanskritText: {
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 28,
  },
  translitText: {
    fontStyle: 'italic',
    color: '#d97706',
    marginTop: 6,
    lineHeight: 22,
  },
  meaningBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  meaningLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  meaningText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
  },
  phalaCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
  },
  phalaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  phalaText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
});
