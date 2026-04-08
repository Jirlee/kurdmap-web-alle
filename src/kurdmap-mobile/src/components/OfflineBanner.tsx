import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const { t } = useTranslation();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
      <Text style={styles.text}>{t('networkError')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
