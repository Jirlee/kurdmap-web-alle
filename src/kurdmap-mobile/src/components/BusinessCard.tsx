import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { haptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { ScaleOnPress } from '@/components/Animations';
import { getLocalizedName } from '@/utils/localization';
import type { BusinessSummary } from '@/types/api';

interface Props {
  business: BusinessSummary;
  onFavoriteToggle?: (businessId: string) => void;
  isFavorited?: boolean;
  distance?: string | null;
}

export const BusinessCard = React.memo(function BusinessCard({
  business,
  onFavoriteToggle,
  isFavorited = false,
  distance,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  const handlePress = useCallback(() => {
    router.push(`/business/${business.slug}`);
  }, [business.slug, router]);

  const handleFavorite = useCallback(() => {
    haptic.success();
    onFavoriteToggle?.(business.id);
  }, [business.id, onFavoriteToggle]);

  return (
    <ScaleOnPress>
      <Pressable
        style={[styles.card, { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, shadowColor: theme.colors.shadow }]}
        onPress={handlePress}
        android_ripple={{ color: theme.colors.surfaceVariant }}
        accessibilityRole="button"
        accessibilityLabel={`${getLocalizedName(business.name)}${business.isFeatured ? `, ${t('businessFeatured')}` : ''}${business.isVerified ? ', verified' : ''}`}
      >
      <Image
        source={{ uri: business.primaryImageUrl ?? undefined }}
        style={styles.image}
        contentFit="cover"
        placeholder={require('../../assets/placeholder.png')}
        cachePolicy="memory-disk"
        transition={200}
      />

      {business.isFeatured && (
        <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.badgeText}>{t('businessFeatured')}</Text>
        </View>
      )}

      {business.isVerified && (
        <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="checkmark-circle" size={14} color="#FFF" />
        </View>
      )}

      {business.hasActiveDiscount && (
        <View style={styles.discountBadge}>
          <Ionicons name="pricetag" size={12} color="#FFF" />
          <Text style={styles.discountBadgeText}>{business.discountPercentage}%</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {getLocalizedName(business.name)}
        </Text>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.address, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {business.street}, {business.postalCode}
          </Text>
        </View>

        {distance && (
          <View style={styles.row}>
            <Ionicons name="navigate-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.distance, { color: theme.colors.primary }]}>{distance}</Text>
          </View>
        )}
      </View>

      {onFavoriteToggle && (
        <Pressable
          onPress={handleFavorite}
          style={styles.favoriteBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isFavorited ? t('removeFavorite') : t('addFavorite')}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorited ? theme.colors.error : theme.colors.textTertiary}
          />
        </Pressable>
      )}
    </Pressable>
    </ScaleOnPress>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: { elevation: 4 },
    }),
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  address: {
    fontSize: 13,
    flex: 1,
  },
  distance: {
    fontSize: 13,
    fontWeight: '500',
  },
  favoriteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 12 + 44 + 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E11D48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
