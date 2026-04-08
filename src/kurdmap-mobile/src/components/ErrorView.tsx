import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('error')}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message ?? t('unknownError')}
      </Text>
      {onRetry && (
        <Pressable
          style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>{t('retry')}</Text>
        </Pressable>
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
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
