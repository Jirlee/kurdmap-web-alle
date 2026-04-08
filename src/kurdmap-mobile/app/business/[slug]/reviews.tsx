import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorView } from '@/components/ErrorView';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';
import { EmptyState } from '@/components/EmptyState';
import { reviewsApi } from '@/api/reviews';
import { businessesApi } from '@/api/businesses';
import { useAuthStore } from '@/stores/auth-store';
import { getLocalizedName } from '@/utils/localization';
import type { Review } from '@/types/api';

export default function ReviewsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

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

  const createMutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        businessId: businessQuery.data!.id,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', businessQuery.data?.id] });
      setRating(0);
      setComment('');
      Alert.alert(t('reviewSuccess'));
    },
    onError: () => {
      Alert.alert(t('reviewError'));
    },
  });

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    createMutation.mutate();
  }, [rating, createMutation]);

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
        {/* Write Review Form */}
        {isAuthenticated && (
          <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              {t('writeReview')}
            </Text>
            <View style={styles.ratingInput}>
              <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>
                {t('reviewRating')}
              </Text>
              <StarRating
                rating={rating}
                interactive
                onRatingChange={setRating}
                size={28}
              />
            </View>
            <TextInput
              style={[
                styles.commentInput,
                { color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border },
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder={t('reviewComment')}
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: theme.colors.primary },
                (rating === 0 || createMutation.isPending) && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || createMutation.isPending}
            >
              <Text style={styles.submitBtnText}>{t('reviewSubmit')}</Text>
            </Pressable>
          </View>
        )}

        {/* Reviews List */}
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
  formCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  ratingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingLabel: { fontSize: 14 },
  commentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  reviewsSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
});
