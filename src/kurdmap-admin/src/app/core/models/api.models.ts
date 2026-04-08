// === Multilingual Text ===
export interface MultilingualText {
  ku: string;
  kmr?: string | null;
  de: string;
  en?: string | null;
}

// === Auth ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  requiresTwoFactor?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  twoFactorEnabled?: boolean;
  mfaVerified?: boolean;
}

// === Dashboard ===
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

// === Business ===
export enum BusinessStatus {
  Pending = 0,
  Active = 1,
  Rejected = 2,
  Deactivated = 3,
}

export interface BusinessSummary {
  id: string;
  slug: string;
  name: MultilingualText;
  categoryId: string;
  categorySlug?: string | null;
  street: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  status: BusinessStatus;
  isVerified: boolean;
  isFeatured: boolean;
  primaryImageUrl?: string | null;
  discountPercentage?: number | null;
  discountDescription?: MultilingualText | null;
  hasActiveDiscount?: boolean;
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
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  hours?: OpeningHours | null;
  status: number;
  isVerified: boolean;
  isFeatured: boolean;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
  images: BusinessImage[];
  services: BusinessService[];
  menuItems: MenuItem[];
  discountPercentage?: number | null;
  discountDescription?: MultilingualText | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  hasActiveDiscount?: boolean;
}

export interface BusinessImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface BusinessService {
  id: string;
  name: MultilingualText;
  description?: MultilingualText | null;
  price?: number | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  name: MultilingualText;
  description?: MultilingualText | null;
  price?: number | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface OpeningHours {
  monday?: DaySchedule | null;
  tuesday?: DaySchedule | null;
  wednesday?: DaySchedule | null;
  thursday?: DaySchedule | null;
  friday?: DaySchedule | null;
  saturday?: DaySchedule | null;
  sunday?: DaySchedule | null;
}

export interface DaySchedule {
  open?: string | null;
  close?: string | null;
  closed: boolean;
}

// === Category ===
export interface Category {
  id: string;
  slug: string;
  nameKu: string;
  nameKmr?: string | null;
  nameDe: string;
  nameEn?: string | null;
  icon?: string | null;
  sortOrder: number;
}

// === City ===
export interface City {
  id: string;
  slug: string;
  nameKu: string;
  nameKmr?: string | null;
  nameDe: string;
  nameEn?: string | null;
  latitude: number;
  longitude: number;
}

// === User ===
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

// === Recommended ===
export interface RecommendedBusinesses {
  featured: BusinessSummary[];
  discounted: BusinessSummary[];
}

// === Discount Payload ===
export interface DiscountPayload {
  readonly id: string;
  readonly percentage: number;
  readonly description?: MultilingualText | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
}

// === Pagination ===
export interface PaginatedList<T> {
  readonly items: T[];
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

// === Roles ===
export const AppRoles = {
  User: 'User',
  BusinessOwner: 'BusinessOwner',
  Moderator: 'Moderator',
  Admin: 'Admin',
  SuperAdmin: 'SuperAdmin',
  All: ['User', 'BusinessOwner', 'Moderator', 'Admin', 'SuperAdmin'] as const,
} as const;

export type AppRole = typeof AppRoles.All[number];

// === Payloads (typed request bodies) ===
export interface CategoryPayload {
  readonly name: MultilingualText;
  readonly icon?: string | null;
  readonly sortOrder?: number;
}

export interface BusinessPayload {
  readonly name: MultilingualText;
  readonly description: MultilingualText;
  readonly categoryId: string;
  readonly street: string;
  readonly postalCode: string;
  readonly cityId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly website?: string | null;
  readonly hours?: OpeningHours | null;
}

// === City Payload ===
export interface CityPayload {
  readonly name: MultilingualText;
  readonly slug: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface CityUpdatePayload {
  readonly id: string;
  readonly name: MultilingualText;
  readonly latitude: number;
  readonly longitude: number;
}

// === MenuItem & BusinessService Payloads ===
export interface MenuItemPayload {
  readonly name: MultilingualText;
  readonly description?: MultilingualText | null;
  readonly price?: number | null;
  readonly imageUrl?: string | null;
  readonly sortOrder: number;
}

export interface BusinessServicePayload {
  readonly name: MultilingualText;
  readonly description?: MultilingualText | null;
  readonly price?: number | null;
  readonly sortOrder: number;
}

// === Advertisement ===
export interface Advertisement {
  id: string;
  titleKu: string;
  titleKmr?: string | null;
  titleDe: string;
  titleEn?: string | null;
  descriptionKu?: string | null;
  descriptionDe?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  businessId?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdvertisementPayload {
  readonly title: MultilingualText;
  readonly description?: MultilingualText | null;
  readonly imageUrl: string;
  readonly linkUrl?: string | null;
  readonly businessId?: string | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly sortOrder: number;
}

// === Review ===
export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userFullName?: string | null;
  rating: number;
  comment?: string | null;
  isApproved: boolean;
  createdAt: string;
}

// === Favorite ===
export interface Favorite {
  id: string;
  businessId: string;
  userId: string;
  createdAt: string;
}
