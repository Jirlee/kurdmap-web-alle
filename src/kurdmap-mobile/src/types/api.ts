// ─── Multilingual Text ─────────────────────────────────────
export interface MultilingualText {
  ku: string;
  kmr: string | null;
  de: string;
  en: string | null;
}

// ─── Business ──────────────────────────────────────────────
export enum BusinessStatus {
  Pending = 0,
  Active = 1,
  Rejected = 2,
  Deactivated = 3,
}

export enum BusinessSortOption {
  Relevance = 0,
  Name = 1,
  Newest = 2,
  VerifiedFirst = 3,
  NearestFirst = 4,
  FeaturedFirst = 5,
  DiscountedFirst = 6,
}

export interface RecommendedBusinesses {
  featured: BusinessSummary[];
  discounted: BusinessSummary[];
}

export interface BusinessSummary {
  id: string;
  slug: string;
  name: MultilingualText;
  categoryId: string;
  categorySlug: string | null;
  street: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  status: BusinessStatus;
  isVerified: boolean;
  isFeatured: boolean;
  primaryImageUrl: string | null;
  discountPercentage: number | null;
  discountDescription: MultilingualText | null;
  hasActiveDiscount: boolean;
}

export interface BusinessDetail {
  id: string;
  slug: string;
  name: MultilingualText;
  description: MultilingualText;
  categoryId: string;
  street: string;
  postalCode: string;
  cityId: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: OpeningHours | null;
  status: BusinessStatus;
  isVerified: boolean;
  isFeatured: boolean;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  images: BusinessImage[];
  services: BusinessService[];
  menuItems: MenuItem[];
  discountPercentage: number | null;
  discountDescription: MultilingualText | null;
  discountStartDate: string | null;
  discountEndDate: string | null;
  hasActiveDiscount: boolean;
}

export interface BusinessImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface BusinessService {
  id: string;
  name: MultilingualText;
  description: MultilingualText | null;
  price: number | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  name: MultilingualText;
  description: MultilingualText | null;
  price: number | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface OpeningHours {
  monday: DaySchedule | null;
  tuesday: DaySchedule | null;
  wednesday: DaySchedule | null;
  thursday: DaySchedule | null;
  friday: DaySchedule | null;
  saturday: DaySchedule | null;
  sunday: DaySchedule | null;
}

export interface DaySchedule {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface BusinessSearchParams {
  search?: string;
  city?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: BusinessSortOption;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// ─── Category ──────────────────────────────────────────────
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

// ─── City ──────────────────────────────────────────────────
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

// ─── Review ────────────────────────────────────────────────
export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userFullName: string | null;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
}

// ─── Advertisement ─────────────────────────────────────────
export interface Advertisement {
  id: string;
  titleKu: string;
  titleKmr: string | null;
  titleDe: string;
  titleEn: string | null;
  descriptionKu: string | null;
  descriptionDe: string | null;
  imageUrl: string;
  linkUrl: string | null;
  businessId: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Pagination ────────────────────────────────────────────
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Dashboard ─────────────────────────────────────────────
export interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  rejectedBusinesses: number;
  deactivatedBusinesses: number;
  totalCategories: number;
  totalCities: number;
  recentBusinesses: BusinessSummary[];
}
