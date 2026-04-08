import { apiClient } from './client';
import type { Advertisement } from '@/types/api';

export const advertisementsApi = {
  getActive(): Promise<Advertisement[]> {
    return apiClient
      .get<Advertisement[]>('/advertisements', { params: { activeOnly: true } })
      .then((r) => r.data);
  },
};
