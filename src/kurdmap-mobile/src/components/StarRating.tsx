import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  rating: number;
  size?: number;
  maxRating?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  color?: string;
}

export function StarRating({
  rating,
  size = 18,
  maxRating = 5,
  interactive = false,
  onRatingChange,
  color = '#F59E0B',
}: Props) {
  const stars = Array.from({ length: maxRating }, (_, i) => {
    const starValue = i + 1;
    const isFilled = starValue <= Math.floor(rating);
    const isHalf = !isFilled && starValue <= rating + 0.5;

    const iconName = isFilled
      ? 'star'
      : isHalf
        ? 'star-half'
        : 'star-outline';

    if (interactive) {
      return (
        <Pressable key={i} onPress={() => onRatingChange?.(starValue)} hitSlop={4}>
          <Ionicons name={iconName} size={size} color={color} />
        </Pressable>
      );
    }
    return <Ionicons key={i} name={iconName} size={size} color={color} />;
  });

  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
