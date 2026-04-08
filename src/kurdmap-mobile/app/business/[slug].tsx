import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { BusinessCardSkeleton } from '@/components/Skeleton';
import { FadeInView } from '@/components/Animations';
import { ErrorView } from '@/components/ErrorView';
import { ImageGallery } from '@/components/ImageGallery';
import { OpeningHoursDisplay } from '@/components/OpeningHours';
import { StarRating } from '@/components/StarRating';
import { ReviewCard } from '@/components/ReviewCard';
import { MapPreview } from '@/components/MapPreview';
import { businessesApi } from '@/api/businesses';
import { reviewsApi } from '@/api/reviews';
import { favoritesApi } from '@/api/favorites';
import { useAuthStore } from '@/stores/auth-store';
import { getLocalizedName } from '@/utils/localization';
import { haptic } from '@/utils/haptics';
import type { Review, MenuItem, BusinessService as BizService } from '@/types/api';

export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuthStore();

  const detailQuery = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', detailQuery.data?.id],
    queryFn: () => reviewsApi.getByBusiness(detailQuery.data!.id),
    enabled: !!detailQuery.data?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: () =>
      favoritesApi.toggle({ businessId: detailQuery.data!.id, userId: userId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      haptic.success();
    },
  });

  const biz = detailQuery.data;
  const reviewList = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);
  const avgRating = useMemo(() => {
    if (reviewList.length === 0) return 0;
    return reviewList.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewList.length;
  }, [reviewList]);

  const handleCall = useCallback(() => {
    if (biz?.phone) Linking.openURL(`tel:${biz.phone}`);
  }, [biz?.phone]);

  const handleEmail = useCallback(() => {
    if (biz?.email) Linking.openURL(`mailto:${biz.email}`);
  }, [biz?.email]);

  const handleWebsite = useCallback(() => {
    if (biz?.website) Linking.openURL(biz.website);
  }, [biz?.website]);

  const handleDirections = useCallback(() => {
    if (biz) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`;
      Linking.openURL(url);
    }
  }, [biz]);

  const handleShare = useCallback(async () => {
    if (biz) {
      await Share.share({
        message: `${getLocalizedName(biz.name)} — ${biz.street}, ${biz.postalCode}`,
      });
    }
  }, [biz]);

  if (detailQuery.isLoading) return (
    <View style={{ flex: 1, paddingTop: insets.top + 60, paddingHorizontal: 16 }}>
      <BusinessCardSkeleton />
      <BusinessCardSkeleton />
    </View>
  );
  if (detailQuery.isError || !biz) return <ErrorView onRetry={() => detailQuery.refetch()} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Back Button */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8, backgroundColor: theme.colors.surface }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
      </Pressable>

      {/* Images */}
      {biz.images.length > 0 && <ImageGallery images={biz.images} />}

      {/* Header */}
      <FadeInView>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {getLocalizedName(biz.name)}
          </Text>
          {isAuthenticated && (
            <Pressable onPress={() => toggleFavoriteMutation.mutate()} hitSlop={8}>
              <Ionicons name="heart-outline" size={24} color={theme.colors.error} />
            </Pressable>
          )}
        </View>

        <View style={styles.badgesRow}>
          {biz.isVerified && (
            <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {t('businessVerified')}
              </Text>
            </View>
          )}
          {biz.isFeatured && (
            <View style={[styles.badge, { backgroundColor: `${theme.colors.accent}20` }]}>
              <Ionicons name="star" size={14} color={theme.colors.accent} />
              <Text style={[styles.badgeText, { color: theme.colors.accent }]}>
                {t('businessFeatured')}
              </Text>
            </View>
          )}
        </View>

        {reviewList.length > 0 && (
          <View style={styles.ratingRow}>
            <StarRating rating={avgRating} size={16} />
            <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
              {avgRating.toFixed(1)} ({reviewList.length})
            </Text>
          </View>
        )}

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.address, { color: theme.colors.textSecondary }]}>
            {biz.street}, {biz.postalCode}
          </Text>
        </View>
      </View>
      </FadeInView>

      {/* Description */}
      {biz.description && (
        <FadeInView delay={100}>
        <View style={styles.section}>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {getLocalizedName(biz.description)}
          </Text>
        </View>
        </FadeInView>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {biz.phone && (
          <ActionButton
            icon="call-outline"
            label={t('call')}
            onPress={handleCall}
            color={theme.colors.primary}
            bgColor={theme.colors.surface}
          />
        )}
        {biz.email && (
          <ActionButton
            icon="mail-outline"
            label={t('email')}
            onPress={handleEmail}
            color={theme.colors.primary}
            bgColor={theme.colors.surface}
          />
        )}
        {biz.website && (
          <ActionButton
            icon="globe-outline"
            label={t('website')}
            onPress={handleWebsite}
            color={theme.colors.primary}
            bgColor={theme.colors.surface}
          />
        )}
        <ActionButton
          icon="navigate-outline"
          label={t('directions')}
          onPress={handleDirections}
          color={theme.colors.primary}
          bgColor={theme.colors.surface}
        />
        <ActionButton
          icon="share-outline"
          label={t('share')}
          onPress={handleShare}
          color={theme.colors.primary}
          bgColor={theme.colors.surface}
        />
      </View>

      {/* Opening Hours */}
      {biz.hours && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('openingHours')}
          </Text>
          <OpeningHoursDisplay hours={biz.hours} />
        </View>
      )}

      {/* Menu Items */}
      {biz.menuItems.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('menu')}
          </Text>
          {biz.menuItems.map((item: MenuItem) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={[styles.menuItemName, { color: theme.colors.text }]}>
                  {getLocalizedName(item.name)}
                </Text>
                {item.description && (
                  <Text style={[styles.menuItemDesc, { color: theme.colors.textTertiary }]}>
                    {getLocalizedName(item.description)}
                  </Text>
                )}
              </View>
              {item.price != null && (
                <Text style={[styles.menuItemPrice, { color: theme.colors.primary }]}>
                  €{item.price.toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Services */}
      {biz.services.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('services')}
          </Text>
          {biz.services.map((svc: BizService) => (
            <View key={svc.id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={[styles.menuItemName, { color: theme.colors.text }]}>
                  {getLocalizedName(svc.name)}
                </Text>
                {svc.description && (
                  <Text style={[styles.menuItemDesc, { color: theme.colors.textTertiary }]}>
                    {getLocalizedName(svc.description)}
                  </Text>
                )}
              </View>
              {svc.price != null && (
                <Text style={[styles.menuItemPrice, { color: theme.colors.primary }]}>
                  €{svc.price.toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Map Preview */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('directions')}
        </Text>
        <Pressable onPress={handleDirections}>
          <MapPreview latitude={biz.latitude} longitude={biz.longitude} />
        </Pressable>
      </View>

      {/* Reviews */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.reviewsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('reviews')} ({reviewList.length})
          </Text>
          {isAuthenticated && (
            <Pressable
              onPress={() => router.push(`/business/${slug}/reviews`)}
              style={[styles.writeReviewBtn, { borderColor: theme.colors.primary }]}
            >
              <Text style={[styles.writeReviewText, { color: theme.colors.primary }]}>
                {t('writeReview')}
              </Text>
            </Pressable>
          )}
        </View>
        {reviewList.length === 0 ? (
          <Text style={[styles.noReviews, { color: theme.colors.textTertiary }]}>
            {t('noReviews')}
          </Text>
        ) : (
          reviewList.slice(0, 3).map((review: Review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
        {reviewList.length > 3 && (
          <Pressable onPress={() => router.push(`/business/${slug}/reviews`)}>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>{t('seeAll')}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color,
  bgColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}) {
  return (
    <Pressable style={[styles.actionBtn, { backgroundColor: bgColor }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerSection: { paddingHorizontal: 16, paddingTop: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: { fontSize: 24, fontWeight: '700', flex: 1 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  ratingText: { fontSize: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  address: { fontSize: 14 },
  section: { paddingHorizontal: 16, paddingTop: 12 },
  description: { fontSize: 14, lineHeight: 22 },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  actionLabel: { fontSize: 11, fontWeight: '500' },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  menuItemInfo: { flex: 1, marginRight: 12 },
  menuItemName: { fontSize: 14, fontWeight: '500' },
  menuItemDesc: { fontSize: 12, marginTop: 2 },
  menuItemPrice: { fontSize: 14, fontWeight: '600' },
  miniMap: { height: 160, borderRadius: 12, overflow: 'hidden' },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  writeReviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  writeReviewText: { fontSize: 13, fontWeight: '500' },
  noReviews: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  seeAll: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingTop: 12 },
});
