import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, View, Text, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { Radius, Spacing } from '@/constants/Colors';
import { COMFORT_TOUCH_TARGET, getAppTheme, Typography } from '@/src/utils/theme';
import { AppButton } from '@/src/components/ui/AppButton';

export default function AboutModalScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const insets = useSafeAreaInsets();

  const pillars = [
    {
      icon: '🔭',
      title: isHi ? 'आपके शहर के अनुसार सटीक गणना' : 'Calculated Fresh for Your City',
      desc: isHi
        ? 'यह ऐप आपके चुने शहर या जीपीएस स्थान के अनुसार सूर्योदय, सूर्यास्त, तिथि और मुहूर्त की वास्तविक खगोलीय गणना (VSOP87 व लाहिरी अयनांश) तुरंत करता है।'
        : 'Instead of fixed tables, this app calculates exact sunrise, sunset, Tithi, and Muhurta timings for your location in real time (using NASA JPL VSOP87, ELP-2000, and Lahiri Ayanamsa).',
    },
    {
      icon: '📜',
      title: isHi ? 'प्रामाणिक शास्त्रीय नियम' : 'Authentic Traditional Rules',
      desc: isHi
        ? 'मुहूर्त-चिन्तामणि, निर्णयसिन्धु व धर्मसिन्धु जैसे प्रामाणिक ग्रन्थों के अनुसार भद्रा, पञ्चक, राहु काल और शुभ योगों की जाँच।'
        : 'Follows classical scriptures such as Muhurta Chintamani, Nirnaya Sindhu, and Dharma Sindhu for Bhadra, Panchaka, Rahu Kaal, and auspicious Yogas.',
    },
    {
      icon: '🔒',
      title: isHi ? '१००% ऑफलाइन व पूर्ण गोपनीयता' : '100% Offline & Private',
      desc: isHi
        ? 'सारी गणना आपके फोन में ही होती है। न कोई लॉगिन, न कोई विज्ञापन, न ही आपकी व्यक्तिगत जानकारी बाहर भेजी जाती है।'
        : 'Everything calculates right on your phone in under 1 ms. No internet required, no ads, no tracking, and no personal data collection.',
    },
    {
      icon: '🌐',
      title: isHi ? 'सबके लिए १००% निःशुल्क' : '100% Free for Everyone',
      desc: isHi
        ? 'यह सेवा बिना किसी शुल्क, विज्ञापन या पे-वॉल के सभी भक्तों, विद्यार्थियों व परिवारों के लिए सदैव निःशुल्क है।'
        : 'Completely free with no ads, no subscriptions, and no paywalls — built as a public dharma resource for every age group.',
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: isHi ? 'sanatan.cc के बारे में' : 'About sanatan.cc',
          headerBackTitle: isHi ? 'वापस' : 'Back',
        }}
      />
      <ScrollView
        testID="about-modal-scroll"
        style={[styles.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(48, insets.bottom + 24) },
        ]}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>ॐ sanatan.cc</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.successBg, borderColor: theme.successBorder }]}>
            <Text style={[styles.badgeText, { color: theme.successText }]}>
              {isHi ? '१००% निःशुल्क • ऑफ़लाइन' : '100% Free • Offline'}
            </Text>
          </View>
        </View>

        <Text style={[styles.mainTitle, { color: theme.text }]}>
          {isHi
            ? 'सरल भाषा और शुद्ध विज्ञान के साथ वैदिक पञ्चाङ्ग'
            : 'Vedic Wisdom Made Simple and Accurate'}
        </Text>

        <Text style={[styles.leadPara, { color: theme.textSecondary }]}>
          {isHi
            ? 'sanatan.cc एक गैर-व्यावसायिक, निःशुल्क प्रकल्प है जो हर उम्र के उपयोगकर्ताओं को दैनिक पञ्चाङ्ग, शुभ मुहूर्त, पर्व-व्रत और स्तोत्र सहजता से उपलब्ध कराता है।'
            : 'sanatan.cc is a free, ad-free initiative helping people of every age easily check daily Panchang, auspicious Muhurtas, festivals, and sacred prayers.'}
        </Text>

        {/* 4 Core Pillars */}
        <View style={styles.pillarsContainer}>
          {pillars.map((pillar) => (
            <View
              key={pillar.title}
              style={[styles.pillarCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={styles.pillarIcon}>{pillar.icon}</Text>
              <Text style={[styles.pillarHeading, { color: theme.text }]}>{pillar.title}</Text>
              <Text style={[styles.pillarDesc, { color: theme.textSecondary }]}>{pillar.desc}</Text>
            </View>
          ))}
        </View>

        {/* External Action Links */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            testID="about-github-link"
            accessibilityRole="link"
            accessibilityLabel={isHi ? 'GitHub प्रोजेक्ट पेज खोलें' : 'Open GitHub Repository'}
            style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]}
            onPress={() => {
              Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc').catch(() => {});
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-github" size={20} color="#ffffff" />
            <Text style={styles.actionBtnPrimaryText}>
              {isHi ? 'GitHub सोर्स कोड देखें' : 'GitHub Repository'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="about-website-link"
            accessibilityRole="link"
            accessibilityLabel={isHi ? 'sanatan.cc वेबसाइट खोलें' : 'Open sanatan.cc Web Portal'}
            style={[styles.actionBtnSecondary, { backgroundColor: theme.card, borderColor: theme.primaryBorder }]}
            onPress={() => {
              Linking.openURL('https://sanatan.cc').catch(() => {});
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="globe-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionBtnSecondaryText, { color: theme.primary }]}>
              {isHi ? 'sanatan.cc वेबसाइट खोलें' : 'sanatan.cc Web Portal'}
            </Text>
          </TouchableOpacity>

          <AppButton
            testID="about-close-btn"
            variant="outline"
            iconName="arrow-back"
            label={isHi ? 'वापस लौटें' : 'Back to App'}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            }}
          />
        </View>

        <Text style={[styles.footerNote, { color: theme.textMuted }]}>
          {isHi
            ? 'सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥'
            : 'May all beings be happy. May all beings be free from illness. May all see what is auspicious. May no one suffer.'}
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  mainTitle: {
    ...Typography.screenTitle,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 12,
  },
  leadPara: {
    ...Typography.body,
    marginBottom: 22,
  },
  pillarsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  pillarCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 16,
  },
  pillarIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  pillarHeading: {
    ...Typography.cardTitle,
    marginBottom: 6,
  },
  pillarDesc: {
    ...Typography.bodyMuted,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: COMFORT_TOUCH_TARGET,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    gap: 8,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    ...Typography.button,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: COMFORT_TOUCH_TARGET,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    gap: 8,
  },
  actionBtnSecondaryText: {
    ...Typography.button,
  },
  footerNote: {
    ...Typography.bodyMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
