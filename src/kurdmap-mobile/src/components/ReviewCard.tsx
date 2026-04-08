import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { StarRating } from './StarRating';
import type { Review } from '@/types/api';

interface Props {
  review: Review;
}

export const ReviewCard = React.memo(function ReviewCard({ review }: Props) {
  const theme = useTheme();

  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(review.userFullName ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {review.userFullName ?? 'Anonymous'}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>{date}</Text>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>
      {review.comment && (
        <Text style={[styles.comment, { color: theme.colors.textSecondary }]}>
          {review.comment}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    marginTop: 1,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
});
