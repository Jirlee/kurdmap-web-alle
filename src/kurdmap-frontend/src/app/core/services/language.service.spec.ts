import { TestBed } from '@angular/core/testing';
import { LanguageService, SupportedLanguage } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a default language', () => {
    expect(service.currentLang()).toBeTruthy();
  });

  it('should switch language', () => {
    service.setLanguage('de');
    expect(service.currentLang()).toBe('de');
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
  });

  it('should compute RTL correctly', () => {
    service.setLanguage('ku');
    expect(service.isRtl()).toBe(true);
    service.setLanguage('de');
    expect(service.isRtl()).toBe(false);
    service.setLanguage('en');
    expect(service.isRtl()).toBe(false);
  });

  it('should persist language in localStorage', () => {
    service.setLanguage('kmr');
    expect(localStorage.getItem('kurdmap-lang')).toBe('kmr');
  });

  it('should getLocalized for each language', () => {
    const text = { ku: 'کوردی', kmr: 'Kurmancî', de: 'Deutsch', en: 'English' };

    service.setLanguage('ku');
    expect(service.getLocalized(text)).toBe('کوردی');

    service.setLanguage('kmr');
    expect(service.getLocalized(text)).toBe('Kurmancî');

    service.setLanguage('de');
    expect(service.getLocalized(text)).toBe('Deutsch');

    service.setLanguage('en');
    expect(service.getLocalized(text)).toBe('English');
  });

  it('should fallback on getLocalized when field is empty', () => {
    const text = { ku: 'کوردی', kmr: '', de: 'Deutsch', en: '' };
    service.setLanguage('kmr');
    // kmr falls back to ku when kmr is empty
    expect(service.getLocalized(text)).toBe('کوردی');

    service.setLanguage('en');
    // en falls back to de when en is empty
    expect(service.getLocalized(text)).toBe('Deutsch');
  });

  it('should getLocalizedField for named properties', () => {
    const obj = { nameKu: 'کۆڵن', nameKmr: 'Koln', nameDe: 'Köln', nameEn: 'Cologne' };

    service.setLanguage('ku');
    expect(service.getLocalizedField(obj)).toBe('کۆڵن');

    service.setLanguage('de');
    expect(service.getLocalizedField(obj)).toBe('Köln');
  });

  it('should getLocalizedField fallback when null', () => {
    const obj = { nameKu: 'کۆڵن', nameKmr: null, nameDe: 'Köln', nameEn: null };

    service.setLanguage('kmr');
    expect(service.getLocalizedField(obj)).toBe('کۆڵن'); // falls back to ku

    service.setLanguage('en');
    expect(service.getLocalizedField(obj)).toBe('Köln'); // falls back to de
  });
});
