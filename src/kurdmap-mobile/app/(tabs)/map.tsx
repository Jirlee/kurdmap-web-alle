import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLocation } from '@/hooks/useLocation';
import { businessesApi } from '@/api/businesses';
import { getLocalizedName } from '@/utils/localization';
import type { BusinessSummary } from '@/types/api';

// Default: center of Cologne
const DEFAULT_REGION: Region = {
  latitude: 50.9375,
  longitude: 6.9603,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();
  const mapRef = useRef<MapView>(null);
  const [_showList, _setShowList] = useState(false);

  const businessesQuery = useQuery({
    queryKey: ['businesses', 'map'],
    queryFn: () => businessesApi.search({ pageSize: 100 }),
  });

  const businesses = businessesQuery.data?.items ?? [];

  const initialRegion = useMemo<Region>(() => {
    if (location.latitude && location.longitude) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return DEFAULT_REGION;
  }, [location]);

  const goToDetail = useCallback(
    (slug: string) => {
      router.push(`/business/${slug}`);
    },
    [router],
  );

  const centerOnUser = useCallback(() => {
    if (location.latitude && location.longitude) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [location]);

  if (businessesQuery.isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {businesses.map((biz: BusinessSummary) => (
          <Marker
            key={biz.id}
            coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
            pinColor={biz.isFeatured ? '#F59E0B' : '#10B981'}
          >
            <Callout onPress={() => goToDetail(biz.slug)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{getLocalizedName(biz.name)}</Text>
                <Text style={styles.calloutAddress}>
                  {biz.street}, {biz.postalCode}
                </Text>
                {biz.isVerified && (
                  <View style={styles.calloutBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.calloutBadgeText}>{t('businessVerified')}</Text>
                  </View>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* My Location Button */}
      <Pressable
        style={[
          styles.locationBtn,
          { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, top: insets.top + 12 },
        ]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={22} color={theme.colors.primary} />
      </Pressable>

      {/* Business count badge */}
      <View
        style={[
          styles.countBadge,
          { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, bottom: insets.bottom + 16 },
        ]}
      >
        <Ionicons name="business-outline" size={16} color={theme.colors.primary} />
        <Text style={[styles.countText, { color: theme.colors.text }]}>
          {businesses.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  locationBtn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  callout: {
    padding: 4,
    minWidth: 150,
    maxWidth: 220,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  calloutBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  countBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
