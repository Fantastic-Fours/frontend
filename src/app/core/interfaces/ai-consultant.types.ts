/** Optional context for AI chat (income, down_payment, etc.). */
export interface AIChatContext {
  income?: number;
  down_payment?: number;
  term_years?: number;
  housing_type?: string;
}

/** One turn in chat history (prior messages only; current message is in `message`). */
export interface AIChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/** POST /api/ai-consultant/chat/ request body. */
export interface AIChatRequest {
  message: string;
  context?: AIChatContext;
  history?: AIChatHistoryItem[];
  /** Подмешивать в ответ факты из векторной базы программ (RAG). По умолчанию true на бэкенде. */
  use_rag?: boolean;
}

/** Источники RAG (программы из БД), попавшие в контекст модели. */
export interface AIChatRagSource {
  program_id: number | null;
  program_name?: string | null;
  bank_name?: string | null;
}

/** POST /api/ai-consultant/chat/ response. */
export interface AIChatResponse {
  reply: string;
  suggested_programs: string[] | unknown[];
  suggested_apartments: number[] | unknown[];
  rag_used?: boolean;
  rag_sources?: AIChatRagSource[];
}

export interface AIHistoryMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  rag_used: boolean;
  rag_sources: AIChatRagSource[];
  created_at: string;
}

export interface AIHistoryResponse {
  messages: AIHistoryMessage[];
  total_count: number;
}

export interface AIClearHistoryResponse {
  deleted_count: number;
}
