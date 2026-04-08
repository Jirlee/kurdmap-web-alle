import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface Props {
  latitude: number;
  longitude: number;
}

export function MapPreview({ latitude, longitude }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      <Marker coordinate={{ latitude, longitude }} pinColor="#10B981" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 160, borderRadius: 12, overflow: 'hidden' },
});
