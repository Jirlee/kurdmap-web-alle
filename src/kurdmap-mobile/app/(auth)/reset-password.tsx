import React, { useState, useCallback, useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { authApi } from '@/api/auth';
import { FadeInView } from '@/components/Animations';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validation = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  const isValid = validation.minLength && validation.hasUppercase && validation.hasNumber && validation.passwordsMatch;

  const handleReset = useCallback(async () => {
    if (!isValid || !token || !email) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, token, newPassword: password });
      setIsSuccess(true);
    } catch {
      setError(t('serverError'));
    } finally {
      setIsLoading(false);
    }
  }, [isValid, token, email, password, t]);

  if (isSuccess) {
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
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('resetPasswordSuccess')}
            </Text>
            <Pressable
              style={[styles.btn, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.btnText}>{t('resetPasswordGoToLogin')}</Text>
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
            <Ionicons name="lock-open" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('resetPasswordTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('resetPasswordDesc')}
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

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('newPassword')}</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('newPassword')}
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirements}>
          <RequirementRow met={validation.minLength} label={t('passwordMinLength')} theme={theme} />
          <RequirementRow met={validation.hasUppercase} label={t('passwordRequireUppercase')} theme={theme} />
          <RequirementRow met={validation.hasNumber} label={t('passwordRequireNumber')} theme={theme} />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('confirmPassword')}</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('confirmPassword')}
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.btn,
            { backgroundColor: theme.colors.primary },
            (!isValid || isLoading) && { opacity: 0.5 },
          ]}
          onPress={handleReset}
          disabled={!isValid || isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? '...' : t('resetPasswordSubmit')}
          </Text>
        </Pressable>

        {/* Back to Login */}
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
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

function RequirementRow({ met, label, theme }: { met: boolean; label: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? theme.colors.primary : theme.colors.textTertiary}
      />
      <Text style={[styles.reqText, { color: met ? theme.colors.text : theme.colors.textTertiary }]}>
        {label}
      </Text>
    </View>
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
  requirements: {
    marginBottom: 20,
    gap: 6,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqText: { fontSize: 13 },
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
