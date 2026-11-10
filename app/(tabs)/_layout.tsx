import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/src/core/i18n/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: Colors[colorScheme].border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isHi ? 'पञ्चाङ्ग' : 'Panchang',
          headerTitle: isHi ? 'दैनिक पञ्चाङ्ग' : 'Daily Panchang',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={String(color || '#d97706')} />
          ),
        }}
      />
      <Tabs.Screen
        name="muhurta"
        options={{
          title: isHi ? 'मुहूर्त' : 'Muhurta',
          headerTitle: isHi ? 'शुभ मुहूर्त शोधक' : 'Shubh Muhurta Finder',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={String(color || '#d97706')} />
          ),
        }}
      />
      <Tabs.Screen
        name="festivals"
        options={{
          title: isHi ? 'व्रत-त्योहार' : 'Festivals',
          headerTitle: isHi ? 'पर्व एवं व्रत पञ्चिका' : 'Festivals & Vrats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} size={22} color={String(color || '#d97706')} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: isHi ? 'स्तोत्र-जप' : 'Prayers',
          headerTitle: isHi ? 'स्तोत्र, चालीसा एवं जप माला' : 'Sacred Prayers & Japa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={String(color || '#d97706')} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: isHi ? 'तीर्थ व सेटिंग्स' : 'More',
          headerTitle: isHi ? 'तीर्थ-मन्दिर एवं सेटिंग्स' : 'Temples & Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={String(color || '#d97706')} />
          ),
        }}
      />
    </Tabs>
  );
}
