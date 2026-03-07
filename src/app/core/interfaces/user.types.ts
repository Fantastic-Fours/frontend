/** Apartment as returned in list endpoints (saved, my-listings). */
export interface ApartmentListItem {
  id: number;
  title?: string;
  price?: number;
  city?: string;
  address?: string;
  area_sqm?: number;
  rooms?: number;
  housing_type?: string;
  images?: string[];
  programs_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

/** GET /api/users/me/ response. */
export interface UserProfile {
  username: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}

/** PATCH /api/users/me/ request body. */
export interface UserProfileUpdate {
  phone?: string;
  avatar?: string | null;
}

/** Single saved apartment: GET /api/users/me/saved-apartments/ item. */
export interface SavedApartmentItem {
  id: number;
  apartment: ApartmentListItem;
  created_at: string;
}

/** Paginated saved apartments response. */
export interface SavedApartmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SavedApartmentItem[];
}

/** POST /api/users/me/saved-apartments/ request. */
export interface SavedApartmentCreateRequest {
  apartment_id: number;
}

/** Single calculation history item. */
export interface CalculationHistoryItem {
  id: number;
  request_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
  created_at: string;
}

/** Paginated calculation history response. */
export interface CalculationHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CalculationHistoryItem[];
}
