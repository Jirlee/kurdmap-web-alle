import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Pressable, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { BusinessCard } from '@/components/BusinessCard';
import { CategoryCard } from '@/components/CategoryCard';
import { CitySelector } from '@/components/CitySelector';
import { AdBanner } from '@/components/AdBanner';
import { HomeScreenSkeleton } from '@/components/Skeleton';
import { ErrorView } from '@/components/ErrorView';
import { FadeInView, StaggerChildren } from '@/components/Animations';
import { businessesApi } from '@/api/businesses';
import { categoriesApi } from '@/api/categories';
import { citiesApi } from '@/api/cities';
import { advertisementsApi } from '@/api/advertisements';
import type { Category, BusinessSummary } from '@/types/api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const recommendedQuery = useQuery({
    queryKey: ['businesses', 'recommended'],
    queryFn: () => businessesApi.getRecommended(6),
  });

  const adsQuery = useQuery({
    queryKey: ['advertisements', 'active'],
    queryFn: advertisementsApi.getActive,
  });

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: citiesApi.getAll,
  });

  const isLoading = categoriesQuery.isLoading || recommendedQuery.isLoading;
  const isError = categoriesQuery.isError && recommendedQuery.isError;

  const onRefresh = useCallback(() => {
    categoriesQuery.refetch();
    recommendedQuery.refetch();
    adsQuery.refetch();
    citiesQuery.refetch();
  }, [categoriesQuery, recommendedQuery, adsQuery, citiesQuery]);

  if (isLoading) return <HomeScreenSkeleton />;
  if (isError) return <ErrorView onRetry={onRefresh} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={categoriesQuery.isFetching}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Gradient Hero Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}
      >
        <FadeInView>
          <Text style={styles.heroTitle}>{t('homeTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('homeSubtitle')}</Text>
        </FadeInView>
        <Pressable
          style={styles.heroSearchBtn}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel={t('tabSearch')}
        >
          <Ionicons name="search-outline" size={20} color={theme.colors.primary} />
        </Pressable>
      </LinearGradient>

      {/* Ads */}
      {adsQuery.data && adsQuery.data.length > 0 && (
        <FadeInView delay={100}>
          <View style={styles.section}>
            <AdBanner ads={adsQuery.data} />
          </View>
        </FadeInView>
      )}

      {/* Categories */}
      {categoriesQuery.data && (
        <FadeInView delay={200}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('categories')}
              </Text>
            </View>
            <FlatList
              data={categoriesQuery.data}
              renderItem={({ item }: { item: Category }) => <CategoryCard category={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          </View>
        </FadeInView>
      )}

      {/* Cities */}
      {citiesQuery.data && citiesQuery.data.length > 0 && (
        <FadeInView delay={250}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('citySelectorTitle')}
              </Text>
            </View>
            <CitySelector cities={citiesQuery.data} />
          </View>
        </FadeInView>
      )}

      {/* Featured Businesses */}
      {recommendedQuery.data && recommendedQuery.data.featured.length > 0 && (
        <FadeInView delay={300}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('featuredBusinesses')}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/search')}
                accessibilityRole="link"
                accessibilityLabel={t('seeAll')}
              >
                <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
                  {t('seeAll')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.businessList}>
              <StaggerChildren stagger={100}>
                {recommendedQuery.data.featured.map((business: BusinessSummary) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </StaggerChildren>
            </View>
          </View>
        </FadeInView>
      )}

      {/* Discounted Businesses */}
      {recommendedQuery.data && recommendedQuery.data.discounted.length > 0 && (
        <FadeInView delay={400}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('specialOffers')}
              </Text>
            </View>
            <View style={styles.businessList}>
              <StaggerChildren stagger={100}>
                {recommendedQuery.data.discounted.map((business: BusinessSummary) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </StaggerChildren>
            </View>
          </View>
        </FadeInView>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
  },
  heroSearchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  businessList: {
    paddingHorizontal: 16,
  },
});
