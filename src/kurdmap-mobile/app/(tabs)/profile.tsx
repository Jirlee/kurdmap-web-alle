import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { FadeInView } from '@/components/Animations';
import { gradients } from '@/theme';
import Constants from 'expo-constants';
import { useAppStore, type AppLanguage, type AppTheme } from '@/stores/app-store';
import i18n from '@/i18n';

const LANGUAGES: { code: AppLanguage; key: string }[] = [
  { code: 'ku', key: 'langKu' },
  { code: 'kmr', key: 'langKmr' },
  { code: 'de', key: 'langDe' },
  { code: 'en', key: 'langEn' },
];

const THEMES: { value: AppTheme; key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', key: 'profileLightMode', icon: 'sunny-outline' },
  { value: 'dark', key: 'profileDarkMode', icon: 'moon-outline' },
  { value: 'system', key: 'profileSystemMode', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { language, theme: appTheme, setLanguage, setTheme } = useAppStore();

  const handleLanguageChange = useCallback(
    async (lang: AppLanguage) => {
      await setLanguage(lang);
      i18n.changeLanguage(lang);
    },
    [setLanguage],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      {/* App Branding */}
      <FadeInView>
        <View style={styles.profileSection}>
          <LinearGradient
            colors={gradients.brandVivid}
            style={styles.avatar}
          >
            <Ionicons name="map" size={30} color="#FFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {t('appName')}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {t('aboutSubtitle')}
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* Language Selection */}
      <FadeInView delay={100}>
      <View style={[styles.section, { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, shadowColor: theme.colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <Ionicons name="language-outline" size={18} /> {t('profileLanguage')}
        </Text>
        <View style={styles.optionsRow}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.optionChip,
                language === lang.code
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text
                style={{
                  color: language === lang.code ? '#FFF' : theme.colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {t(lang.key)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      </FadeInView>

      {/* Theme Selection */}
      <FadeInView delay={200}>
      <View style={[styles.section, { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, shadowColor: theme.colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          <Ionicons name="color-palette-outline" size={18} /> {t('profileTheme')}
        </Text>
        <View style={styles.optionsRow}>
          {THEMES.map((th) => (
            <Pressable
              key={th.value}
              style={[
                styles.themeOption,
                appTheme === th.value
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setTheme(th.value)}
            >
              <Ionicons
                name={th.icon}
                size={18}
                color={appTheme === th.value ? '#FFF' : theme.colors.text}
              />
              <Text
                style={{
                  color: appTheme === th.value ? '#FFF' : theme.colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {t(th.key)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      </FadeInView>

      {/* About & Links */}
      <FadeInView delay={300}>
      <View style={[styles.section, { backgroundColor: theme.colors.glassStrong, borderColor: theme.colors.glassBorder, shadowColor: theme.colors.shadow }]}>
        <Pressable
          style={styles.navRow}
          onPress={() => router.push('/about')}
          accessibilityRole="button"
          accessibilityLabel={t('about')}
        >
          <View style={styles.navRowLeft}>
            <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.navRowText, { color: theme.colors.text }]}>{t('about')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        <View style={[styles.navDivider, { backgroundColor: theme.colors.border }]} />

        <Pressable
          style={styles.navRow}
          onPress={() => router.push('/contact')}
          accessibilityRole="button"
          accessibilityLabel={t('contactNav')}
        >
          <View style={styles.navRowLeft}>
            <Ionicons name="mail-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.navRowText, { color: theme.colors.text }]}>{t('contactNav')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        <View style={[styles.navDivider, { backgroundColor: theme.colors.border }]} />

        <Pressable
          style={styles.navRow}
          onPress={() => router.push('/policy' as any)}
          accessibilityRole="button"
          accessibilityLabel={t('policyLink')}
        >
          <View style={styles.navRowLeft}>
            <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.navRowText, { color: theme.colors.text }]}>{t('policyLink')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </Pressable>

        <View style={[styles.navDivider, { backgroundColor: theme.colors.border }]} />

        <View style={{ paddingTop: 8 }}>
          <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
            {t('profileVersion')} {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '600' },
  userEmail: { fontSize: 14, marginTop: 2 },
  loginLink: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 44,
  },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutText: { fontSize: 14 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 48,
  },
  navRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navRowText: { fontSize: 15, fontWeight: '500' },
  navDivider: { height: StyleSheet.hairlineWidth },
  version: { fontSize: 12, marginTop: 8 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 10,
  },
  deleteText: { fontSize: 13, fontWeight: '400' },
  deleteSection: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  deleteWarning: { fontSize: 13, fontWeight: '500', marginBottom: 12, lineHeight: 18 },
  deleteInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  deleteActions: { flexDirection: 'row', gap: 10 },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
