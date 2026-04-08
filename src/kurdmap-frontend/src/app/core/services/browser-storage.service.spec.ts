import { TestBed } from '@angular/core/testing';
import { BrowserStorageService } from './browser-storage.service';

describe('BrowserStorageService', () => {
  let service: BrowserStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserStorageService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should set and get an item', () => {
    service.setItem('test-key', 'test-value');
    expect(service.getItem('test-key')).toBe('test-value');
  });

  it('should return null for missing key', () => {
    expect(service.getItem('nonexistent')).toBeNull();
  });

  it('should remove an item', () => {
    service.setItem('key', 'value');
    service.removeItem('key');
    expect(service.getItem('key')).toBeNull();
  });
});
