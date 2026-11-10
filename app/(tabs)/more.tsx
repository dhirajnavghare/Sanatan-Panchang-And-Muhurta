import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { TEMPLES_DATABASE } from '@/src/core/temples/data';
import { TempleRecord } from '@/src/core/temples/types';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle } from '@/src/core/i18n/formatters';

export default function MoreScreen() {
  const { language, setLanguage, calendarSystem, setCalendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [circuitFilter, setCircuitFilter] = useState<'jyotirlinga' | 'char_dham' | 'pancha_bhoota'>('jyotirlinga');

  const filteredTemples = TEMPLES_DATABASE.filter(
    (t) => t.circuitCategory === circuitFilter || t.secondaryCircuits?.includes(circuitFilter)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Settings Section */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardHeader}>
          {isHi ? '⚙️ ऍप सेटिंग्स एवं प्राथमिकताएं' : '⚙️ App Preferences & Settings'}
        </Text>

        {/* 1. Language Toggle */}
        <View style={styles.settingRow}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.settingTitle}>{isHi ? 'भाषा' : 'Language'}</Text>
            <Text style={styles.settingDesc}>
              {isHi ? 'सम्पूर्ण ऍप की भाषा' : 'Display language'}
            </Text>
          </View>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, language === 'hi' && styles.toggleBtnActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={[styles.toggleText, language === 'hi' && styles.toggleTextActive]}>
                हिन्दी
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, language === 'en' && styles.toggleBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.toggleText, language === 'en' && styles.toggleTextActive]}>
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Regional Calendar System */}
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={{ backgroundColor: 'transparent', flex: 1, marginRight: 8 }}>
            <Text style={styles.settingTitle}>
              {isHi ? 'चान्द्र मास पद्धति' : 'Lunar Calendar System'}
            </Text>
            <Text style={styles.settingDesc}>
              {isHi
                ? 'पूर्णिमान्त (उत्तर भारत) या अमान्त (दक्षिण व पश्चिम भारत)'
                : 'Purnimanta (North) or Amanta (West/South)'}
            </Text>
          </View>

          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, calendarSystem === 'purnimanta' && styles.toggleBtnActive]}
              onPress={() => setCalendarSystem('purnimanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  calendarSystem === 'purnimanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'पूर्णिमान्त' : 'Purnimanta'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, calendarSystem === 'amanta' && styles.toggleBtnActive]}
              onPress={() => setCalendarSystem('amanta')}
            >
              <Text
                style={[
                  styles.toggleText,
                  calendarSystem === 'amanta' && styles.toggleTextActive,
                ]}
              >
                {isHi ? 'अमान्त' : 'Amanta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sacred Temples Directory */}
      <View style={styles.templesSection}>
        <Text style={styles.sectionTitle}>
          {isHi ? '🛕 पवित्र तीर्थ एवं मन्दिर दर्शन' : '🛕 Sacred Pilgrimage Sanctuaries'}
        </Text>

        {/* Circuit Filter Pills */}
        <View style={styles.circuitRow}>
          {[
            { id: 'jyotirlinga', labelHi: '१२ ज्योतिर्लिंग', labelEn: '12 Jyotirlingas' },
            { id: 'char_dham', labelHi: 'चार धाम', labelEn: 'Char Dham' },
            { id: 'pancha_bhoota', labelHi: 'पंचभूत', labelEn: 'Pancha Bhoota' },
          ].map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.circuitPill, circuitFilter === c.id && styles.circuitPillActive]}
              onPress={() => setCircuitFilter(c.id as typeof circuitFilter)}
            >
              <Text
                style={[
                  styles.circuitText,
                  circuitFilter === c.id && styles.circuitTextActive,
                ]}
              >
                {isHi ? c.labelHi : c.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredTemples.map((temple: TempleRecord) => (
          <View key={temple.id} style={styles.templeCard}>
            <View style={styles.templeHeader}>
              <Text style={styles.templeName}>
                {isHi ? temple.nameDevanagari : temple.name}
              </Text>
              <Text style={styles.templeCity}>
                📍 {temple.location.city}, {temple.location.state}
              </Text>
            </View>

            <Text style={styles.templeDeity}>
              {isHi ? 'प्रधान आराध्य:' : 'Primary Deity:'}{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {isHi ? (temple.primaryDeityDevanagari || temple.primaryDeity) : temple.primaryDeity}
              </Text>
            </Text>

            {temple.sacredRiver && (
              <Text style={styles.templeRiver}>
                🌊 {isHi ? 'पवित्र नदी:' : 'Sacred River:'}{' '}
                {cleanBilingualTitle(temple.sacredRiver, isHi)}
              </Text>
            )}

            <Text style={styles.templeSignificance} numberOfLines={2}>
              {temple.significance}
            </Text>

            <View style={styles.darshanBox}>
              <Ionicons name="time" size={13} color="#d97706" />
              <Text style={styles.darshanText}>
                {isHi ? 'दर्शन समय:' : 'Darshan:'} {temple.darshanTimings}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* About & Shastra Foundation */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>sanatan.cc</Text>
        <Text style={styles.aboutSubtitle}>
          {isHi
            ? '१००% मुक्त-स्रोत एवं शास्त्रीय वैदिक खगोल विज्ञान (CC0 1.0 Universal)'
            : '100% Free & Open-Source Vedic Ephemeris (CC0 1.0 Universal)'}
        </Text>
        <Text style={styles.aboutDesc}>
          {isHi
            ? 'नासा JPL VSOP87 एवं Chapront ELP-2000 खगोलीय सिद्धांतों तथा मुहूर्तचिन्तामणि व निर्णयसिन्धु शास्त्रीय ग्रन्थों पर आधारित पूर्णतः ऑफलाइन गणना।'
            : 'Powered by NASA JPL VSOP87, Chapront ELP-2000 theories, and classical Muhurta Chintamani scriptures. Operates 100% offline with zero tabular approximations.'}
        </Text>

        <TouchableOpacity
          style={styles.githubBtn}
          onPress={() => Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc')}
        >
          <Ionicons name="logo-github" size={16} color="#ffffff" />
          <Text style={styles.githubBtnText}>GitHub Repository</Text>
        </TouchableOpacity>
      </View>
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
  settingsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#18181b',
  },
  settingDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#d97706',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#71717a',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  templesSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 10,
  },
  circuitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  circuitPill: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  circuitPillActive: {
    backgroundColor: '#d97706',
  },
  circuitText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#71717a',
  },
  circuitTextActive: {
    color: '#ffffff',
  },
  templeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  templeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  templeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    flex: 1,
  },
  templeCity: {
    fontSize: 11,
    color: '#71717a',
  },
  templeDeity: {
    fontSize: 12,
    color: '#3f3f46',
    marginTop: 2,
  },
  templeRiver: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
  },
  templeSignificance: {
    fontSize: 12,
    color: '#52525b',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 6,
  },
  darshanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  darshanText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
  },
  aboutCard: {
    backgroundColor: '#16173d',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  aboutSubtitle: {
    fontSize: 11,
    color: '#c7d2fe',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: 11,
    color: '#a5b4fc',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  githubBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
