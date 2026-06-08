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
  ['#22C55E', '#15803D'],
  ['#10B981', '#047857'],
  ['#4ADE80', '#16A34A'],
  ['#FACC15', '#22C55E'],
  ['#16A34A', '#14532D'],
  ['#84CC16', '#15803D'],
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
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
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
