/** Query params for GET /api/mortgage/apartments/ */
export interface ApartmentsListParams {
  city?: string;
  housing_type?: string;
  min_price?: number;
  max_price?: number;
  rooms?: number;
  min_rooms?: number;
  max_rooms?: number;
  property_type?: string;
  min_area?: number;
  max_area?: number;
  floor?: number;
  min_floor?: number;
  max_floor?: number;
  total_floors?: number;
  min_total_floors?: number;
  max_total_floors?: number;
  page?: number;
  page_size?: number;
}

/** Apartment entity (shape from API; extend as per Swagger/serializers). */
export interface Apartment {
  id: number;
  title?: string;
  price?: number;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  housing_type?: string;
  property_type?: string;
  allowed_program_ids?: number[];
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ApartmentsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Apartment[];
}
