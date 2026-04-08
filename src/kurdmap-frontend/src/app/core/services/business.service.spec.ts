import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BusinessService, SearchParams } from './business.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BusinessService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have loading signal', () => {
    expect(service.loading()).toBe(false);
  });

  it('should call search with params', () => {
    const params: SearchParams = { search: 'restaurant', city: 'koeln', page: 1, pageSize: 10 };
    service.search(params).subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/search'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('restaurant');
    expect(req.request.params.get('city')).toBe('koeln');
    req.flush({ items: [], pageNumber: 1, totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false });
  });

  it('should call getBySlug', () => {
    service.getBySlug('test-business').subscribe();

    const req = httpTesting.expectOne(r => r.url.endsWith('/test-business'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: '1', slug: 'test-business' });
  });

  it('should call getList with pagination', () => {
    service.getList(2, 20).subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/businesses'));
    expect(req.request.params.get('pageNumber')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('20');
    req.flush({ items: [], pageNumber: 2, totalPages: 5, totalCount: 100, hasPreviousPage: true, hasNextPage: true });
  });

  it('should include geo params in search', () => {
    const params: SearchParams = { latitude: 50.9, longitude: 6.9, radiusKm: 5 };
    service.search(params).subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/search'));
    expect(req.request.params.get('latitude')).toBe('50.9');
    expect(req.request.params.get('longitude')).toBe('6.9');
    expect(req.request.params.get('radiusKm')).toBe('5');
    req.flush({ items: [], pageNumber: 1, totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false });
  });

  it('should call getRecommended with default count', () => {
    service.getRecommended().subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/recommended'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('count')).toBe('12');
    req.flush({ featured: [], discounted: [] });
  });

  it('should call getRecommended with custom count', () => {
    service.getRecommended(6).subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/recommended'));
    expect(req.request.params.get('count')).toBe('6');
    req.flush({ featured: [], discounted: [] });
  });
});
