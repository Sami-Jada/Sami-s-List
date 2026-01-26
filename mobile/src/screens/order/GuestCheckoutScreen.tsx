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
import { orderService } from '../../services/orderService';
import { PaymentMethod } from '@shared';
import * as SecureStore from 'expo-secure-store';

export default function GuestCheckoutScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const route = useRoute();
  const quantity = (route.params as any)?.quantity || 1;

  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Amman');
  const [latitude, setLatitude] = useState(31.9539); // Default Amman coordinates
  const [longitude, setLongitude] = useState(35.9106);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneNumber: string): boolean => {
    const jordanPhoneRegex = /^\+962[789]\d{8}$/;
    return jordanPhoneRegex.test(phoneNumber);
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!phone.trim()) {
      Alert.alert(t('common.error'), 'Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert(t('common.error'), 'Please enter a valid Jordan phone number (+962XXXXXXXXX)');
      return;
    }

    if (!addressLine.trim()) {
      Alert.alert(t('common.error'), 'Please enter your delivery address');
      return;
    }

    setLoading(true);

    try {
      const response = await orderService.createGuestOrder({
        phone: phone.trim(),
        address: {
          label: 'HOME',
          addressLine: addressLine.trim(),
          city: city || 'Amman',
          latitude,
          longitude,
          isDefault: true,
        },
        tankQuantity: quantity,
        paymentMethod,
      });

      // Store temporary token for viewing order status
      if (response.accessToken) {
        await SecureStore.setItemAsync('access_token', response.accessToken);
      }

      // Navigate to confirmation screen
      navigation.navigate('Confirmation' as never, {
        order: response.order,
        isGuest: response.isGuest,
      } as never);
    } catch (error: any) {
      console.error('Order creation error:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || error.message || 'Failed to place order. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('order.phone')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('order.phonePlaceholder')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />

      <Text style={styles.title}>{t('order.address')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('order.addressLinePlaceholder')}
        value={addressLine}
        onChangeText={setAddressLine}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.label}>{t('order.city')}</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder={t('order.cityDefault')}
      />

      <Text style={styles.title}>{t('order.paymentMethod')}</Text>
      <View style={styles.paymentContainer}>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === PaymentMethod.CASH && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod(PaymentMethod.CASH)}
        >
          <Text
            style={[
              styles.paymentOptionText,
              paymentMethod === PaymentMethod.CASH && styles.paymentOptionTextSelected,
            ]}
          >
            {t('order.cash')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === PaymentMethod.CARD && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod(PaymentMethod.CARD)}
        >
          <Text
            style={[
              styles.paymentOptionText,
              paymentMethod === PaymentMethod.CARD && styles.paymentOptionTextSelected,
            ]}
          >
            {t('order.card')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {t('order.quantity')}: {quantity}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.orderButton, loading && styles.orderButtonDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.orderButtonText}>{t('order.placeOrder')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signInLink}
        onPress={() => navigation.navigate('Auth' as never, { screen: 'Login' } as never)}
      >
        <Text style={styles.signInLinkText}>{t('order.signInToSave')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
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
  paymentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  summary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInLink: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  signInLinkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
