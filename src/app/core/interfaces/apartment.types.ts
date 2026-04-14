export type FurnishedValue = 'yes' | 'no' | 'partial';
export type ParkingValue = 'parking' | 'none' | 'paid';
export type PropertyConditionValue = 'excellent' | 'good' | 'average' | 'needs_repair';

export const FURNISHED_LABELS: Record<FurnishedValue, string> = {
  yes: 'С мебелью',
  no: 'Без мебели',
  partial: 'Частично меблирована',
};

export const PARKING_LABELS: Record<ParkingValue, string> = {
  parking: 'Парковка',
  none: 'Нет парковки',
  paid: 'Платная парковка',
};

export const PROPERTY_CONDITION_LABELS: Record<PropertyConditionValue, string> = {
  excellent: 'Отличное',
  good: 'Хорошее',
  average: 'Удовлетворительное',
  needs_repair: 'Требует ремонта',
};

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
  /** Вторичка: меблировка */
  furnished?: FurnishedValue | string | null;
  year_built?: number | null;
  parking?: ParkingValue | string | null;
  condition?: PropertyConditionValue | string | null;
  allowed_program_ids?: number[];
  is_active?: boolean;
  /** Имя для отображения (ФИО или логин) */
  author_display_name?: string | null;
  /** Телефон из профиля автора */
  author_phone?: string | null;
  /** Текущий пользователь — автор объявления (при авторизованном GET) */
  is_owner?: boolean;
  [key: string]: unknown;
}

export interface ApartmentsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Apartment[];
}
