import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';

export default function OrderConfirmationScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as any;

  const handleCreateAccount = () => {
    navigation.navigate('Auth' as never, {
      screen: 'CreatePassword',
      params: { orderId: order.id },
    } as never);
  };

  const handleViewOrderStatus = () => {
    navigation.navigate('Main' as never, { screen: 'Orders' } as never);
  };

  const formatEstimatedTime = (estimatedTime: string | null): string => {
    if (!estimatedTime) return 'N/A';
    const date = new Date(estimatedTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LanguageToggle />
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>

      <Text style={styles.title}>{t('order.orderPlaced')}</Text>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('order.orderNumber')}</Text>
          <Text style={styles.infoValue}>{order.orderNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('order.estimatedDelivery')}</Text>
          <Text style={styles.infoValue}>
            {formatEstimatedTime(order.estimatedDeliveryTime)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('order.address')}</Text>
          <Text style={styles.infoValue}>
            {order.address.addressLine}, {order.address.city}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('order.totalPrice')}</Text>
          <Text style={styles.infoValue}>{order.totalPrice} JOD</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewOrderButton} onPress={handleViewOrderStatus}>
        <Text style={styles.viewOrderButtonText}>{t('order.viewOrderStatus')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  orderInfo: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  viewOrderButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  viewOrderButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
