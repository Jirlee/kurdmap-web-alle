import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ReviewCard } from '@/components/ReviewCard';
import { EmptyState } from '@/components/EmptyState';
import { reviewsApi } from '@/api/reviews';
import { businessesApi } from '@/api/businesses';
import { getLocalizedName } from '@/utils/localization';
import type { Review } from '@/types/api';

export default function ReviewsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const businessQuery = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', businessQuery.data?.id],
    queryFn: () => reviewsApi.getByBusiness(businessQuery.data!.id),
    enabled: !!businessQuery.data?.id,
  });

  const reviews = reviewsQuery.data ?? [];

  if (businessQuery.isLoading || reviewsQuery.isLoading) return <LoadingSpinner fullScreen />;
  if (businessQuery.isError) return <ErrorView onRetry={() => businessQuery.refetch()} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {businessQuery.data ? getLocalizedName(businessQuery.data.name) : t('reviews')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={reviewsQuery.isFetching}
            onRefresh={() => reviewsQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Reviews List (read-only) */}
        <View style={styles.reviewsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('reviews')} ({reviews.length})
          </Text>
          {reviews.length === 0 ? (
            <EmptyState icon="chatbubble-outline" title={t('noReviews')} />
          ) : (
            reviews.map((review: Review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  scrollContent: { paddingBottom: 32 },
  reviewsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
});
