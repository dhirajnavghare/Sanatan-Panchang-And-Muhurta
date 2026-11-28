import React from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, View as RNView, Text as RNText } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import { getAppTheme, COMFORT_TOUCH_TARGET, Typography } from '@/src/utils/theme';

export default function NotFoundScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  return (
    <>
      <Stack.Screen options={{ title: isHi ? 'पृष्ठ नहीं मिला' : 'Page Not Found', headerBackTitle: isHi ? 'वापस' : 'Back' }} />
      <RNView style={[styles.container, { backgroundColor: theme.bg }]} testID="not-found-screen">
        <RNView
          style={[
            styles.iconCircle,
            { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder },
          ]}
        >
          <RNText style={styles.symbolIcon}>🕉️</RNText>
        </RNView>

        <RNText style={[styles.title, { color: theme.text }]}>
          {isHi ? 'यह पृष्ठ अभी उपलब्ध नहीं है' : 'We could not find this page'}
        </RNText>

        <RNText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {isHi
            ? 'आप जिस पृष्ठ को खोलना चाहते हैं वह हटाया या बदला जा चुका है। नीचे दिए बटन से मुख्य स्क्रीन पर लौटें।'
            : 'The page you are looking for may have moved. Tap the button below to return to the Home screen.'}
        </RNText>

        <TouchableOpacity
          testID="not-found-home-btn"
          accessibilityRole="button"
          accessibilityLabel={isHi ? 'मुख्य पृष्ठ पर लौटें' : 'Return to Home'}
          style={[styles.homeBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={20} color="#ffffff" />
          <RNText style={styles.homeBtnText}>
            {isHi ? 'मुख्य पृष्ठ पर लौटें' : 'Go to Home Screen'}
          </RNText>
        </TouchableOpacity>
      </RNView>
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
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Palette.primaryLight,
    borderWidth: 2,
    borderColor: Palette.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  symbolIcon: {
    fontSize: 36,
  },
  title: {
    ...Typography.screenTitle,
    color: '#18181b',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textSecondaryLight,
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: Spacing.xxl,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: COMFORT_TOUCH_TARGET,
    gap: Spacing.sm,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  homeBtnText: {
    color: '#ffffff',
    ...Typography.button,
  },
});
