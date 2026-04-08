import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'search-outline', title, subtitle }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={theme.colors.textTertiary} />
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
