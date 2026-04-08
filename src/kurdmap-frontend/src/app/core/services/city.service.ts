import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { City } from '../models';

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cities`;
  readonly cities = signal<City[]>([]);

  getAll(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl).pipe(
      tap(cities => this.cities.set(cities))
    );
  }
}
