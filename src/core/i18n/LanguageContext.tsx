import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, Translations, TRANSLATIONS } from './translations';

export type CalendarSystem = 'purnimanta' | 'amanta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  calendarSystem: CalendarSystem;
  setCalendarSystem: (sys: CalendarSystem) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('hi'); // Default Hindi for Indian users, 1-click toggle to EN
  const [calendarSystem, setCalendarSystemState] = useState<CalendarSystem>('purnimanta');

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('sanatan_language');
        if (savedLang === 'en' || savedLang === 'hi') {
          setLanguageState(savedLang as Language);
        }
        const savedSys = await AsyncStorage.getItem('sanatan_calendar_system');
        if (savedSys === 'purnimanta' || savedSys === 'amanta') {
          setCalendarSystemState(savedSys as CalendarSystem);
        }
      } catch {}
    })();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem('sanatan_language', lang).catch(() => {});
  };

  const setCalendarSystem = (sys: CalendarSystem) => {
    setCalendarSystemState(sys);
    AsyncStorage.setItem('sanatan_calendar_system', sys).catch(() => {});
  };

  const t = (key: keyof Translations): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        calendarSystem,
        setCalendarSystem,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
