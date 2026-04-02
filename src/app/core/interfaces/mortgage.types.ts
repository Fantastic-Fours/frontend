/** Request body for POST /api/mortgage/match/ */
export interface MortgageMatchRequest {
  price: number;
  down_payment: number;
  income: number;
  expenses: number;
  term_years: number;
  housing_type: 'primary' | 'secondary' | string;
  tags?: string[];
  require_income_confirmation?: boolean;
  children_under_18?: number;
  has_housing?: boolean | null;
  privileges?: string[];
  has_deposit?: boolean;
  sort_by?: 'score' | 'monthly_payment' | 'total_overpayment';
}

/** Request body for POST /api/mortgage/predict/ (neural recommender) */
export interface MortgageNNPredictRequest {
  price: number;
  down_payment: number;
  income: number;
  expenses?: number;
  term_years: number;
  housing_type: 'primary' | 'secondary' | string;
  tags?: string[];
  require_income_confirmation?: boolean;
  children_under_18?: number;
  has_housing?: boolean | null;
  privileges?: string[];
  has_deposit?: boolean;
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

/** Request body for POST /api/recommend-mortgage/ */
export interface MortgageRecommendationRequest {
  property_price: number;
  salary: number;
  monthly_expenses?: number;
  down_payment_percent: number;
  age: number;
  loan_term: number;
  family_status: 'single' | 'married' | 'divorced' | 'widowed' | string;
  privileges?: string[];
  has_deposit?: boolean;
  housing_type?: 'primary' | 'secondary' | string;
  top_k?: number;
}

export interface MortgageRecommendationItem {
  program_id: number;
  program_name: string;
  bank_name: string;
  score: number;
  interest_rate_min: string | null;
  interest_rate_max: string | null;
  min_down_payment_percent: string;
  max_loan_amount: string | null;
  loan_term_min: number;
  loan_term_max: number;
  loan_types: string[];
  requires_deposit: boolean;
  is_government_program: boolean;
  is_privileged_program: boolean;
  matched_privileges: string[];
  reasons: string[];
  monthly_payment: string | null;
}

export interface MortgageRecommendationResponse {
  predicted_loan_type: string;
  prediction_confidence: number;
  loan_type_probabilities: Record<string, number>;
  applied_privileges: string[];
  recommendations: MortgageRecommendationItem[];
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

/** Item from GET /api/mortgage/programs/ (list) and GET /api/mortgage/programs/<id>/ (detail) */
export interface ProgramListItem {
  id: number;
  name: string;
  bank: number;
  bank_name: string;
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
  loan_types?: string[];
  requires_income_confirmation: boolean;
  requires_deposit?: boolean;
  minimum_savings_amount?: string | null;
  minimum_savings_percent?: string | null;
  is_government_program?: boolean;
  is_privileged_program?: boolean;
  eligible_privileges?: string[];
  special_tags: string[];
  is_active: boolean;
}

export interface MortgageProgramsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProgramListItem[];
}
