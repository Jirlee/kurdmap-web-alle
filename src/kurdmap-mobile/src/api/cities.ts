import { apiClient } from './client';
import type { City } from '@/types/api';

export const citiesApi = {
  getAll(): Promise<City[]> {
    return apiClient.get<City[]>('/cities').then((r) => r.data);
  },
};
