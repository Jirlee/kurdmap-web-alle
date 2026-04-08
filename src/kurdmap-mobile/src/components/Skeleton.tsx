import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function BusinessCardSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.colors.card }]}
      accessible={true}
      accessibilityLabel="Loading business"
      accessibilityRole="none"
    >
      <Skeleton width="100%" height={160} borderRadius={0} />
      <View style={styles.content}>
        <Skeleton width="70%" height={18} />
        <View style={styles.row}>
          <Skeleton width={14} height={14} borderRadius={7} />
          <Skeleton width="50%" height={14} />
        </View>
        <View style={styles.row}>
          <Skeleton width={14} height={14} borderRadius={7} />
          <Skeleton width="30%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function CategoryCardSkeleton() {
  return (
    <View style={styles.catCard}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.homeSkeleton}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <View>
          <Skeleton width={120} height={28} />
          <Skeleton width={200} height={14} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Ad banner */}
      <Skeleton width="100%" height={160} borderRadius={16} style={{ marginHorizontal: 16, marginTop: 20 }} />

      {/* Categories */}
      <View style={styles.catRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </View>

      {/* Business cards */}
      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <Skeleton width={180} height={20} style={{ marginBottom: 12 }} />
        <BusinessCardSkeleton />
        <BusinessCardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  content: {
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
  },
  homeSkeleton: {
    flex: 1,
    paddingTop: 16,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
  },
});
