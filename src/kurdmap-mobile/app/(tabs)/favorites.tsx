import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { BusinessCardSkeleton } from '@/components/Skeleton';
import { FadeInView } from '@/components/Animations';
import { businessesApi } from '@/api/businesses';
import { useFavoritesStore } from '@/stores/favorites-store';
import type { BusinessSummary } from '@/types/api';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  // Fetch business details and keep only the locally-favorited ones.
  const businessesQuery = useQuery({
    queryKey: ['businesses', 'favorites'],
    queryFn: () => businessesApi.search({ pageSize: 100 }),
    enabled: favoriteIds.length > 0,
    select: (data) =>
      data.items.filter((b: BusinessSummary) => favoriteIds.includes(b.id)),
  });

  const handleFavoriteToggle = useCallback(
    (businessId: string) => {
      toggleFavorite(businessId);
    },
    [toggleFavorite],
  );

  if (favoriteIds.length > 0 && businessesQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('favoritesTitle')}</Text>
        <FadeInView style={styles.listContent}>
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
        </FadeInView>
      </View>
    );
  }

  if (businessesQuery.isError) return <ErrorView onRetry={() => businessesQuery.refetch()} />;

  const businesses = businessesQuery.data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('favoritesTitle')}</Text>

      {businesses.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={t('favoritesEmpty')}
          subtitle={t('favoritesEmptyHint')}
        />
      ) : (
        <FlashList
          data={businesses}
          renderItem={({ item }: { item: BusinessSummary }) => (
            <BusinessCard
              business={item}
              isFavorited
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={240}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={businessesQuery.isFetching}
              onRefresh={() => businessesQuery.refetch()}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
