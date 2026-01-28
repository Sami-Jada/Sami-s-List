import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';

export default function HomeScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const handleOrderNow = () => {
    // Navigate to order flow
    navigation.navigate('Order' as never, { screen: 'Quantity' } as never);
  };

  const handleSignIn = () => {
    navigation.navigate('Auth' as never, { screen: 'Login' } as never);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <LanguageToggle />
        <Text style={styles.title}>{t('home.welcome')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        {/* Primary CTA - Order Button */}
        <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
          <Text style={styles.orderButtonText}>{t('home.orderNow')}</Text>
        </TouchableOpacity>

        {/* Steps Info */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>{t('home.orderSteps')}</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>{t('home.step1')}</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>{t('home.step2')}</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>{t('home.step3')}</Text>
          </View>
        </View>

        {/* Secondary Action - Sign In */}
        {!isAuthenticated && (
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  orderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 280,
    marginBottom: 40,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  signInButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signInButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});



