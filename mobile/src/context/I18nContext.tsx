import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

// Import I18n using ES6 syntax (Metro config now supports .mjs files)
import { I18n } from 'i18n-js';

// Initialize i18n instance
const i18n = new I18n({
  en,
  ar,
});

i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Get locale using expo-localization API
try {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    i18n.locale = locales[0].languageCode || locales[0].languageTag?.split('-')[0] || 'en';
  }
} catch {
  // Fallback to default locale if detection fails
  i18n.locale = 'en';
}

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: any) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(i18n.locale);

  const setLocale = (newLocale: string) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: any) => {
    return i18n.t(key, params);
  };

  const isRTL = locale === 'ar';

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}





