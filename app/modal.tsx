import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';

export default function AboutModalScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Header Badge */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ॐ sanatan.cc</Text>
        </View>
        <View style={[styles.badge, styles.badgeGold]}>
          <Text style={[styles.badgeText, styles.badgeGoldText]}>100% Free</Text>
        </View>
      </View>

      <Text style={styles.mainTitle}>
        {isHi
          ? 'आधुनिक यथार्थता के साथ वैदिक ज्ञान का संरक्षण'
          : 'Preserving Vedic Wisdom Through Modern Precision'}
      </Text>

      <Text style={styles.leadPara}>
        {isHi
          ? 'sanatan.cc एक गैर-व्यावसायिक, १००% निःशुल्क प्रकल्प है, जो सनातन हिन्दू धर्म के प्रामाणिक आध्यात्मिक ग्रन्थों, दार्शनिक सिद्धान्तों तथा उच्च-सटीक खगोलीय वैदिक पञ्चाङ्ग गणनाओं को विश्वभर में जन-जन तक पहुँचाने हेतु समर्पित है।'
          : 'sanatan.cc is a non-commercial, 100% free initiative dedicated to preserving and sharing authentic Hindu Dharma spiritual texts, philosophical treatises, and world-class mathematical Vedic ephemeris applications.'}
      </Text>

      {/* 4 Core Pillars */}
      <View style={styles.pillarsContainer}>
        {/* Pillar 1 */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarIcon}>🔭</Text>
          <Text style={styles.pillarHeading}>
            {isHi ? 'शुद्ध खगोलशास्त्र, शून्य सारिणी हार्डकोडिंग' : 'Pure Ephemeris, Zero Hardcoding'}
          </Text>
          <Text style={styles.pillarDesc}>
            {isHi
              ? 'स्थिर सारिणी-आधारित ऍप्स के विपरीत, हमारा पञ्चाङ्ग एवं मुहूर्त तन्त्र आधुनिक खगोलयांत्रिकी (NASA JPL VSOP87 सौर सिद्धान्त, Chapront ELP-2000 चन्द्र क्षोभ सिद्धान्त तथा लाहिरी चित्रा पक्ष अयनांश) द्वारा वास्तविक समय में ग्रहों की सटीक स्थिति की गणना करता है। प्रत्येक अंग संक्रमण सेकंड की सूक्ष्मता से निर्धारित होता है।'
              : 'Unlike static table lookup apps, our Panchang and Muhurta engines calculate planetary and solilunar positions in real-time using modern celestial mechanics (VSOP87 planetary theory, Chapront ELP-2000 lunar theory, and Lahiri Chitra Paksha Ayanamsa). Every limb transition is accurate to the astronomical second for any coordinates on Earth.'}
          </Text>
        </View>

        {/* Pillar 2 */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarIcon}>📜</Text>
          <Text style={styles.pillarHeading}>
            {isHi ? 'प्रामाणिक शास्त्रीय ग्रन्थ एवं परम्परा' : 'Authentic Scriptural Tradition'}
          </Text>
          <Text style={styles.pillarDesc}>
            {isHi
              ? 'मुहूर्त-चिन्तामणि, निर्णयसिन्धु, धर्मसिन्धु तथा पराशर स्मृति के प्रामाणिक नियमों के अनुसार भद्रा दोष, रिक्ता तिथि, एवं विशेष शुभ योगों (सर्वार्थ सिद्धि, अमृत सिद्धि, पुष्य योग) का सूक्ष्म विवेचन। कोई काल्पनिक अथवा मनगढ़ंत नियम नहीं।'
              : 'Strict adherence to foundational Shastric treatises including Muhurta Chintamani, Nirnaya Sindhu, Dharma Sindhu, and Parashara Smriti. Rigorous evaluation of Bhadra (Vishti), Rikta Tithis, Panchaka classifications, and auspicious Yogas without modern commercial distortion.'}
          </Text>
        </View>

        {/* Pillar 3 */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarIcon}>🔒</Text>
          <Text style={styles.pillarHeading}>
            {isHi ? '१००% ऑफलाइन व गोपनीयता' : '100% Offline & Privacy First'}
          </Text>
          <Text style={styles.pillarDesc}>
            {isHi
              ? 'सम्पूर्ण गणना आपके उपकरण (मोबाइल) पर ही निष्पादित होती है। न कोई सर्वर अनुरोध, न कोई ट्रैकर, न कोई विज्ञापन, और न ही किसी व्यक्तिगत डेटा का संचय।'
              : 'All ephemeris math runs directly on your device CPU in < 1ms. Zero server pings, zero telemetry, zero analytics, zero ads, and zero personal data collection.'}
          </Text>
        </View>

        {/* Pillar 4 */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarIcon}>🌐</Text>
          <Text style={styles.pillarHeading}>
            {isHi ? '१००% निःशुल्क सार्वजनिक सेवा' : '100% Free for Everyone'}
          </Text>
          <Text style={styles.pillarDesc}>
            {isHi
              ? 'यह सम्पूर्ण प्रकल्प ज्ञान की सार्वजनिक धरोहर के रूप में बिना किसी प्रतिबन्ध के समर्पित है। कोई भी व्यक्ति, शोधकर्ता अथवा संस्था इसे निःशुल्क उपयोग, अध्ययन एवं संवर्धित करने हेतु स्वतंत्र है।'
              : 'This app is completely free with no ads, no in-app purchases, and no paywalls. Anyone is free to use it for personal, educational, or spiritual purposes without any restrictions.'}
          </Text>
        </View>
      </View>

      {/* External Action Links */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc')}
        >
          <Ionicons name="logo-github" size={18} color="#ffffff" />
          <Text style={styles.actionBtnPrimaryText}>GitHub Repository</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => Linking.openURL('https://sanatan.cc')}
        >
          <Ionicons name="globe-outline" size={18} color="#d97706" />
          <Text style={styles.actionBtnSecondaryText}>sanatan.cc Web Portal</Text>
        </TouchableOpacity>

      </View>

      <Text style={styles.footerNote}>
        {isHi
          ? 'सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥'
          : 'May all beings be happy. May all beings be free from illness. May all see what is auspicious. May no one suffer.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0e26',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  badge: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeGold: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeGoldText: {
    color: '#34d399',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fafafa',
    lineHeight: 30,
    marginBottom: 12,
  },
  leadPara: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 22,
    marginBottom: 24,
  },
  pillarsContainer: {
    gap: 16,
    marginBottom: 28,
    backgroundColor: 'transparent',
  },
  pillarCard: {
    backgroundColor: '#16173d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  pillarIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pillarHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 6,
  },
  pillarDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 28,
    backgroundColor: 'transparent',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16173d',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnSecondaryText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#71717a',
    lineHeight: 18,
  },
});
