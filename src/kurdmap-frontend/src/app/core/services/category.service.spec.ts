import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty categories signal initially', () => {
    expect(service.categories()).toEqual([]);
  });

  it('should fetch categories and update signal', () => {
    const mockCategories = [
      { id: '1', slug: 'restaurant', nameKu: 'چێشتخانە', nameDe: 'Restaurant', nameKmr: null, nameEn: null, icon: 'utensils', sortOrder: 1 },
      { id: '2', slug: 'barber', nameKu: 'دەلاک', nameDe: 'Friseur', nameKmr: null, nameEn: null, icon: 'scissors', sortOrder: 2 },
    ];

    service.getAll().subscribe(result => {
      expect(result).toEqual(mockCategories);
    });

    const req = httpTesting.expectOne(r => r.url.includes('/categories'));
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);

    expect(service.categories().length).toBe(2);
    expect(service.categories()[0].slug).toBe('restaurant');
  });
});
