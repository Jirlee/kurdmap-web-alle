import { apiClient } from './client';
import type { Category } from '@/types/api';

export const categoriesApi = {
  getAll(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories').then((r) => r.data);
  },
};
