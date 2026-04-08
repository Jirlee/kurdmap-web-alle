import { act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/stores/app-store';

describe('app-store', () => {
  beforeEach(() => {
    useAppStore.setState({
      language: 'de',
      theme: 'system',
      hasSeenOnboarding: false,
      preferencesRestored: false,
    });
    jest.clearAllMocks();
  });

  describe('setLanguage', () => {
    it('updates language and persists', async () => {
      await act(async () => {
        await useAppStore.getState().setLanguage('ku');
      });

      expect(useAppStore.getState().language).toBe('ku');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'ku');
    });
  });

  describe('setTheme', () => {
    it('updates theme and persists', async () => {
      await act(async () => {
        await useAppStore.getState().setTheme('dark');
      });

      expect(useAppStore.getState().theme).toBe('dark');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark');
    });
  });

  describe('completeOnboarding', () => {
    it('sets flag and persists', async () => {
      await act(async () => {
        await useAppStore.getState().completeOnboarding();
      });

      expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('has_seen_onboarding', 'true');
    });
  });

  describe('restorePreferences', () => {
    it('restores stored values', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('en')   // language
        .mockResolvedValueOnce('dark') // theme
        .mockResolvedValueOnce('true'); // onboarding

      await act(async () => {
        await useAppStore.getState().restorePreferences();
      });

      const state = useAppStore.getState();
      expect(state.language).toBe('en');
      expect(state.theme).toBe('dark');
      expect(state.hasSeenOnboarding).toBe(true);
      expect(state.preferencesRestored).toBe(true);
    });

    it('uses defaults when nothing stored', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null) // language
        .mockResolvedValueOnce(null) // theme
        .mockResolvedValueOnce(null); // onboarding

      await act(async () => {
        await useAppStore.getState().restorePreferences();
      });

      const state = useAppStore.getState();
      expect(state.language).toBe('de');
      expect(state.theme).toBe('system');
      expect(state.hasSeenOnboarding).toBe(false);
      expect(state.preferencesRestored).toBe(true);
    });

    it('sets preferencesRestored even on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await act(async () => {
        await useAppStore.getState().restorePreferences();
      });

      expect(useAppStore.getState().preferencesRestored).toBe(true);
    });
  });
});
