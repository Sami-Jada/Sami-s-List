import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { I18nProvider } from './context/I18nContext';

// Log API URL on app startup
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
console.log('========================================');
console.log('🚀 APP STARTING');
console.log('🔗 API URL:', API_URL);
console.log('📱 Expo Config API URL:', Constants.expoConfig?.extra?.apiUrl);
console.log('🌍 Environment:', Constants.expoConfig?.extra?.environment);
console.log('========================================');

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </I18nProvider>
  );
}



