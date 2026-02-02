import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../context/I18nContext';
import { LanguageToggle } from '../../components';
import { colors } from '../../theme';
import { getPopularServices, ServiceCategory } from '../../services/servicesService';
import Logo from '../../../assets/images/Logos/logo.svg';

const CARD_SIZE = 120;
const CARD_GAP = 12;

function ServiceIcon({ iconName, size = 40 }: { iconName: string; size?: number }) {
  const name = iconName.toLowerCase();
  if (name === 'plumber') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🔧</Text>;
  }
  if (name === 'house-cleaner') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🏠</Text>;
  }
  if (name === 'lawn-care') {
    return <Text style={[styles.serviceIconText, { fontSize: size }]}>🌿</Text>;
  }
  return <Text style={[styles.serviceIconText, { fontSize: size }]}>📋</Text>;
}

export default function HomeScreen() {
  const { t } = useI18n();
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    getPopularServices()
      .then((data) => {
        if (!cancelled) setServices(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <LanguageToggle />
        {/* Header – dark background, logo only */}
        <View style={styles.header}>
          <Logo width={800} height={440} style={styles.logoGraphic} />
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.heading}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Main content – background color */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Popular Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.popularServices')}</Text>
              <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
            ) : services.length === 0 ? (
              <Text style={styles.noServices}>{t('home.noServices')}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.cardsScroll,
                  { paddingRight: Math.max(24, (width - (CARD_SIZE + CARD_GAP) * 3) / 2) },
                ]}
              >
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceCard}
                    activeOpacity={0.8}
                  >
                    <View style={styles.serviceIconWrap}>
                      <ServiceIcon iconName={s.iconName} size={36} />
                    </View>
                    <Text style={styles.serviceLabel} numberOfLines={2}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryText,
  },
  header: {
    backgroundColor: colors.primaryText,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    alignItems: 'center',
  },
  logoGraphic: {
    opacity: 0.95,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: -80,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.primaryText,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noServices: {
    fontSize: 15,
    color: colors.heading,
    paddingVertical: 24,
  },
  cardsScroll: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingLeft: 0,
  },
  serviceCard: {
    width: CARD_SIZE,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  serviceIconWrap: {
    marginBottom: 10,
  },
  serviceIconText: {
    lineHeight: 40,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
  },
});
