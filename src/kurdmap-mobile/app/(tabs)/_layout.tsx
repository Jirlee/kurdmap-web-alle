import React, { useRef, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { haptic } from '@/utils/haptics';

function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => haptic.light(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          paddingBottom: Platform.OS === 'ios' ? 0 : 6,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 84 : 62,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'home' : 'home-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabSearch'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'search' : 'search-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabMap'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'map' : 'map-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabFavorites'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'heart' : 'heart-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name={focused ? 'person' : 'person-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
