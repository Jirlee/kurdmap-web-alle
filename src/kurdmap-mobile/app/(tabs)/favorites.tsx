import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { BusinessCardSkeleton } from '@/components/Skeleton';
import { FadeInView } from '@/components/Animations';
import { favoritesApi } from '@/api/favorites';
import { businessesApi } from '@/api/businesses';
import { useAuthStore } from '@/stores/auth-store';
import type { BusinessSummary, Favorite } from '@/types/api';
import { Text, Pressable } from 'react-native';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuthStore();

  const favoritesQuery = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => favoritesApi.getUserFavorites(userId!),
    enabled: !!userId,
  });

  const toggleMutation = useMutation({
    mutationFn: (businessId: string) =>
      favoritesApi.toggle({ businessId, userId: userId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const favoriteBusinessIds = new Set(
    favoritesQuery.data?.map((f: Favorite) => f.businessId) ?? [],
  );

  // Fetch business details for favorites
  const businessesQuery = useQuery({
    queryKey: ['businesses', 'favorites', Array.from(favoriteBusinessIds)],
    queryFn: () =>
      businessesApi.search({ pageSize: 100 }),
    enabled: favoriteBusinessIds.size > 0,
    select: (data) =>
      data.items.filter((b: BusinessSummary) => favoriteBusinessIds.has(b.id)),
  });

  const handleFavoriteToggle = useCallback(
    (businessId: string) => {
      toggleMutation.mutate(businessId);
    },
    [toggleMutation],
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('favoritesTitle')}</Text>
        <EmptyState
          icon="heart-outline"
          title={t('loginRequired')}
          subtitle={t('profileLoginPrompt')}
        />
        <Pressable
          style={[styles.loginBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginBtnText}>{t('login')}</Text>
        </Pressable>
      </View>
    );
  }

  if (favoritesQuery.isLoading) return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('favoritesTitle')}</Text>
      <FadeInView style={styles.listContent}>
        <BusinessCardSkeleton />
        <BusinessCardSkeleton />
      </FadeInView>
    </View>
  );
  if (favoritesQuery.isError) return <ErrorView onRetry={() => favoritesQuery.refetch()} />;

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
              refreshing={favoritesQuery.isFetching}
              onRefresh={() => favoritesQuery.refetch()}
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
  loginBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
