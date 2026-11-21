import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/src/core/i18n/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const isDark = colorScheme === 'dark';

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: isDark ? '#a1a1aa' : '#71717a',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#16161c' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#27272a' : '#e4e4e7',
          height: Platform.OS === 'ios' ? 56 + bottomInset : 58 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        headerStyle: {
          backgroundColor: isDark ? '#16161c' : '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#27272a' : '#f4f4f5',
        },
        headerTintColor: Colors[colorScheme].text,
        headerTitleStyle: {
          fontWeight: '700',
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
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="muhurta"
        options={{
          title: isHi ? 'मुहूर्त' : 'Muhurta',
          headerTitle: isHi ? 'शुभ मुहूर्त शोधक' : 'Shubh Muhurta Finder',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={23}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="festivals"
        options={{
          title: isHi ? 'पर्व-व्रत' : 'Festivals',
          headerTitle: isHi ? 'पर्व एवं व्रत पञ्चिका' : 'Festivals & Vrats',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={23}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: isHi ? 'स्तोत्र-जप' : 'Prayers',
          headerTitle: isHi ? 'स्तोत्र, मन्त्र एवं जप माला' : 'Sacred Prayers & Japa',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={23}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: isHi ? 'तीर्थ' : 'More',
          headerTitle: isHi ? 'तीर्थ, देव एवं व्रत कथा' : 'Temples, Deities & Kathas',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={22}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: isHi ? 'प्रोजेक्ट' : 'Project',
          headerTitle: isHi ? 'प्रोजेक्ट हब एवं प्रतिक्रिया' : 'Project Hub & Feedback',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isHi ? 'सेटिंग्स' : 'Settings',
          headerTitle: isHi ? 'ऍप सेटिंग्स एवं प्राथमिकताएं' : 'App Settings & Preferences',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={22}
              color={focused ? Palette.primary : (isDark ? '#a1a1aa' : '#71717a')}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
