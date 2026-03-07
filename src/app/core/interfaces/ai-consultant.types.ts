/** Optional context for AI chat (income, down_payment, etc.). */
export interface AIChatContext {
  income?: number;
  down_payment?: number;
  term_years?: number;
  housing_type?: string;
}

/** POST /api/ai-consultant/chat/ request body. */
export interface AIChatRequest {
  message: string;
  context?: AIChatContext;
}

/** POST /api/ai-consultant/chat/ response. */
export interface AIChatResponse {
  reply: string;
  suggested_programs: string[] | unknown[];
  suggested_apartments: number[] | unknown[];
}
