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
import { LanguageToggle } from '../../components';
import { addressService, Address, AddressLabel } from '../../services/addressService';

export default function AddressEditScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const route = useRoute();
  const address = (route.params as any)?.address as Address;

  const [label, setLabel] = useState<AddressLabel>(address?.label || 'HOME');
  const [addressLine, setAddressLine] = useState(address?.addressLine || '');
  const [city, setCity] = useState(address?.city || 'Amman');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!addressLine.trim()) {
      Alert.alert(t('common.error'), 'Please enter your address');
      return;
    }

    setLoading(true);
    try {
      await addressService.updateAddress(address.id, {
        label,
        addressLine: addressLine.trim(),
        city: city || 'Amman',
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const renderLabelButton = (value: AddressLabel, text: string) => (
    <TouchableOpacity
      style={[styles.labelButton, label === value && styles.labelButtonActive]}
      onPress={() => setLabel(value)}
    >
      <Text
        style={[
          styles.labelButtonText,
          label === value && styles.labelButtonTextActive,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );

  if (!address) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <LanguageToggle />
          <Text style={styles.title}>Edit address</Text>

          <Text style={styles.fieldLabel}>Label</Text>
          <View style={styles.labelRow}>
            {renderLabelButton('HOME', 'Home')}
            {renderLabelButton('WORK', 'Work')}
            {renderLabelButton('OTHER', 'Other')}
          </View>

          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full address"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
          />

          <Text style={styles.fieldLabel}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Amman"
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
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
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  labelButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  labelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  labelButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

