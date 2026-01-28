import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../context/I18nContext';

interface LanguageToggleProps {
  compact?: boolean;
}

export default function LanguageToggle({ compact }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();

  const handleSetArabic = () => setLocale('ar');
  const handleSetEnglish = () => setLocale('en');

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <TouchableOpacity
        style={[
          styles.button,
          locale === 'ar' && styles.buttonActive,
          compact && styles.buttonCompact,
        ]}
        onPress={handleSetArabic}
      >
        <Text
          style={[
            styles.buttonText,
            locale === 'ar' && styles.buttonTextActive,
            compact && styles.buttonTextCompact,
          ]}
        >
          عربي
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          locale === 'en' && styles.buttonActive,
          compact && styles.buttonCompact,
        ]}
        onPress={handleSetEnglish}
      >
        <Text
          style={[
            styles.buttonText,
            locale === 'en' && styles.buttonTextActive,
            compact && styles.buttonTextCompact,
          ]}
        >
          English
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    padding: 2,
    marginBottom: 12,
  },
  compactContainer: {
    marginBottom: 0,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  buttonCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
  buttonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

