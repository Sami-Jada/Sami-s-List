import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { colors } from '../../theme';

export default function OrdersScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <LanguageToggle />
      <Text style={styles.title}>{t('orders.title')}</Text>
      <Text style={styles.subtitle}>{t('orders.empty')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.heading,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primaryText,
  },
});





