export interface MultilingualText {
  ku: string;
  kmr: string | null;
  de: string;
  en: string | null;
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
  /** Great-circle distance in km from the user's location; only set for "near me" searches. */
  distanceKm?: number | null;
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
