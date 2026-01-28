import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { addressService, Address } from '../../services/addressService';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

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
              <ActivityIndicator color="#007AFF" />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  completeProfileBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  completeProfileText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  completeProfileButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completeProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 5,
  },
  addressSection: {
    marginBottom: 24,
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
  },
  addAddressButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  addAddressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noAddressesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  addressCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    marginTop: 8,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultText: {
    fontSize: 12,
    color: '#007AFF',
  },
  editText: {
    fontSize: 12,
    color: '#666',
  },
  addressLine: {
    fontSize: 14,
    color: '#333',
  },
  addressCity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestView: {
    alignItems: 'center',
    marginTop: 40,
  },
  guestText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    minWidth: 200,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



