import React from 'react';
import { Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ScaleOnPress } from '@/components/Animations';
import { getCategoryName } from '@/utils/localization';
import type { Category } from '@/types/api';

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'restaurant-outline',
  barbershop: 'cut-outline',
  hotel: 'bed-outline',
  shop: 'storefront-outline',
  cafe: 'cafe-outline',
  market: 'cart-outline',
  bakery: 'nutrition-outline',
  clinic: 'medkit-outline',
  gym: 'fitness-outline',
  mosque: 'moon-outline',
};

interface Props {
  category: Category;
}

export const CategoryCard = React.memo(function CategoryCard({ category }: Props) {
  const router = useRouter();
  const theme = useTheme();

  const iconName = (
    category.icon
      ? CATEGORY_ICONS[category.icon] ?? 'grid-outline'
      : 'grid-outline'
  ) as keyof typeof Ionicons.glyphMap;

  return (
    <ScaleOnPress>
      <Pressable
        style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
        onPress={() => router.push(`/category/${category.id}`)}
        android_ripple={{ color: theme.colors.surfaceVariant }}
        accessibilityRole="button"
        accessibilityLabel={getCategoryName(category)}
      >
        <LinearGradient
          colors={[`${theme.colors.primary}25`, `${theme.colors.primary}10`]}
          style={styles.iconContainer}
        >
          <Ionicons name={iconName} size={24} color={theme.colors.primary} />
        </LinearGradient>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {getCategoryName(category)}
        </Text>
      </Pressable>
    </ScaleOnPress>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
