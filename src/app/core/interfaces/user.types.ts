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
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  privileges?: string[];
  created_at: string;
  updated_at: string;
}

/** PATCH /api/users/me/ request body. */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string | null;
  privileges?: string[];
}

/** POST /api/users/me/calculation-history/ request body. */
export interface CalculationHistoryCreateRequest {
  request_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
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
