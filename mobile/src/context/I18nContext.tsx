import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

// Import I18n using ES6 syntax (Metro config now supports .mjs files)
import { I18n } from 'i18n-js';

// Initialize i18n instance
const i18n = new I18n({
  en,
  ar,
});

i18n.defaultLocale = 'ar';
i18n.enableFallback = true;
// Default to Arabic unless user has explicitly chosen another language
i18n.locale = 'ar';

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: any) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(i18n.locale);

  // Load saved language preference on mount
  useEffect(() => {
    const loadPreferredLanguage = async () => {
      try {
        const savedLocale = await SecureStore.getItemAsync('preferred_language');
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar')) {
          i18n.locale = savedLocale;
          setLocaleState(savedLocale);
        }
      } catch {
        // Ignore errors and keep default 'ar'
      }
    };

    loadPreferredLanguage();
  }, []);

  const setLocale = (newLocale: string) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);
    // Persist preference so it applies across the whole app
    SecureStore.setItemAsync('preferred_language', newLocale).catch(() => {
      // Non-critical if persistence fails
    });
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





