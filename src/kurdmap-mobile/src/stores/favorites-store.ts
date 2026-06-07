import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kurdmap:favorites';

interface FavoritesState {
  /** Set of favorited business IDs. */
  ids: string[];
  /** True once the persisted favorites have been loaded from storage. */
  hydrated: boolean;

  isFavorite: (businessId: string) => boolean;
  toggle: (businessId: string) => Promise<void>;
  clear: () => Promise<void>;
  restore: () => Promise<void>;
}

/**
 * Device-local favorites. No account or backend is required — favorites are
 * stored privately on the device via AsyncStorage and never leave it.
 */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  hydrated: false,

  isFavorite: (businessId: string) => get().ids.includes(businessId),

  toggle: async (businessId: string) => {
    const current = get().ids;
    const next = current.includes(businessId)
      ? current.filter((id) => id !== businessId)
      : [...current, businessId];
    set({ ids: next });
    await persist(next);
  },

  clear: async () => {
    set({ ids: [] });
    await persist([]);
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      set({ ids: Array.isArray(ids) ? ids : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

async function persist(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Best-effort persistence; ignore storage write failures.
  }
}
