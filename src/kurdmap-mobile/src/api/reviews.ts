import { apiClient } from './client';
import type { Review } from '@/types/api';

export const reviewsApi = {
  getByBusiness(businessId: string): Promise<Review[]> {
    return apiClient
      .get<Review[]>(`/reviews/business/${businessId}`)
      .then((r) => r.data);
  },
};
