import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { FadeInView } from '@/components/Animations';

type Tab = 'privacy' | 'terms';

interface PolicySection {
  titleKey: string;
  contentKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRIVACY_SECTIONS: PolicySection[] = [
  { titleKey: 'policyIntroTitle', contentKey: 'policyIntroText', icon: 'shield-checkmark-outline' },
  { titleKey: 'policyDataTitle', contentKey: 'policyDataText', icon: 'server-outline' },
  { titleKey: 'policyStorageTitle', contentKey: 'policyStorageText', icon: 'phone-portrait-outline' },
  { titleKey: 'policyThirdPartyTitle', contentKey: 'policyThirdPartyText', icon: 'globe-outline' },
  { titleKey: 'policyRightsTitle', contentKey: 'policyRightsText', icon: 'person-outline' },
  { titleKey: 'policyContactTitle', contentKey: 'policyContactText', icon: 'mail-outline' },
];

const TERMS_SECTIONS: PolicySection[] = [
  { titleKey: 'termsAcceptanceTitle', contentKey: 'termsAcceptanceText', icon: 'document-text-outline' },
  { titleKey: 'termsUsageTitle', contentKey: 'termsUsageText', icon: 'checkmark-circle-outline' },
  { titleKey: 'termsContentTitle', contentKey: 'termsContentText', icon: 'create-outline' },
  { titleKey: 'termsLiabilityTitle', contentKey: 'termsLiabilityText', icon: 'alert-circle-outline' },
  { titleKey: 'termsChangesTitle', contentKey: 'termsChangesText', icon: 'refresh-outline' },
];

export default function PolicyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('privacy');

  const sections = activeTab === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {activeTab === 'privacy' ? t('policyTitle') : t('termsTitle')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabRow, { borderColor: theme.colors.border }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'privacy' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'privacy' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            {t('policyTitle')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'terms' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('terms')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'terms' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            {t('termsTitle')}
          </Text>
        </Pressable>
      </View>

      {/* Sections */}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {sections.map((section, index) => (
          <FadeInView key={section.titleKey} delay={index * 80}>
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t(section.titleKey)}
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                {t(section.contentKey)}
              </Text>
            </View>
          </FadeInView>
        ))}

        {/* Last Updated */}
        <Text style={[styles.lastUpdated, { color: theme.colors.textTertiary }]}>
          {t('policyLastUpdated')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  sectionText: { fontSize: 14, lineHeight: 22 },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
});
