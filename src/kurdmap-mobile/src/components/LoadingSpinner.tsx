import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'large', fullScreen = false }: Props) {
  const theme = useTheme();

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    padding: 20,
    alignItems: 'center',
  },
});
