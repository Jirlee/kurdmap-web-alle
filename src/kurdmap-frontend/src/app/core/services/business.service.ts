import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusinessSummary, BusinessDetail, BusinessSortOption, PaginatedList, RecommendedBusinesses } from '../models';

export interface SearchParams {
  search?: string;
  city?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: BusinessSortOption;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/businesses`;
  readonly loading = signal(false);

  search(params: SearchParams): Observable<PaginatedList<BusinessSummary>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.sort !== undefined) httpParams = httpParams.set('sort', params.sort.toString());
    if (params.latitude !== undefined) httpParams = httpParams.set('latitude', params.latitude.toString());
    if (params.longitude !== undefined) httpParams = httpParams.set('longitude', params.longitude.toString());
    if (params.radiusKm !== undefined) httpParams = httpParams.set('radiusKm', params.radiusKm.toString());

    return this.http.get<PaginatedList<BusinessSummary>>(`${this.apiUrl}/search`, { params: httpParams });
  }

  getBySlug(slug: string): Observable<BusinessDetail> {
    return this.http.get<BusinessDetail>(`${this.apiUrl}/${slug}`);
  }

  getList(page = 1, pageSize = 10): Observable<PaginatedList<BusinessSummary>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedList<BusinessSummary>>(this.apiUrl, { params });
  }

  getRecommended(count = 12): Observable<RecommendedBusinesses> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<RecommendedBusinesses>(`${this.apiUrl}/recommended`, { params });
  }
}
