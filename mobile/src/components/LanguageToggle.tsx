import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../context/I18nContext';
import { colors } from '../theme';

interface LanguageToggleProps {
  compact?: boolean;
}

export default function LanguageToggle({ compact }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();

  const isEnglish = locale === 'en';
  const switchToOther = () => setLocale(isEnglish ? 'ar' : 'en');

  return (
    <View style={[styles.outerWrapper, { paddingTop: insets.top }]} pointerEvents="box-none">
      <View style={[styles.container, compact && styles.compactContainer]}>
        <TouchableOpacity
          style={[styles.button, compact && styles.buttonCompact]}
          onPress={switchToOther}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>
            {isEnglish ? 'العربي' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingRight: 16,
  },
  compactContainer: {
    marginBottom: 0,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  buttonCompact: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  buttonText: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '500',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
});

