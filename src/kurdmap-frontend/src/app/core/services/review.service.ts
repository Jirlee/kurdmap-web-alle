import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReviewDto {
  id: string;
  businessId: string;
  userId: string;
  userFullName?: string | null;
  rating: number;
  comment?: string | null;
  isApproved: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;
  readonly reviews = signal<ReviewDto[]>([]);
  readonly loading = signal(false);

  getByBusiness(businessId: string): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${this.apiUrl}/business/${businessId}`);
  }

  loadByBusiness(businessId: string): void {
    this.loading.set(true);
    this.getByBusiness(businessId).subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
