import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { getAdTitle } from '@/utils/localization';
import type { Advertisement } from '@/types/api';

interface Props {
  ads: Advertisement[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function AdBanner({ ads }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePress = useCallback(
    (ad: Advertisement) => {
      if (ad.businessId) {
        // Navigate to business — we'll need the slug, but for now use the businessId
        // In practice, the ad might include a linkUrl
      }
      if (ad.linkUrl) {
        // External link handling would go here
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
      setActiveIndex(index);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Advertisement }) => (
      <Pressable
        style={[styles.adCard, { shadowColor: theme.colors.shadow }]}
        onPress={() => handlePress(item)}
        accessibilityRole="button"
        accessibilityLabel={getAdTitle(item)}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.adImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.adOverlay}
        >
          <Text style={styles.adTitle} numberOfLines={2}>
            {getAdTitle(item)}
          </Text>
        </LinearGradient>
      </Pressable>
    ),
    [theme, handlePress],
  );

  if (ads.length === 0) return null;

  return (
    <View>
      <FlatList
        data={ads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH - 32}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      {ads.length > 1 && (
        <View style={styles.pagination}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? theme.colors.primary : theme.colors.border,
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  adCard: {
    width: SCREEN_WIDTH - 32,
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 5 },
    }),
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  adTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
