import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

export type AppLanguage = 'ku' | 'kmr' | 'de' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';

interface AppState {
  language: AppLanguage;
  theme: AppTheme;
  hasSeenOnboarding: boolean;
  preferencesRestored: boolean;

  setLanguage: (lang: AppLanguage) => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  restorePreferences: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  theme: 'system',
  hasSeenOnboarding: false,
  preferencesRestored: false,

  setLanguage: async (language: AppLanguage) => {
    await AsyncStorage.setItem('app_language', language);
    await i18n.changeLanguage(language);
    set({ language });
  },

  setTheme: async (theme: AppTheme) => {
    await AsyncStorage.setItem('app_theme', theme);
    set({ theme });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    set({ hasSeenOnboarding: true });
  },

  restorePreferences: async () => {
    try {
      const [language, theme, onboarding] = await Promise.all([
        AsyncStorage.getItem('app_language'),
        AsyncStorage.getItem('app_theme'),
        AsyncStorage.getItem('has_seen_onboarding'),
      ]);
      const restoredLanguage = (language as AppLanguage) ?? 'en';
      await i18n.changeLanguage(restoredLanguage);
      set({
        language: restoredLanguage,
        theme: (theme as AppTheme) ?? 'system',
        hasSeenOnboarding: onboarding === 'true',
        preferencesRestored: true,
      });
    } catch {
      set({ preferencesRestored: true });
    }
  },
}));
