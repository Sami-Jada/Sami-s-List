import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export default function HomeScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Auth' as never, { screen: 'Login' } as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.welcome')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      
      {!isAuthenticated && (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login / Sign Up</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  loginButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



