import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, API_BASE_URL } from './api.service';
import type { Review } from '../models';

describe('ApiService – Reviews', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  const BASE = 'http://test-api';

  const mockReview: Review = {
    id: 'rev-1',
    businessId: 'biz-1',
    userId: 'user-1',
    userFullName: 'Test User',
    rating: 4,
    comment: 'Great business!',
    isApproved: false,
    createdAt: '2026-01-15T10:00:00Z',
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

  it('should fetch all reviews without filter', () => {
    let result: Review[] | undefined;
    api.getReviews().subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/reviews`);
    expect(req.request.method).toBe('GET');
    req.flush([mockReview]);
    expect(result).toEqual([mockReview]);
  });

  it('should fetch reviews with approvedOnly=true', () => {
    let result: Review[] | undefined;
    api.getReviews(true).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/reviews`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('approvedOnly')).toBe('true');
    req.flush([mockReview]);
    expect(result).toEqual([mockReview]);
  });

  it('should fetch reviews with approvedOnly=false', () => {
    api.getReviews(false).subscribe();

    const req = httpMock.expectOne(r => r.url === `${BASE}/api/v1/reviews`);
    expect(req.request.params.get('approvedOnly')).toBe('false');
    req.flush([]);
  });

  it('should approve a review', () => {
    api.approveReview('rev-1').subscribe();

    const req = httpMock.expectOne(`${BASE}/api/v1/reviews/rev-1/approve`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should delete a review', () => {
    api.deleteReview('rev-1').subscribe();

    const req = httpMock.expectOne(`${BASE}/api/v1/reviews/rev-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should encode review id in URL', () => {
    const specialId = 'rev-with spaces';
    api.deleteReview(specialId).subscribe();

    const req = httpMock.expectOne(`${BASE}/api/v1/reviews/rev-with%20spaces`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
