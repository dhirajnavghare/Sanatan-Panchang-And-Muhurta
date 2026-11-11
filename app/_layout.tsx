import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useColorScheme } from '@/components/useColorScheme';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { runStartupDiagnostics } from '@/src/services/startupDiagnostics';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent splash screen auto-hiding with safety catch
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...Ionicons.font,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      setIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  // Safety fallback: ensure splash screen hides and app renders within 800ms even if fonts stall
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Automated System Health & Invariant Verification at Startup
  useEffect(() => {
    runStartupDiagnostics().catch((err) => {
      console.warn('[Sanatan Diagnostics] Diagnostics run failure:', err);
    });
  }, []);

  if (!isReady && !loaded && !error) {
    return null;
  }

  return (
    <LanguageProvider>
      <RootLayoutNav />
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
