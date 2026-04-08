export interface City {
  id: string;
  slug: string;
  nameKu: string;
  nameKmr: string | null;
  nameDe: string;
  nameEn: string | null;
  latitude: number;
  longitude: number;
}
