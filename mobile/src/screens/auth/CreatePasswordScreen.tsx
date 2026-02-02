import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../../components';
import { addressService } from '../../services/addressService';

export default function CreatePasswordScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const route = useRoute();
  const { createPassword, user } = useAuth();

  const [name, setName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Amman');
  // Default Amman coordinates; later we can hook this up to a map picker
  const [latitude] = useState(31.9539);
  const [longitude] = useState(35.9106);
  const [loading, setLoading] = useState(false);

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert(t('common.error'), 'Name must be at least 2 characters');
      return;
    }

    if (!addressLine.trim()) {
      Alert.alert(t('common.error'), 'Please enter your address');
      return;
    }

    setLoading(true);

    try {
      // 1) Update profile name
      await createPassword(name.trim());

      // 2) Create default HOME address
      await addressService.createAddress({
        label: 'HOME',
        addressLine: addressLine.trim(),
        city: city || 'Amman',
        latitude,
        longitude,
        isDefault: true,
      });

      Alert.alert(t('common.success'), 'Account created successfully!', [
        { text: 'OK' },
      ]);
      // AppNavigator will show Main when isGuestUser becomes false (user updated above)
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <LanguageToggle />
          <Text style={styles.title}>{t('profile.createPassword')}</Text>
          <Text style={styles.subtitle}>{t('order.createAccountPrompt')}</Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>{t('profile.accountBenefits')}</Text>
            <Text style={styles.benefit}>• {t('profile.benefit1')}</Text>
            <Text style={styles.benefit}>• {t('profile.benefit2')}</Text>
            <Text style={styles.benefit}>• {t('profile.benefit3')}</Text>
          </View>

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full address"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Amman"
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('profile.saveAccount')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
