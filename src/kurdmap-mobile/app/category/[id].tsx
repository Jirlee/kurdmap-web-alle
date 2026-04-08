import React, { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { BusinessCard } from '@/components/BusinessCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { businessesApi } from '@/api/businesses';
import { categoriesApi } from '@/api/categories';
import { getCategoryName } from '@/utils/localization';
import type { BusinessSummary, Category } from '@/types/api';

const PAGE_SIZE = 12;

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const category = categoriesQuery.data?.find((c: Category) => c.id === id);

  const businessesQuery = useInfiniteQuery({
    queryKey: ['businesses', 'category', id],
    queryFn: ({ pageParam = 1 }) =>
      businessesApi.list({ categoryId: id, pageNumber: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 1,
    enabled: !!id,
  });

  const businesses = businessesQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = businessesQuery.data?.pages[0]?.totalCount ?? 0;

  const loadMore = useCallback(() => {
    if (businessesQuery.hasNextPage && !businessesQuery.isFetchingNextPage) {
      businessesQuery.fetchNextPage();
    }
  }, [businessesQuery]);

  const renderItem = useCallback(
    ({ item }: { item: BusinessSummary }) => <BusinessCard business={item} />,
    [],
  );

  if (businessesQuery.isLoading) return <LoadingSpinner fullScreen />;
  if (businessesQuery.isError)
    return <ErrorView onRetry={() => businessesQuery.refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {category ? getCategoryName(category) : t('categories')}
          </Text>
          <Text style={[styles.headerCount, { color: theme.colors.textSecondary }]}>
            {t('searchResults', { count: totalCount })}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Business List */}
      {businesses.length === 0 ? (
        <EmptyState title={t('noResults')} icon="storefront-outline" />
      ) : (
        <FlashList
          data={businesses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={240}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={businessesQuery.isFetching && !businessesQuery.isFetchingNextPage}
              onRefresh={() => businessesQuery.refetch()}
              tintColor={theme.colors.primary}
            />
          }
          ListFooterComponent={
            businessesQuery.isFetchingNextPage ? <LoadingSpinner size="small" /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerCount: { fontSize: 12, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
});
