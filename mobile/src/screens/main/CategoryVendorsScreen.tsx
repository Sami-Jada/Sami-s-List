import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { colors } from '../../theme';
import { getVendorsByServiceId, VendorListItem } from '../../services/vendorsService';

export type CategoryVendorsRouteParams = {
  CategoryVendors: {
    serviceId: string;
    serviceName: string;
  };
};

export default function CategoryVendorsScreen() {
  const { t } = useI18n();
  const route = useRoute<RouteProp<CategoryVendorsRouteParams, 'CategoryVendors'>>();
  const { serviceId, serviceName } = route.params ?? { serviceId: '', serviceName: '' };
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getVendorsByServiceId(serviceId)
      .then((data) => {
        if (!cancelled) setVendors(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setVendors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const handleCall = (phone: string) => {
    const url = `tel:${phone.replace(/\s/g, '')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), `Cannot call ${phone}`);
      }
    });
  };

  const renderItem = ({ item }: { item: VendorListItem }) => (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <Text style={styles.vendorName}>{item.name}</Text>
        {item.address ? (
          <Text style={styles.vendorAddress} numberOfLines={2}>
            {item.address}
          </Text>
        ) : null}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>{t('categories.rating')}: </Text>
          <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      {item.phone ? (
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(item.phone)}
          activeOpacity={0.8}
        >
          <Text style={styles.callButtonText}>{t('categories.call')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (vendors.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('categories.noVendors')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  cardMain: {
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  vendorAddress: {
    fontSize: 14,
    color: colors.heading,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: colors.heading,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  callButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  emptyText: {
    fontSize: 16,
    color: colors.heading,
  },
});
