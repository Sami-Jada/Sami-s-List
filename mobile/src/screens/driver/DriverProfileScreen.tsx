import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { colors } from '../../theme';

export default function DriverProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <LanguageToggle />
      <Text style={styles.title}>{t('driver.profileTitle')}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>{t('profile.phone')}</Text>
        <Text style={styles.value}>{user?.phone}</Text>

        {user?.email && (
          <>
            <Text style={styles.label}>{t('profile.email')}</Text>
            <Text style={styles.value}>{user.email}</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.heading,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.highlight,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: colors.heading,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 5,
    color: colors.primaryText,
  },
  logoutButton: {
    backgroundColor: colors.destructive,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

