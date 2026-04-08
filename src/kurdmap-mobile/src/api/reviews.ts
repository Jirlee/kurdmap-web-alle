import { apiClient } from './client';
import type { Review, CreateReviewRequest } from '@/types/api';

export const reviewsApi = {
  getByBusiness(businessId: string): Promise<Review[]> {
    return apiClient
      .get<Review[]>(`/reviews/business/${businessId}`)
      .then((r) => r.data);
  },

  create(data: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>('/reviews', data).then((r) => r.data);
  },
};
