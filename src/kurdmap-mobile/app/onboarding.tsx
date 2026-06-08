import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
  Platform,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/stores/app-store';
import { FadeInView } from '@/components/Animations';

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  titleKey: string;
  descKey: string;
}

const SLIDES: Slide[] = [
  {
    key: 'discover',
    icon: 'map',
    colors: ['#10B981', '#059669'],
    titleKey: 'onboardingDiscoverTitle',
    descKey: 'onboardingDiscoverDesc',
  },
  {
    key: 'search',
    icon: 'search',
    colors: ['#22C55E', '#15803D'],
    titleKey: 'onboardingSearchTitle',
    descKey: 'onboardingSearchDesc',
  },
  {
    key: 'review',
    icon: 'star',
    colors: ['#F59E0B', '#D97706'],
    titleKey: 'onboardingReviewTitle',
    descKey: 'onboardingReviewDesc',
  },
  {
    key: 'languages',
    icon: 'globe',
    colors: ['#84CC16', '#4D7C0F'],
    titleKey: 'onboardingLanguagesTitle',
    descKey: 'onboardingLanguagesDesc',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleFinish = useCallback(async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, router]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      handleFinish();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [isLastSlide, currentIndex, handleFinish]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={[styles.slide, { width }]}>
        <FadeInView delay={200}>
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name={item.icon} size={64} color="#FFF" />
          </LinearGradient>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={[styles.slideTitle, { color: theme.colors.text }]}>
            {t(item.titleKey)}
          </Text>
        </FadeInView>

        <FadeInView delay={600}>
          <Text style={[styles.slideDesc, { color: theme.colors.textSecondary }]}>
            {t(item.descKey)}
          </Text>
        </FadeInView>
      </View>
    ),
    [width, theme, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Skip button */}
      {!isLastSlide && (
        <Pressable
          style={[styles.skipBtn, { top: insets.top + 16 }]}
          onPress={handleFinish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('onboardingSkip')}
        >
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            {t('onboardingSkip')}
          </Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingTop: height * 0.15 }}
      />

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? theme.colors.primary : theme.colors.border,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? t('onboardingGetStarted') : t('onboardingNext')}
        >
          {isLastSlide ? (
            <Text style={styles.actionBtnText}>{t('onboardingGetStarted')}</Text>
          ) : (
            <View style={styles.nextRow}>
              <Text style={styles.actionBtnText}>{t('onboardingNext')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: { fontSize: 16, fontWeight: '500' },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slideDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
