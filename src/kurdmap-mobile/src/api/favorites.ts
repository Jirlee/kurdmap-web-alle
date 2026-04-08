import { apiClient } from './client';
import type { Favorite, ToggleFavoriteRequest, ToggleFavoriteResult } from '@/types/api';

export const favoritesApi = {
  getUserFavorites(userId: string): Promise<Favorite[]> {
    return apiClient.get<Favorite[]>(`/favorites/${userId}`).then((r) => r.data);
  },

  toggle(data: ToggleFavoriteRequest): Promise<ToggleFavoriteResult> {
    return apiClient
      .post<ToggleFavoriteResult>('/favorites', data)
      .then((r) => r.data);
  },
};
