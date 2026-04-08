import type { MultilingualText, Category, City, Advertisement } from '@/types/api';
import i18n from '@/i18n';

export function getLocalizedName(text: MultilingualText): string {
  const lang = i18n.language;
  switch (lang) {
    case 'ku':
      return text.ku;
    case 'kmr':
      return text.kmr ?? text.ku;
    case 'de':
      return text.de;
    case 'en':
      return text.en ?? text.de;
    default:
      return text.de;
  }
}

export function getCategoryName(category: Category): string {
  const lang = i18n.language;
  switch (lang) {
    case 'ku':
      return category.nameKu;
    case 'kmr':
      return category.nameKmr ?? category.nameKu;
    case 'de':
      return category.nameDe;
    case 'en':
      return category.nameEn ?? category.nameDe;
    default:
      return category.nameDe;
  }
}

export function getCityName(city: City): string {
  const lang = i18n.language;
  switch (lang) {
    case 'ku':
      return city.nameKu;
    case 'kmr':
      return city.nameKmr ?? city.nameKu;
    case 'de':
      return city.nameDe;
    case 'en':
      return city.nameEn ?? city.nameDe;
    default:
      return city.nameDe;
  }
}

export function getAdTitle(ad: Advertisement): string {
  const lang = i18n.language;
  switch (lang) {
    case 'ku':
      return ad.titleKu;
    case 'kmr':
      return ad.titleKmr ?? ad.titleKu;
    case 'de':
      return ad.titleDe;
    case 'en':
      return ad.titleEn ?? ad.titleDe;
    default:
      return ad.titleDe;
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
