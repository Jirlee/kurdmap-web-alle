import React, { useCallback, useState } from 'react';
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch {
      // Error is set in the store
    }
  }, [email, password, login, router]);

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
          <View style={[styles.logoContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Ionicons name="map" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('appName')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('homeSubtitle')}
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}15` }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{t('loginError')}</Text>
            <Pressable onPress={clearError}>
              <Ionicons name="close" size={18} color={theme.colors.error} />
            </Pressable>
          </View>
        )}

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
              maxLength={MAX_LENGTHS.email}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('password')}</Text>
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
              placeholder={t('password')}
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
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

        {/* Forgot Password */}
        <Pressable
          onPress={() => router.push('/(auth)/forgot-password' as any)}
          style={styles.forgotLink}
        >
          <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
            {t('forgotPassword')}
          </Text>
        </Pressable>

        {/* Login Button */}
        <Pressable
          style={[
            styles.loginBtn,
            { backgroundColor: theme.colors.primary },
            isLoading && { opacity: 0.7 },
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.loginBtnText}>...</Text>
          ) : (
            <Text style={styles.loginBtnText}>{t('login')}</Text>
          )}
        </Pressable>

        {/* Register Link */}
        <Pressable
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
            {t('noAccount')}{' '}
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
              {t('register')}
            </Text>
          </Text>
        </Pressable>

        {/* Back to Home */}
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={theme.colors.textTertiary} />
          <Text style={[styles.backText, { color: theme.colors.textTertiary }]}>
            {t('back')}
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
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
  forgotLink: { alignItems: 'flex-end', marginBottom: 4 },
  forgotText: { fontSize: 14, fontWeight: '500' },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 24,
  },
  backText: { fontSize: 14 },
});
