import {
  getLocalizedName,
  getCategoryName,
  getCityName,
  formatDistance,
  haversineDistance,
} from '@/utils/localization';
import i18n from '@/i18n';
import type { MultilingualText, Category, City } from '@/types/api';

describe('getLocalizedName', () => {
  const text: MultilingualText = {
    ku: 'ناوی کوردی',
    kmr: 'Navê Kurmancî',
    de: 'Deutscher Name',
    en: 'English Name',
  };

  it('returns Kurdish for ku', () => {
    i18n.changeLanguage('ku');
    expect(getLocalizedName(text)).toBe('ناوی کوردی');
  });

  it('returns Kurmanji for kmr', () => {
    i18n.changeLanguage('kmr');
    expect(getLocalizedName(text)).toBe('Navê Kurmancî');
  });

  it('returns German for de', () => {
    i18n.changeLanguage('de');
    expect(getLocalizedName(text)).toBe('Deutscher Name');
  });

  it('returns English for en', () => {
    i18n.changeLanguage('en');
    expect(getLocalizedName(text)).toBe('English Name');
  });

  it('falls back to de for unknown language', () => {
    i18n.changeLanguage('fr');
    expect(getLocalizedName(text)).toBe('Deutscher Name');
  });

  it('falls back to ku when kmr is null', () => {
    i18n.changeLanguage('kmr');
    const noKmr: MultilingualText = { ku: 'کوردی', kmr: null, de: 'Deutsch', en: null };
    expect(getLocalizedName(noKmr)).toBe('کوردی');
  });
});

describe('getCategoryName', () => {
  const category = {
    id: '1',
    slug: 'restaurants',
    nameKu: 'چێشتخانە',
    nameKmr: 'Xwaringeh',
    nameDe: 'Restaurants',
    nameEn: 'Restaurants',
    businessCount: 10,
    icon: 'restaurant',
  } as Category;

  it('returns correct language', () => {
    i18n.changeLanguage('de');
    expect(getCategoryName(category)).toBe('Restaurants');
    i18n.changeLanguage('ku');
    expect(getCategoryName(category)).toBe('چێشتخانە');
  });
});

describe('getCityName', () => {
  const city = {
    id: '1',
    nameKu: 'کۆلن',
    nameKmr: 'Köln',
    nameDe: 'Köln',
    nameEn: 'Cologne',
    businessCount: 50,
  } as City;

  it('returns correct language', () => {
    i18n.changeLanguage('en');
    expect(getCityName(city)).toBe('Cologne');
    i18n.changeLanguage('ku');
    expect(getCityName(city)).toBe('کۆلن');
  });
});

describe('formatDistance', () => {
  it('formats meters for short distances', () => {
    expect(formatDistance(150)).toBe('150 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('formats kilometers for longer distances', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(12300)).toBe('12.3 km');
  });
});

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(50.9375, 6.9603, 50.9375, 6.9603)).toBe(0);
  });

  it('calculates distance between Cologne and Düsseldorf (~34 km)', () => {
    const distance = haversineDistance(50.9375, 6.9603, 51.2277, 6.7735);
    expect(distance).toBeGreaterThan(30000);
    expect(distance).toBeLessThan(40000);
  });

  it('calculates long distance correctly', () => {
    // London to Paris is ~343 km
    const distance = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(330000);
    expect(distance).toBeLessThan(360000);
  });
});
