import { Injectable, inject, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  DashboardStats,
  Category,
  City,
  BusinessSummary,
  BusinessDetail,
  User,
  PaginatedList,
  CategoryPayload,
  BusinessPayload,
  CityPayload,
  CityUpdatePayload,
  MenuItemPayload,
  BusinessServicePayload,
  MenuItem,
  BusinessService,
  Advertisement,
  AdvertisementPayload,
  Review,
  DiscountPayload,
  RecommendedBusinesses,
} from '../models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  // === Dashboard ===
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/api/v1/dashboard/stats`);
  }

  // === Categories ===
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/api/v1/categories`);
  }

  createCategory(payload: CategoryPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/api/v1/categories`, payload);
  }

  updateCategory(id: string, payload: CategoryPayload): Observable<void> {
    return this.http.put<void>(`${this.base}/api/v1/categories/${encodeURIComponent(id)}`, payload);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/categories/${encodeURIComponent(id)}`);
  }

  // === Cities ===
  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/api/v1/cities`);
  }

  createCity(payload: CityPayload): Observable<City> {
    return this.http.post<City>(`${this.base}/api/v1/cities`, payload);
  }

  updateCity(id: string, payload: CityUpdatePayload): Observable<City> {
    return this.http.put<City>(`${this.base}/api/v1/cities/${encodeURIComponent(id)}`, payload);
  }

  deleteCity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/cities/${encodeURIComponent(id)}`);
  }

  // === Businesses ===
  getBusinesses(
    page = 1,
    pageSize = 10,
    status?: number | null,
    search?: string | null,
  ): Observable<PaginatedList<BusinessSummary>> {
    let params = new HttpParams()
      .set('pageNumber', page)
      .set('pageSize', pageSize);
    if (status != null) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedList<BusinessSummary>>(`${this.base}/api/v1/businesses`, { params });
  }

  getBusinessBySlug(slug: string): Observable<BusinessDetail> {
    return this.http.get<BusinessDetail>(`${this.base}/api/v1/businesses/${encodeURIComponent(slug)}`);
  }

  createBusiness(payload: BusinessPayload): Observable<BusinessDetail> {
    return this.http.post<BusinessDetail>(`${this.base}/api/v1/businesses`, payload);
  }

  updateBusiness(id: string, payload: BusinessPayload): Observable<BusinessDetail> {
    return this.http.put<BusinessDetail>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}`, payload);
  }

  verifyBusiness(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}/verify`, null);
  }

  toggleFeatured(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}/toggle-featured`, null);
  }

  setDiscount(id: string, payload: DiscountPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}/discount`, payload);
  }

  clearDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}/discount`);
  }

  getRecommendedBusinesses(count = 12): Observable<RecommendedBusinesses> {
    const params = new HttpParams().set('count', count);
    return this.http.get<RecommendedBusinesses>(`${this.base}/api/v1/businesses/recommended`, { params });
  }

  deleteBusiness(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(id)}`);
  }

  uploadBusinessImage(businessId: string, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<void>(`${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/images`, formData);
  }

  deleteBusinessImage(businessId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/images/${encodeURIComponent(imageId)}`,
    );
  }

  setPrimaryImage(businessId: string, imageId: string): Observable<void> {
    return this.http.put<void>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/images/${encodeURIComponent(imageId)}/primary`,
      null,
    );
  }

  // === Users ===
  getUsers(
    page = 1,
    pageSize = 10,
    search?: string | null,
    role?: string | null,
  ): Observable<PaginatedList<User>> {
    let params = new HttpParams()
      .set('pageNumber', page)
      .set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    return this.http.get<PaginatedList<User>>(`${this.base}/api/v1/users`, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/api/v1/users/${encodeURIComponent(id)}`);
  }

  changeUserRole(id: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.base}/api/v1/users/${encodeURIComponent(id)}/role`, { role });
  }

  changeUserStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/api/v1/users/${encodeURIComponent(id)}/status`, { isActive });
  }

  // === Menu Items ===
  createMenuItem(businessId: string, payload: MenuItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/menu-items`, payload);
  }

  deleteMenuItem(businessId: string, menuItemId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/menu-items/${encodeURIComponent(menuItemId)}`);
  }

  // === Business Services ===
  createBusinessService(businessId: string, payload: BusinessServicePayload): Observable<BusinessService> {
    return this.http.post<BusinessService>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/services`, payload);
  }

  deleteBusinessService(businessId: string, serviceId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/api/v1/businesses/${encodeURIComponent(businessId)}/services/${encodeURIComponent(serviceId)}`);
  }

  // === Advertisements ===
  getAdvertisements(activeOnly = false): Observable<Advertisement[]> {
    const params = new HttpParams().set('activeOnly', activeOnly);
    return this.http.get<Advertisement[]>(`${this.base}/api/v1/advertisements`, { params });
  }

  createAdvertisement(payload: AdvertisementPayload): Observable<Advertisement> {
    return this.http.post<Advertisement>(`${this.base}/api/v1/advertisements`, payload);
  }

  updateAdvertisement(id: string, payload: AdvertisementPayload): Observable<Advertisement> {
    return this.http.put<Advertisement>(`${this.base}/api/v1/advertisements/${encodeURIComponent(id)}`, payload);
  }

  toggleAdvertisement(id: string, activate: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/api/v1/advertisements/${encodeURIComponent(id)}/toggle`, { id, activate });
  }

  deleteAdvertisement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/advertisements/${encodeURIComponent(id)}`);
  }

  // === Reviews ===
  getReviews(approvedOnly?: boolean): Observable<Review[]> {
    let params = new HttpParams();
    if (approvedOnly !== undefined) params = params.set('approvedOnly', approvedOnly);
    return this.http.get<Review[]>(`${this.base}/api/v1/reviews`, { params });
  }

  approveReview(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/api/v1/reviews/${encodeURIComponent(id)}/approve`, null);
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/v1/reviews/${encodeURIComponent(id)}`);
  }
}
