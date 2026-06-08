import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { FadeInView, StaggerChildren } from '@/components/Animations';

const FEATURES = [
  { icon: 'language-outline' as const, colorHex: '#10B981', key: 'multilingual' },
  { icon: 'map-outline' as const, colorHex: '#16A34A', key: 'map' },
  { icon: 'phone-portrait-outline' as const, colorHex: '#F59E0B', key: 'mobile' },
  { icon: 'shield-checkmark-outline' as const, colorHex: '#65A30D', key: 'verified' },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <FadeInView>
          <View style={styles.headerContent}>
            <View style={styles.logoBadge}>
              <Ionicons name="information-circle" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{t('aboutTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('aboutSubtitle')}</Text>
          </View>
        </FadeInView>
      </LinearGradient>

      {/* Mission */}
      <FadeInView delay={100}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              {t('aboutMissionTitle')}
            </Text>
          </View>
          <Text style={[styles.cardText, { color: theme.colors.textSecondary }]}>
            {t('aboutMissionText')}
          </Text>
        </View>
      </FadeInView>

      {/* Features Grid */}
      <FadeInView delay={200}>
        <View style={styles.featuresGrid}>
          <StaggerChildren stagger={100}>
            {FEATURES.map((feat) => (
              <View
                key={feat.key}
                style={[styles.featureCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feat.colorHex}15` }]}>
                  <Ionicons name={feat.icon} size={22} color={feat.colorHex} />
                </View>
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {t(`aboutFeature_${feat.key}_title`)}
                </Text>
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  {t(`aboutFeature_${feat.key}_text`)}
                </Text>
              </View>
            ))}
          </StaggerChildren>
        </View>
      </FadeInView>

      {/* Open Source */}
      <FadeInView delay={400}>
        <LinearGradient
          colors={[`${theme.colors.primary}15`, `${theme.colors.primary}08`]}
          style={styles.openSourceCard}
        >
          <Ionicons name="logo-github" size={32} color={theme.colors.primary} />
          <Text style={[styles.openSourceTitle, { color: theme.colors.text }]}>
            {t('aboutOpenSourceTitle')}
          </Text>
          <Text style={[styles.openSourceText, { color: theme.colors.textSecondary }]}>
            {t('aboutOpenSourceText')}
          </Text>
        </LinearGradient>
      </FadeInView>

      {/* Version Info */}
      <FadeInView delay={500}>
        <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
          {t('profileVersion')} 1.0.0
        </Text>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
  },
  featuresGrid: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 20,
  },
  openSourceCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  openSourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  openSourceText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
