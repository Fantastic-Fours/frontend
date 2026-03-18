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
  sort_by?: 'score' | 'rate' | 'overpayment';
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
  max_term_years: number;
  interest_rate: string;
  gesv: string;
  housing_type: string;
  requires_income_confirmation: boolean;
  special_tags: string[];
  is_active: boolean;
}

export interface MortgageProgramsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProgramListItem[];
}
