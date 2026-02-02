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
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { addressService, AddressLabel } from '../../services/addressService';
import { colors } from '../../theme';

const DEFAULT_LAT = 31.9539;
const DEFAULT_LNG = 35.9106;

export default function AddressFormScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();

  const [label, setLabel] = useState<AddressLabel>('HOME');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Amman');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!addressLine.trim()) {
      Alert.alert(t('common.error'), 'Please enter your address');
      return;
    }

    setLoading(true);
    try {
      await addressService.createAddress({
        label,
        addressLine: addressLine.trim(),
        city: city || 'Amman',
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        isDefault: false,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to save address');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LanguageToggle />
      <Text style={styles.title}>{t('profile.addAddress')}</Text>

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
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.heading,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: colors.primaryText,
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
    borderColor: colors.highlight,
    marginRight: 8,
  },
  labelButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  labelButtonText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  labelButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.card,
    minHeight: 50,
    color: colors.primaryText,
  },
  saveButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

