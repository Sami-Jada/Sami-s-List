import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    navigation.navigate('Auth' as never, { screen: 'Login' } as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      {isAuthenticated && user ? (
        <>
          <View style={styles.userInfo}>
            <Text style={styles.label}>{t('profile.phone')}</Text>
            <Text style={styles.value}>{user.phone}</Text>
            {user.email && (
              <>
                <Text style={styles.label}>{t('profile.email')}</Text>
                <Text style={styles.value}>{user.email}</Text>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.guestView}>
          <Text style={styles.guestText}>You're browsing as a guest</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestView: {
    alignItems: 'center',
    marginTop: 40,
  },
  guestText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



