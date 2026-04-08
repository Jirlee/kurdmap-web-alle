import { apiClient } from './client';
import type {
  BusinessDetail,
  BusinessSearchParams,
  BusinessSummary,
  PaginatedList,
  RecommendedBusinesses,
} from '@/types/api';

export const businessesApi = {
  search(params: BusinessSearchParams): Promise<PaginatedList<BusinessSummary>> {
    return apiClient
      .get<PaginatedList<BusinessSummary>>('/businesses/search', { params })
      .then((r) => r.data);
  },

  list(params: {
    pageNumber?: number;
    pageSize?: number;
    categoryId?: string;
    cityId?: string;
    status?: number;
    search?: string;
  }): Promise<PaginatedList<BusinessSummary>> {
    return apiClient
      .get<PaginatedList<BusinessSummary>>('/businesses', { params })
      .then((r) => r.data);
  },

  getBySlug(slug: string): Promise<BusinessDetail> {
    return apiClient.get<BusinessDetail>(`/businesses/${slug}`).then((r) => r.data);
  },

  getRecommended(count = 12): Promise<RecommendedBusinesses> {
    return apiClient
      .get<RecommendedBusinesses>('/businesses/recommended', { params: { count } })
      .then((r) => r.data);
  },
};
