import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { authApi } from '@/api/auth';
import { FadeInView } from '@/components/Animations';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = useCallback(async () => {
    if (!email.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSent(true);
    } catch {
      setError(t('serverError'));
    } finally {
      setIsLoading(false);
    }
  }, [email, t]);

  if (isSent) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <FadeInView delay={0}>
          <View style={styles.successContainer}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="mail-open" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('forgotPasswordSuccess')}
            </Text>
            <Pressable
              style={[styles.btn, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.btnText}>{t('forgotPasswordBackToLogin')}</Text>
            </Pressable>
          </View>
        </FadeInView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Ionicons name="key" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('forgotPasswordTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('forgotPasswordDesc')}
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <Pressable onPress={() => setError('')}>
              <Ionicons name="close" size={18} color={theme.colors.error} />
            </Pressable>
          </View>
        ) : null}

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('email')}</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="mail-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('email')}
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
        </View>

        {/* Send Button */}
        <Pressable
          style={[
            styles.btn,
            { backgroundColor: theme.colors.primary },
            isLoading && { opacity: 0.7 },
          ]}
          onPress={handleSend}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? '...' : t('forgotPasswordSend')}
          </Text>
        </Pressable>

        {/* Back to Login */}
        <Pressable
          onPress={() => router.back()}
          style={styles.backLink}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.textTertiary} />
          <Text style={[styles.backText, { color: theme.colors.textTertiary }]}>
            {t('forgotPasswordBackToLogin')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, fontWeight: '500', flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 24,
  },
  backText: { fontSize: 14 },
});
