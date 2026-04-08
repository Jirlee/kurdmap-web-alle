export interface Category {
  id: string;
  slug: string;
  nameKu: string;
  nameKmr: string | null;
  nameDe: string;
  nameEn: string | null;
  icon: string | null;
  sortOrder: number;
}
