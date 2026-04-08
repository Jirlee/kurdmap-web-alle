import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { FadeInView } from '@/components/Animations';

const CONTACT_EMAIL = 'info@kurdmap.de';

export default function ContactScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(t('error'), t('contactFillAll'));
      return;
    }

    const subject = encodeURIComponent(`KurdMap Contact: ${name.trim()}`);
    const body = encodeURIComponent(`From: ${name.trim()} (${email.trim()})\n\n${message.trim()}`);
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
    setSubmitted(true);
  }, [name, email, message, t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
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
                <Ionicons name="mail" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.headerTitle}>{t('contactTitle')}</Text>
              <Text style={styles.headerSubtitle}>{t('contactSubtitle')}</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        {/* Contact Info Cards */}
        <FadeInView delay={100}>
          <View style={styles.infoCards}>
            <InfoCard
              icon="mail-outline"
              title={t('contactEmailTitle')}
              value="info@kurdmap.de"
              color={theme.colors.primary}
              theme={theme}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            />
            <InfoCard
              icon="location-outline"
              title={t('contactLocationTitle')}
              value={t('contactLocationText')}
              color="#10B981"
              theme={theme}
            />
            <InfoCard
              icon="time-outline"
              title={t('contactResponseTitle')}
              value={t('contactResponseText')}
              color="#3B82F6"
              theme={theme}
            />
          </View>
        </FadeInView>

        {/* Contact Form */}
        <FadeInView delay={200}>
          <View style={[styles.formCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
            {submitted ? (
              <View style={styles.successView}>
                <View style={[styles.successIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                  <Ionicons name="checkmark-circle" size={40} color={theme.colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.colors.text }]}>
                  {t('contactSuccess')}
                </Text>
                <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
                  {t('contactSuccessText')}
                </Text>
                <Pressable
                  style={[styles.resetBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                >
                  <Text style={styles.resetBtnText}>{t('contactSendAnother')}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={[styles.formTitle, { color: theme.colors.text }]}>
                  {t('contactFormTitle')}
                </Text>

                <Text style={[styles.label, { color: theme.colors.text }]}>{t('fullName')}</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('fullName')}
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, { color: theme.colors.text }]}>{t('email')}</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('email')}
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={[styles.label, { color: theme.colors.text }]}>{t('contactMessage')}</Text>
                <TextInput
                  style={[styles.textArea, { color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('contactMessagePlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                <Pressable
                  style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSubmit}
                  accessibilityRole="button"
                  accessibilityLabel={t('contactSend')}
                >
                  <Ionicons name="send" size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>{t('contactSend')}</Text>
                </Pressable>
              </>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoCard({
  icon,
  title,
  value,
  color,
  theme,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
  theme: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.infoIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.infoValue, { color: onPress ? theme.colors.primary : theme.colors.textSecondary }]}>
          {value}
        </Text>
      </View>
    </Pressable>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
  infoCards: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13 },
  formCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    minHeight: 52,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  successView: { alignItems: 'center', paddingVertical: 24 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  successText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
