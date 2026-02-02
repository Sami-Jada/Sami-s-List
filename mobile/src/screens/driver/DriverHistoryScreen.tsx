import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { driverOrderService, DriverOrder } from '../../services/driverOrderService';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { colors } from '../../theme';

export default function DriverHistoryScreen() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setError(null);
      const data = await driverOrderService.getHistory();
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const renderItem = ({ item }: { item: DriverOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      <Text style={styles.line}>
        <Text style={styles.label}>{t('driver.customer')}:</Text>{' '}
        <Text style={styles.value}>{item.user.name || item.user.phone}</Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>{t('driver.quantity')}:</Text>{' '}
        <Text style={styles.value}>{item.tankQuantity}</Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>{t('driver.address')}:</Text>{' '}
        <Text style={styles.value}>
          {item.address.label || item.address.street || item.address.city || t('driver.noAddress')}
        </Text>
      </Text>
      <Text style={styles.line}>
        <Text style={styles.label}>{t('driver.total')}:</Text>{' '}
        <Text style={styles.value}>{item.totalPrice}</Text>
      </Text>
      {item.deliveredAt && (
        <Text style={styles.line}>
          <Text style={styles.label}>{t('driver.deliveredAt')}:</Text>{' '}
          <Text style={styles.value}>{new Date(item.deliveredAt).toLocaleString()}</Text>
        </Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LanguageToggle compact />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {orders.length === 0 && !error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('driver.noHistory')}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.primaryText,
    textAlign: 'center',
  },
  errorText: {
    color: colors.destructive,
    padding: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.highlight,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  status: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '500',
  },
  line: {
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: colors.heading,
  },
  value: {
    fontSize: 14,
    color: colors.primaryText,
  },
});

