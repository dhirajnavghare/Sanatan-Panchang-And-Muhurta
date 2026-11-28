import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { getAppTheme, Typography } from '@/src/utils/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = colorScheme === 'dark';
  const theme = getAppTheme(isDark);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10);

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarAllowFontScaling: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: theme.headerBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          minHeight: Platform.OS === 'ios' ? 62 + bottomInset : 64 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 6,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        headerStyle: {
          backgroundColor: theme.headerBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderSubtle,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          ...Typography.sectionHeading,
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isHi ? 'दिनचर्या' : 'Dinacharya',
          headerShown: false, // Custom rich header on Home screen
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'today' : 'today-outline'}
              size={23}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="muhurta"
        options={{
          title: isHi ? 'मुहूर्त' : 'Muhurta',
          headerTitle: isHi ? 'शुभ मुहूर्त खोजें' : 'Find Auspicious Times',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="festivals"
        options={{
          title: isHi ? 'पर्व-व्रत' : 'Festivals',
          headerTitle: isHi ? 'पर्व एवं व्रत कैलेंडर' : 'Festivals & Fasting Days',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: isHi ? 'स्तोत्र-जप' : 'Prayers',
          headerTitle: isHi ? 'प्रार्थना, स्तोत्र व जप माला' : 'Prayers & Japa Mala',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: isHi ? 'तीर्थ' : 'More',
          headerTitle: isHi ? 'तीर्थ, देवता व व्रत कथा' : 'Temples, Deities & Stories',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: isHi ? 'प्रोजेक्ट' : 'Project',
          headerTitle: isHi ? 'प्रोजेक्ट जानकारी व सुझाव' : 'Updates & Feedback',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isHi ? 'सेटिंग्स' : 'Settings',
          headerTitle: isHi ? 'सेटिंग्स एवं भाषा' : 'Settings & Preferences',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={focused ? theme.primary : theme.textSecondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    paddingHorizontal: 1,
    paddingVertical: 2,
    minWidth: 0,
    minHeight: 50,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
});
