import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { orderService } from '../../services/orderService';

export default function OrderQuantityScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const handleContinue = async () => {
    try {
      setLoading(true);
      // For now, assume backend uses the user's default address and payment method CASH
      // If multiple addresses are available, we can add an address selection step later.
      const createdOrder = await orderService.createOrder({
        tankQuantity: quantity,
        paymentMethod: 'CASH',
      } as any);

      navigation.navigate('Confirmation' as never, { order: createdOrder } as never);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      // You can improve error handling and localization here
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LanguageToggle />
      <Text style={styles.title}>{t('order.selectQuantity')}</Text>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.button, quantity === 1 && styles.buttonDisabled]}
          onPress={handleDecrease}
          disabled={quantity === 1}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.quantity}>{quantity}</Text>

        <TouchableOpacity
          style={[styles.button, quantity === 10 && styles.buttonDisabled]}
          onPress={handleIncrease}
          disabled={quantity === 10}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('order.quantity')}</Text>

      <TouchableOpacity
        style={[styles.continueButton, loading && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.continueButtonText}>
          {loading ? t('common.loading') : t('order.continue')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
