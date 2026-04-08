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
import { useAuthStore } from '@/stores/auth-store';
import { MAX_LENGTHS } from '@/utils/validation';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    setLocalError(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      router.replace('/(tabs)');
    } catch {
      // Error is set in the store
    }
  }, [fullName, email, password, confirmPassword, register, router]);

  const displayError = localError ?? error;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('register')}</Text>
        </View>

        {/* Error */}
        {displayError && (
          <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {displayError}
            </Text>
            <Pressable onPress={() => { clearError(); setLocalError(null); }}>
              <Ionicons name="close" size={18} color={theme.colors.error} />
            </Pressable>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('fullName')}</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="person-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('fullName')}
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={MAX_LENGTHS.fullName}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('email')}</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
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
              maxLength={MAX_LENGTHS.email}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('password')}</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('password')}
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={MAX_LENGTHS.password}
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

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('confirmPassword')}</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('confirmPassword')}
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
            />
          </View>
        </View>

        {/* Privacy Policy Agreement */}
        <View style={styles.policyRow}>
          <Pressable
            onPress={() => setAgreedToPolicy(!agreedToPolicy)}
            style={[
              styles.checkbox,
              {
                borderColor: agreedToPolicy ? theme.colors.primary : theme.colors.border,
                backgroundColor: agreedToPolicy ? theme.colors.primary : 'transparent',
              },
            ]}
            hitSlop={8}
          >
            {agreedToPolicy && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </Pressable>
          <Text style={[styles.policyText, { color: theme.colors.textSecondary }]}>
            {t('policyAgree')}{' '}
            <Text
              style={{ color: theme.colors.primary, fontWeight: '500' }}
              onPress={() => router.push('/policy' as any)}
            >
              {t('policyLink')}
            </Text>
          </Text>
        </View>

        {/* Register Button */}
        <Pressable
          style={[
            styles.registerBtn,
            { backgroundColor: theme.colors.primary },
            (isLoading || !agreedToPolicy) && { opacity: 0.5 },
          ]}
          onPress={handleRegister}
          disabled={isLoading || !agreedToPolicy}
        >
          <Text style={styles.registerBtnText}>
            {isLoading ? '...' : t('register')}
          </Text>
        </Pressable>

        {/* Login Link */}
        <Pressable
          style={styles.loginLink}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
            {t('hasAccount')}{' '}
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
              {t('login')}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  container: { paddingHorizontal: 24, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, fontWeight: '500', flex: 1 },
  inputGroup: { marginBottom: 14 },
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
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyText: { fontSize: 13, flex: 1, lineHeight: 18 },
  registerBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: 14 },
});
