/** Query params for GET /api/mortgage/apartments/ */
export interface ApartmentsListParams {
  city?: string;
  housing_type?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
}

/** Apartment entity (shape from API; extend as per Swagger/serializers). */
export interface Apartment {
  id: number;
  title?: string;
  price?: number;
  city?: string;
  housing_type?: string;
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
