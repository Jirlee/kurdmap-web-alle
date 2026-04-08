import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubmitContactRequest {
  name: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/contact`;

  submit(data: SubmitContactRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, data);
  }
}
