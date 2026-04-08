import React, { useCallback } from 'react';
import { Text, StyleSheet, Pressable, FlatList, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { ScaleOnPress } from '@/components/Animations';
import { getCityName } from '@/utils/localization';
import type { City } from '@/types/api';

const CITY_GRADIENTS: [string, string][] = [
  ['#10B981', '#059669'],
  ['#6366F1', '#4F46E5'],
  ['#F59E0B', '#D97706'],
  ['#EC4899', '#DB2777'],
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
];

interface Props {
  cities: City[];
}

export const CitySelector = React.memo(function CitySelector({ cities }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = useCallback(
    (city: City) => {
      router.push({
        pathname: '/(tabs)/search',
        params: { city: city.id },
      } as any);
    },
    [router],
  );

  const renderCity = useCallback(
    ({ item, index }: { item: City; index: number }) => {
      const gradient = CITY_GRADIENTS[index % CITY_GRADIENTS.length];
      return (
        <ScaleOnPress>
          <Pressable
            style={[styles.card, { shadowColor: theme.colors.shadow }]}
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            accessibilityLabel={getCityName(item)}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Ionicons name="location" size={24} color="rgba(255,255,255,0.4)" style={styles.bgIcon} />
              <Text style={styles.cityName} numberOfLines={1}>
                {getCityName(item)}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScaleOnPress>
      );
    },
    [theme.colors.shadow, handlePress],
  );

  return (
    <FlatList
      data={cities}
      renderItem={renderCity}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  card: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  gradient: {
    width: 130,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  bgIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cityName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
