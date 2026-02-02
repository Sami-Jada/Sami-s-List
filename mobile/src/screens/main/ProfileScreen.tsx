import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { addressService, Address } from '../../services/addressService';
import { orderService, Order } from '../../services/orderService';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<Order | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    navigation.navigate('Auth' as never, { screen: 'Login' } as never);
  };

  const loadAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      setAddressesLoading(true);
      const data = await addressService.getMyAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses', error);
    } finally {
      setAddressesLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!isAuthenticated) return;
    try {
      setOrdersLoading(true);
      const data = await orderService.getUserOrders();
      const inProgress = data.find(
        (o) =>
          o.status !== 'DELIVERED' &&
          o.status !== 'CANCELLED' &&
          o.status !== 'CANCELED',
      );
      setDisplayOrder(inProgress ?? data[0] ?? null);
    } catch (error) {
      console.error('Failed to load orders', error);
      setDisplayOrder(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [isAuthenticated]),
  );

  const hasProfileName = !!user?.name;

  return (
    <View style={styles.container}>
      <LanguageToggle />
      <Text style={styles.title}>{t('profile.title')}</Text>

      {isAuthenticated && user ? (
        <>
          {!hasProfileName && (
            <View style={styles.completeProfileBanner}>
              <Text style={styles.completeProfileText}>{t('profile.completeProfile')}</Text>
              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={() =>
                  navigation.navigate('Auth' as never, { screen: 'CreatePassword' } as never)
                }
              >
                <Text style={styles.completeProfileButtonText}>{t('profile.createPassword')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.label}>{t('profile.phone')}</Text>
            <Text style={styles.value}>{user.phone}</Text>
            {user.email && (
              <>
                <Text style={styles.label}>{t('profile.email')}</Text>
                <Text style={styles.value}>{user.email}</Text>
              </>
            )}
          </View>

          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressTitle}>{t('profile.addresses')}</Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => navigation.navigate('AddressForm' as never)}
              >
                <Text style={styles.addAddressButtonText}>{t('profile.addAddress')}</Text>
              </TouchableOpacity>
            </View>

            {addressesLoading ? (
              <ActivityIndicator color={colors.brand} />
            ) : addresses.length === 0 ? (
              <Text style={styles.noAddressesText}>{t('profile.noAddresses')}</Text>
            ) : (
              <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.addressCard}>
                    <View style={styles.addressHeaderRow}>
                      <Text style={styles.addressLabel}>{item.label}</Text>
                      <View style={styles.addressActions}>
                        {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                        {!item.isDefault && (
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                await addressService.setDefaultAddress(item.id);
                                loadAddresses();
                              } catch (error) {
                                console.error('Failed to set default address', error);
                              }
                            }}
                          >
                            <Text style={styles.setDefaultText}>Set default</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('AddressEdit' as never, { address: item } as never)
                          }
                        >
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.addressLine}>{item.addressLine}</Text>
                    <Text style={styles.addressCity}>{item.city}</Text>
                  </View>
                )}
              />
            )}
          </View>

          <View style={styles.ordersSection}>
            <View style={styles.ordersSectionHeader}>
              <Text style={styles.ordersSectionTitle}>{t('orders.title')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Orders' as never)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.ordersSeeAll}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {ordersLoading ? (
              <ActivityIndicator color={colors.brand} style={styles.ordersLoader} />
            ) : displayOrder ? (
              <View style={styles.ordersCard}>
                <View style={styles.ordersCardRow}>
                  <Text style={styles.ordersCardLabel}>{t('order.orderNumber')}</Text>
                  <Text style={styles.ordersCardValue}>{displayOrder.orderNumber}</Text>
                </View>
                <View style={styles.ordersCardRow}>
                  <Text style={styles.ordersCardLabel}>Status</Text>
                  <Text style={styles.ordersCardValue}>{displayOrder.status}</Text>
                </View>
                <View style={styles.ordersCardRow}>
                  <Text style={styles.ordersCardLabel}>{t('order.totalPrice')}</Text>
                  <Text style={styles.ordersCardValue}>{displayOrder.totalPrice} JOD</Text>
                </View>
                {displayOrder.address && (
                  <Text style={styles.ordersCardAddress}>
                    {displayOrder.address.addressLine}, {displayOrder.address.city}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.ordersCardArrowRow}
                  onPress={() => navigation.navigate('Orders' as never)}
                >
                  <Text style={styles.ordersCardArrowText}>{t('order.viewOrderStatus')}</Text>
                  <Text style={styles.ordersCardArrow}>›</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ordersCard}>
                <Text style={styles.ordersEmptyText}>{t('orders.empty')}</Text>
                <TouchableOpacity
                  style={styles.ordersCardArrowRow}
                  onPress={() => navigation.navigate('Orders' as never)}
                >
                  <Text style={styles.ordersCardArrowText}>{t('orders.title')}</Text>
                  <Text style={styles.ordersCardArrow}>›</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.guestView}>
          <Text style={styles.guestText}>You're browsing as a guest</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.heading,
  },
  completeProfileBanner: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  completeProfileText: {
    fontSize: 14,
    color: colors.primaryText,
    marginBottom: 8,
  },
  completeProfileButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completeProfileButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.heading,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 5,
    color: colors.primaryText,
  },
  addressSection: {
    marginBottom: 24,
  },
  ordersSection: {
    marginBottom: 24,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ordersSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.heading,
  },
  ordersSeeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
  },
  ordersLoader: {
    marginTop: 12,
  },
  ordersCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.highlight,
    padding: 12,
    marginTop: 8,
    backgroundColor: colors.card,
  },
  ordersCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ordersCardLabel: {
    fontSize: 14,
    color: colors.heading,
  },
  ordersCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  ordersCardAddress: {
    fontSize: 13,
    color: colors.primaryText,
    marginTop: 4,
    marginBottom: 8,
  },
  ordersCardArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  ordersCardArrowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand,
    marginRight: 4,
  },
  ordersCardArrow: {
    fontSize: 18,
    color: colors.brand,
    fontWeight: '300',
  },
  ordersEmptyText: {
    fontSize: 14,
    color: colors.heading,
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.heading,
  },
  addAddressButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.brand,
  },
  addAddressButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noAddressesText: {
    fontSize: 14,
    color: colors.heading,
    marginTop: 8,
  },
  addressCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.highlight,
    padding: 12,
    marginTop: 8,
    backgroundColor: colors.card,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  defaultBadge: {
    fontSize: 12,
    color: colors.brand,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultText: {
    fontSize: 12,
    color: colors.brand,
  },
  editText: {
    fontSize: 12,
    color: colors.heading,
  },
  addressLine: {
    fontSize: 14,
    color: colors.primaryText,
  },
  addressCity: {
    fontSize: 13,
    color: colors.heading,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: colors.destructive,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestView: {
    alignItems: 'center',
    marginTop: 40,
  },
  guestText: {
    fontSize: 16,
    color: colors.heading,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});



