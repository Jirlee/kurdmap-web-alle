import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  latitude: number;
  longitude: number;
}

export function MapPreview({ latitude, longitude }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Map preview (lat: {latitude.toFixed(4)}, lng: {longitude.toFixed(4)})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#6B7280', fontSize: 13 },
});
