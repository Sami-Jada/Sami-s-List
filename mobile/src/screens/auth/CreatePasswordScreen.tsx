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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

export default function CreatePasswordScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const route = useRoute();
  const { createPassword, user } = useAuth();

  const [name, setName] = useState('');
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

    setLoading(true);

    try {
      await createPassword(name.trim());
      Alert.alert(t('common.success'), 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main' as never, { screen: 'Home' } as never),
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
  );
}

const styles = StyleSheet.create({
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
