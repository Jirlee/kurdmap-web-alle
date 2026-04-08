import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, API_BASE_URL } from './api.service';
import type { DiscountPayload, RecommendedBusinesses } from '../models';

describe('ApiService – Discounts', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  const BASE = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should set discount on a business', () => {
    const payload: DiscountPayload = {
      id: 'biz-1',
      percentage: 20,
      description: { ku: 'داشکاندن', de: 'Rabatt' },
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    };
    let called = false;
    api.setDiscount('biz-1', payload).subscribe(() => (called = true));

    const req = httpMock.expectOne(`${BASE}/api/v1/businesses/biz-1/discount`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
    expect(called).toBe(true);
  });

  it('should clear discount from a business', () => {
    let called = false;
    api.clearDiscount('biz-1').subscribe(() => (called = true));

    const req = httpMock.expectOne(`${BASE}/api/v1/businesses/biz-1/discount`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(called).toBe(true);
  });

  it('should fetch recommended businesses with default count', () => {
    const mockRecommended: RecommendedBusinesses = {
      featured: [],
      discounted: [],
    };
    let result: RecommendedBusinesses | undefined;
    api.getRecommendedBusinesses().subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/businesses/recommended`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('count')).toBe('12');
    req.flush(mockRecommended);
    expect(result).toEqual(mockRecommended);
  });

  it('should fetch recommended businesses with custom count', () => {
    let result: RecommendedBusinesses | undefined;
    api.getRecommendedBusinesses(6).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/businesses/recommended`);
    expect(req.request.params.get('count')).toBe('6');
    req.flush({ featured: [], discounted: [] });
    expect(result).toBeDefined();
  });
});
