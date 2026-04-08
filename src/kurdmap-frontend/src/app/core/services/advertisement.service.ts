import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdvertisementItem {
  id: string;
  titleKu: string;
  titleKmr: string | null;
  titleDe: string;
  titleEn: string | null;
  descriptionKu: string | null;
  descriptionDe: string | null;
  imageUrl: string;
  linkUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class AdvertisementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/advertisements`;
  readonly ads = signal<AdvertisementItem[]>([]);
  readonly loading = signal(false);

  getActiveAds(): Observable<AdvertisementItem[]> {
    const params = new HttpParams().set('activeOnly', true);
    return this.http.get<AdvertisementItem[]>(this.apiUrl, { params }).pipe(
      catchError(() => of([])),
    );
  }

  loadActiveAds(): void {
    this.loading.set(true);
    this.getActiveAds().subscribe({
      next: (data) => {
        this.ads.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
