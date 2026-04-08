import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
  });

  it('should default to light mode', () => {
    expect(service.isDarkMode()).toBe(false);
  });

  it('should toggle to dark mode', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(service.isDarkMode()).toBe(true);
  });

  it('should toggle back to light mode', () => {
    service.toggle();
    TestBed.flushEffects();
    service.toggle();
    TestBed.flushEffects();
    expect(service.isDarkMode()).toBe(false);
  });

  it('should persist preference to localStorage', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(localStorage.getItem('kurdmap_theme')).toBe('dark');
    service.toggle();
    TestBed.flushEffects();
    expect(localStorage.getItem('kurdmap_theme')).toBe('light');
  });

  it('should apply dark class to document', () => {
    service.toggle();
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    service.toggle();
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
