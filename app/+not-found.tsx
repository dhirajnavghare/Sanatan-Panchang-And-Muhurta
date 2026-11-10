import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { Palette, Radius, Spacing } from '@/constants/Colors';

export default function NotFoundScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <>
      <Stack.Screen options={{ title: isHi ? 'पृष्ठ अनुपलब्ध' : 'Page Not Found', headerBackTitle: isHi ? 'वापस' : 'Back' }} />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.symbolIcon}>🕉️</Text>
        </View>

        <Text style={styles.title}>
          {isHi ? 'यह पृष्ठ उपलब्ध नहीं है' : "This page doesn't exist"}
        </Text>

        <Text style={styles.subtitle}>
          {isHi
            ? 'जो पृष्ठ आप खोज रहे हैं वह उपलब्ध नहीं है अथवा स्थानांतरित हो चुका है।'
            : 'The sacred page you are looking for does not exist or may have moved.'}
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={18} color="#ffffff" />
          <Text style={styles.homeBtnText}>
            {isHi ? 'मुख्य पृष्ठ पर लौटें' : 'Return to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#f8f8fa',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.primaryLight,
    borderWidth: 2,
    borderColor: Palette.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  symbolIcon: {
    fontSize: 34,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#18181b',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.textMutedLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: Spacing.xxl,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.textLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
