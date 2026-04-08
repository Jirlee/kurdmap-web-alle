import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;
  readonly categories = signal<Category[]>([]);

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      tap(categories => this.categories.set(categories))
    );
  }
}
