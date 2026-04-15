/** Request body for POST /api/mortgage/match/ */
export interface MortgageMatchRequest {
  price: number;
  down_payment: number;
  income: number;
  expenses: number;
  /** Если не указан, API использует 20 лет */
  term_years?: number;
  housing_type: 'primary' | 'secondary' | string;
  tags?: string[];
  require_income_confirmation?: boolean;
  children_under_18?: number;
  has_housing?: boolean | null;
  privileges?: string[];
  has_deposit?: boolean;
  sort_by?: 'score' | 'monthly_payment' | 'total_overpayment';
}

export interface MortgagePlanPdfRequest {
  price: number;
  down_payment: number;
  income: number;
  expenses?: number;
  term_years?: number;
  housing_type: 'primary' | 'secondary' | string;
  sort_by?: 'score' | 'monthly_payment' | 'total_overpayment';
  require_income_confirmation?: boolean;
  children_under_18?: number;
  has_housing?: boolean | null;
  has_deposit?: boolean;
  privileges?: string[];
}

/** Request body for POST /api/mortgage/predict/ (neural recommender) */
export interface MortgageNNPredictRequest {
  price: number;
  down_payment: number;
  income: number;
  expenses?: number;
  /** Если не указан, API использует 20 лет */
  term_years?: number;
  housing_type: 'primary' | 'secondary' | string;
  tags?: string[];
  require_income_confirmation?: boolean;
  children_under_18?: number;
  has_housing?: boolean | null;
  privileges?: string[];
  has_deposit?: boolean;
  /** Опционально: улучшает Keras-ранжирование (иначе берётся default с бэкенда) */
  age?: number | null;
  family_status?: 'single' | 'married' | 'divorced' | 'widowed' | null;
}

export interface MortgageNNPredictItem {
  program_id: number;
  program_name: string;
  bank_name: string;
  interest_rate: string;
  score: number;
}

export interface MortgageNNPredictResponse {
  top3: MortgageNNPredictItem[];
}

export interface AIMortgageAdvisorUserData {
  property_price: number;
  salary: number;
  monthly_expenses?: number;
  down_payment_percent: number;
  age: number;
  family_status: 'single' | 'married' | 'divorced' | 'widowed' | string;
  privileges?: string[];
  has_deposit?: boolean;
  housing_type?: 'primary' | 'secondary' | string;
}

export interface AIMortgageAdvisorRequest {
  user_data: AIMortgageAdvisorUserData;
  question: string;
}

export interface AIMortgageAdvisorProgram {
  program_id: number;
  program_name: string;
  bank_name: string;
  score: number;
  interest_rate_min: string;
  interest_rate_max: string;
  min_down_payment_percent: string;
  loan_term_min: number;
  loan_term_max: number;
  conditions: {
    requires_deposit: boolean;
    requires_income_confirmation: boolean;
    is_government_program: boolean;
    is_privileged_program: boolean;
  };
  requirements: {
    loan_types: string[];
    eligible_privileges: string[];
    minimum_savings_percent: string;
    minimum_savings_amount: string;
  };
  monthly_payment?: string;
  total_overpayment?: string;
  selected_loan_term_years?: number | null;
  ml_reasons: string[];
}

export interface AIMortgageAdvisorResponse {
  answer: string;
  recommended_programs: AIMortgageAdvisorProgram[];
}

export interface MortgageProgramItem {
  program_id: number;
  program_name: string;
  bank_name: string;
  interest_rate: string;
  monthly_payment: string;
  total_overpayment: string;
  loan_amount: string;
  score: number;
  gesv: string;
}

export interface MortgageMatchResponse {
  programs: MortgageProgramItem[];
  total_count: number;
}

/** Данные банка (GET /api/mortgage/programs/:id/ во вложении bank_public) */
export interface BankPublic {
  id: number;
  name: string;
  code: string;
  requisites: string;
  about: string;
  customer_reviews: string;
  /** Относительный URL медиа, например /media/bank_logos/... */
  logo?: string | null;
  license_info?: string | null;
  phone?: string | null;
  head_office_address?: string | null;
  website?: string | null;
}

export interface BankBranch {
  id: number;
  latitude: number;
  longitude: number;
}

export interface BankReview {
  id: number;
  user_id: number;
  username: string;
  text: string;
  score: number;
  created_at: string;
}

/** GET /api/mortgage/banks/ и GET /api/mortgage/banks/:id/ */
export interface Bank {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  requisites: string;
  about: string;
  customer_reviews: string;
  logo: string | null;
  license_info: string | null;
  phone: string | null;
  head_office_address: string | null;
  website: string | null;
  branches: BankBranch[];
  reviews: BankReview[];
}

export interface BanksListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Bank[];
}

/** Item from GET /api/mortgage/programs/ (list) and GET /api/mortgage/programs/<id>/ (detail) */
export interface ProgramListItem {
  id: number;
  name: string;
  bank: number;
  bank_name: string;
  bank_logo?: string | null;
  min_down_payment_percent: string;
  max_loan_amount: string;
  /** Локальные лимиты, ₸ (строки для Decimal), например astana_almaty / other_regions */
  max_loan_by_region?: Record<string, string>;
  max_term_years: number;
  loan_term_min?: number;
  loan_term_max?: number;
  interest_rate: string;
  interest_rate_min?: string | null;
  interest_rate_max?: string | null;
  gesv: string;
  housing_type: string;
  housing_types?: string[];
  loan_types?: string[];
  requires_income_confirmation: boolean;
  requires_deposit?: boolean;
  minimum_savings_amount?: string | null;
  minimum_savings_percent?: string | null;
  is_government_program?: boolean;
  is_privileged_program?: boolean;
  eligible_privileges?: string[];
  is_active: boolean;
  /** Только в ответе детальной программы */
  bank_public?: BankPublic | null;
}

export interface MortgageProgramsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProgramListItem[];
}

/** POST /api/predict-price/ */
export interface PricePredictionRequest {
  district?: string;
  city?: string;
  address?: string;
  area: number;
  floor?: number | null;
  total_floors?: number | null;
  rooms: number;
  condition?: string;
  description?: string;
  price: number;
}

export type PriceDealLabel = 'overpriced' | 'good deal' | 'fair price' | 'inconclusive';

export interface PricePredictionResponse {
  predicted_price: number;
  diff_percent: number | null;
  label: PriceDealLabel;
  /** False when listing scale (e.g. sale) does not match training data (e.g. rent). */
  trustworthy?: boolean;
  note?: string | null;
}
