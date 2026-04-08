import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, API_BASE_URL } from './api.service';
import type { Advertisement, AdvertisementPayload } from '../models';

describe('ApiService – Advertisements', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  const BASE = 'http://test-api';

  const mockAd: Advertisement = {
    id: 'ad-1',
    titleKu: 'ڕیکلام',
    titleKmr: null,
    titleDe: 'Werbung',
    titleEn: null,
    descriptionKu: null,
    descriptionDe: null,
    imageUrl: 'https://example.com/ad.jpg',
    linkUrl: 'https://example.com',
    businessId: null,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
    sortOrder: 0,
  };

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

  it('should fetch advertisements with activeOnly=false', () => {
    let result: Advertisement[] | undefined;
    api.getAdvertisements(false).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/advertisements`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('activeOnly')).toBe('false');
    req.flush([mockAd]);
    expect(result).toEqual([mockAd]);
  });

  it('should fetch active-only advertisements', () => {
    let result: Advertisement[] | undefined;
    api.getAdvertisements(true).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/advertisements`);
    expect(req.request.params.get('activeOnly')).toBe('true');
    req.flush([mockAd]);
    expect(result).toHaveLength(1);
  });

  it('should create an advertisement', () => {
    const payload: AdvertisementPayload = {
      title: { ku: 'تێست', de: 'Test' },
      imageUrl: 'https://example.com/img.jpg',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      sortOrder: 1,
    };
    let result: Advertisement | undefined;
    api.createAdvertisement(payload).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${BASE}/api/v1/advertisements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockAd);
    expect(result).toEqual(mockAd);
  });

  it('should update an advertisement', () => {
    const payload: AdvertisementPayload = {
      title: { ku: 'نوێ', de: 'Neu' },
      imageUrl: 'https://example.com/new.jpg',
      startDate: '2026-02-01',
      endDate: '2026-08-31',
      sortOrder: 2,
    };
    let result: Advertisement | undefined;
    api.updateAdvertisement('ad-1', payload).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${BASE}/api/v1/advertisements/ad-1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockAd);
    expect(result).toBeDefined();
  });

  it('should toggle an advertisement', () => {
    let called = false;
    api.toggleAdvertisement('ad-1', true).subscribe(() => (called = true));

    const req = httpMock.expectOne(`${BASE}/api/v1/advertisements/ad-1/toggle`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: 'ad-1', activate: true });
    req.flush(null);
    expect(called).toBe(true);
  });

  it('should delete an advertisement', () => {
    let called = false;
    api.deleteAdvertisement('ad-1').subscribe(() => (called = true));

    const req = httpMock.expectOne(`${BASE}/api/v1/advertisements/ad-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(called).toBe(true);
  });
});
