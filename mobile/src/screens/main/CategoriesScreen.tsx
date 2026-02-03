import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../context/I18nContext';
import { colors } from '../../theme';
import { getAllCategories, ServiceCategory } from '../../services/servicesService';

function ServiceIcon({ iconName, size = 32 }: { iconName: string; size?: number }) {
  const name = iconName.toLowerCase();
  if (name === 'plumber' || name === 'plumbers') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🔧</Text>;
  }
  if (name === 'house-cleaner') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🏠</Text>;
  }
  if (name === 'lawn-care' || name === 'gardener' || name === 'gardeners') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🌿</Text>;
  }
  if (name.includes('gas') || name.includes('canister')) {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>⛽</Text>;
  }
  if (name.includes('electric') || name === 'electrician' || name === 'electricians') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>⚡</Text>;
  }
  if (name.includes('water') || name.includes('tank')) {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>💧</Text>;
  }
  return <Text style={[styles.serviceIconText, { fontSize: size }]}>📋</Text>;
}

export default function CategoriesScreen() {
  const { t } = useI18n();
  const navigation = useNavigation();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('categories.title') });
  }, [navigation, t]);

  useEffect(() => {
    let cancelled = false;
    getAllCategories()
      .then((data) => {
        if (!cancelled) setCategories(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCategoryPress = (item: ServiceCategory) => {
    navigation.navigate('CategoryVendors' as never, {
      serviceId: item.id,
      serviceName: item.name,
    } as never);
  };

  const renderItem = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <ServiceIcon iconName={item.iconName} size={36} />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('categories.noCategories')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  iconWrap: {
    marginRight: 16,
  },
  serviceIconText: {
    lineHeight: 40,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  emptyText: {
    fontSize: 16,
    color: colors.heading,
  },
});
