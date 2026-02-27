/** News item from GET /api/mortgage/news/ */
export interface MortgageNewsItem {
  id: number;
  title: string;
  summary: string;
  body: string;
  image_url: string;
  source_url: string;
  published_at: string;
}

export interface MortgageNewsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MortgageNewsItem[];
}
