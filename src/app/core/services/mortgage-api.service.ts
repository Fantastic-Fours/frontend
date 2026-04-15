import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type {
  MortgageMatchRequest,
  MortgagePlanPdfRequest,
  MortgageMatchResponse,
  MortgageProgramsResponse,
  MortgageProgramItem,
  ProgramListItem,
  MortgageNNPredictRequest,
  MortgageNNPredictResponse,
  AIMortgageAdvisorRequest,
  AIMortgageAdvisorResponse,
  PricePredictionRequest,
  PricePredictionResponse,
  Bank,
  BanksListResponse,
} from '../interfaces/mortgage.types';
import type {
  ApartmentsListParams,
  ApartmentsListResponse,
  Apartment,
} from '../interfaces/apartment.types';
import type { MortgageNewsItem, MortgageNewsListResponse } from '../interfaces/news.types';

@Injectable({ providedIn: 'root' })
export class MortgageApiService {
  private readonly base = API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  /**
   * POST /api/mortgage/match/
   * Match programs by price, down payment, income, etc.
   */
  match(params: MortgageMatchRequest): Observable<MortgageMatchResponse> {
    return this.http.post<MortgageMatchResponse>(
      `${this.base}${API_PATHS.mortgage.match}`,
      params
    );
  }

  /**
   * GET /api/mortgage/plan/pdf/
   * Download mortgage plan PDF.
   */
  downloadMortgagePlan(params: MortgagePlanPdfRequest): Observable<Blob> {
    let httpParams = new HttpParams()
      .set('price', String(params.price))
      .set('down_payment', String(params.down_payment))
      .set('income', String(params.income))
      .set('housing_type', String(params.housing_type));

    if (params.expenses != null) httpParams = httpParams.set('expenses', String(params.expenses));
    if (params.term_years != null) httpParams = httpParams.set('term_years', String(params.term_years));
    if (params.sort_by != null) httpParams = httpParams.set('sort_by', String(params.sort_by));
    if (params.require_income_confirmation != null) {
      httpParams = httpParams.set('require_income_confirmation', String(params.require_income_confirmation));
    }
    if (params.children_under_18 != null) {
      httpParams = httpParams.set('children_under_18', String(params.children_under_18));
    }
    if (params.has_housing != null) httpParams = httpParams.set('has_housing', String(params.has_housing));
    if (params.has_deposit != null) httpParams = httpParams.set('has_deposit', String(params.has_deposit));
    (params.privileges ?? []).forEach((value) => {
      httpParams = httpParams.append('privileges', value);
    });

       return this.http
      .get(`${this.base}${API_PATHS.mortgage.planPdf}`, {
        params: httpParams,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(switchMap((response) => from(this.ensurePdfBlob(response))));
  }

  /** When responseType is blob, JSON errors are still blobs — parse for a readable message. */
  private async blobToErrorMessage(blob: Blob): Promise<string> {
    const text = await blob.text();
    try {
      const data = JSON.parse(text) as { detail?: unknown };
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map(String).join(', ');
    } catch {
      /* not JSON */
    }
    const t = text?.trim();
    return t || 'Не удалось скачать PDF';
  }

  private async ensurePdfBlob(response: HttpResponse<Blob>): Promise<Blob> {
    const body = response.body;
    if (!body) {
      throw new Error('Пустой ответ сервера');
    }
    if (response.status !== 200) {
      throw new Error(await this.blobToErrorMessage(body));
    }
    const ct = (response.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/pdf')) {
      return body;
    }
    const head = await body.slice(0, Math.min(8, body.size)).text();
    if (head.startsWith('%PDF')) {
      return body;
    }
    throw new Error(await this.blobToErrorMessage(body));
  }

  /**
   * POST /api/mortgage/predict/
   * Neural recommender: returns top-3 programs.
   */
  predict(params: MortgageNNPredictRequest): Observable<MortgageNNPredictResponse> {
    return this.http.post<MortgageNNPredictResponse>(
      `${this.base}${API_PATHS.mortgage.predict}`,
      params
    );
  }

  /**
   * POST /api/ai-mortgage-advisor
   * Hybrid ML + RAG + LLM mortgage explanation.
   */
  aiMortgageAdvisor(params: AIMortgageAdvisorRequest): Observable<AIMortgageAdvisorResponse> {
    return this.http.post<AIMortgageAdvisorResponse>(
      `${this.base}${API_PATHS.mortgage.aiMortgageAdvisor}`,
      params
    );
  }

  /**
   * GET /api/mortgage/programs/
   * List programs (paginated). Query: page, page_size.
   */
  getPrograms(page?: number, pageSize?: number): Observable<MortgageProgramsResponse> {
    let httpParams = new HttpParams();
    if (page != null) httpParams = httpParams.set('page', String(page));
    if (pageSize != null) httpParams = httpParams.set('page_size', String(pageSize));
    return this.http.get<MortgageProgramsResponse>(
      `${this.base}${API_PATHS.mortgage.programs}`,
      { params: httpParams }
    );
  }

  /**
   * GET /api/mortgage/programs/<id>/
   * Program details.
   */
  getProgram(id: number): Observable<ProgramListItem> {
    return this.http.get<ProgramListItem>(
      `${this.base}${API_PATHS.mortgage.programDetail(id)}`
    );
  }

  /**
   * GET /api/mortgage/banks/
   * Список банков (пагинация): отделения и отзывы внутри каждой записи.
   */
  getBanks(page?: number, pageSize?: number): Observable<BanksListResponse> {
    let httpParams = new HttpParams();
    if (page != null) httpParams = httpParams.set('page', String(page));
    if (pageSize != null) httpParams = httpParams.set('page_size', String(pageSize));
    return this.http.get<BanksListResponse>(`${this.base}${API_PATHS.mortgage.banks}`, {
      params: httpParams,
    });
  }

  /**
   * GET /api/mortgage/banks/<id>/
   */
  getBank(id: number): Observable<Bank> {
    return this.http.get<Bank>(`${this.base}${API_PATHS.mortgage.bankDetail(id)}`);
  }

  /**
   * GET /api/mortgage/news/
   * List mortgage news (paginated).
   */
  getNews(page?: number, pageSize?: number): Observable<MortgageNewsListResponse> {
    let httpParams = new HttpParams();
    if (page != null) httpParams = httpParams.set('page', String(page));
    if (pageSize != null) httpParams = httpParams.set('page_size', String(pageSize));
    return this.http.get<MortgageNewsListResponse>(
      `${this.base}${API_PATHS.mortgage.news}`,
      { params: httpParams }
    );
  }

  /**
   * GET /api/mortgage/news/<id>/
   * Single news item.
   */
  getNewsItem(id: number): Observable<MortgageNewsItem> {
    return this.http.get<MortgageNewsItem>(
      `${this.base}${API_PATHS.mortgage.newsDetail(id)}`
    );
  }

  /**
   * GET /api/mortgage/apartments/
   * List apartments. No auth. Query: city, housing_type, min_price, max_price, page, page_size.
   */
  getApartments(params?: ApartmentsListParams): Observable<ApartmentsListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.city != null) httpParams = httpParams.set('city', params.city);
      if (params.housing_type != null) httpParams = httpParams.set('housing_type', params.housing_type);
      if (params.min_price != null) httpParams = httpParams.set('min_price', String(params.min_price));
      if (params.max_price != null) httpParams = httpParams.set('max_price', String(params.max_price));
      if (params.rooms != null) httpParams = httpParams.set('rooms', String(params.rooms));
      if (params.min_rooms != null) httpParams = httpParams.set('min_rooms', String(params.min_rooms));
      if (params.max_rooms != null) httpParams = httpParams.set('max_rooms', String(params.max_rooms));
      if (params.property_type != null) httpParams = httpParams.set('property_type', params.property_type);
      if (params.min_area != null) httpParams = httpParams.set('min_area', String(params.min_area));
      if (params.max_area != null) httpParams = httpParams.set('max_area', String(params.max_area));
      if (params.floor != null) httpParams = httpParams.set('floor', String(params.floor));
      if (params.min_floor != null) httpParams = httpParams.set('min_floor', String(params.min_floor));
      if (params.max_floor != null) httpParams = httpParams.set('max_floor', String(params.max_floor));
      if (params.total_floors != null) httpParams = httpParams.set('total_floors', String(params.total_floors));
      if (params.min_total_floors != null) httpParams = httpParams.set('min_total_floors', String(params.min_total_floors));
      if (params.max_total_floors != null) httpParams = httpParams.set('max_total_floors', String(params.max_total_floors));
      if (params.page != null) httpParams = httpParams.set('page', String(params.page));
      if (params.page_size != null) httpParams = httpParams.set('page_size', String(params.page_size));
    }
    return this.http.get<ApartmentsListResponse>(
      `${this.base}${API_PATHS.mortgage.apartments}`,
      { params: httpParams }
    );
  }

  /**
   * GET /api/mortgage/apartments/<id>/
   * Apartment detail + matching programs. No auth.
   */
  getApartment(id: number): Observable<Apartment> {
    return this.http.get<Apartment>(
      `${this.base}${API_PATHS.mortgage.apartmentDetail(id)}`
    );
  }

  /**
   * POST /api/mortgage/apartments/
   * Create apartment. JWT required.
   */
  createApartment(body: Partial<Apartment>): Observable<Apartment> {
    const anyBody = body as any;
    const imagesFiles: File[] | undefined = anyBody?.images_files;
    if (Array.isArray(imagesFiles) && imagesFiles.length > 0) {
      const fd = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (v == null) return;
        if (k === 'images_files') return;
        if (Array.isArray(v)) {
          v.forEach((item) => fd.append(k, String(item)));
        } else {
          fd.append(k, String(v));
        }
      });
      imagesFiles.forEach((f) => fd.append('images_files', f));
      return this.http.post<Apartment>(`${this.base}${API_PATHS.mortgage.apartments}`, fd);
    }
    return this.http.post<Apartment>(`${this.base}${API_PATHS.mortgage.apartments}`, body);
  }

  /**
   * PATCH /api/mortgage/apartments/<id>/
   * Update apartment. JWT required (owner).
   */
  updateApartment(id: number, body: Partial<Apartment>): Observable<Apartment> {
    const anyBody = body as any;
    const imagesFiles: File[] | undefined = anyBody?.images_files;
    if (Array.isArray(imagesFiles)) {
      const fd = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (v == null) return;
        if (k === 'images_files') return;
        if (Array.isArray(v)) {
          v.forEach((item) => fd.append(k, String(item)));
        } else {
          fd.append(k, String(v));
        }
      });
      imagesFiles.forEach((f) => fd.append('images_files', f));
      return this.http.patch<Apartment>(`${this.base}${API_PATHS.mortgage.apartmentDetail(id)}`, fd);
    }
    return this.http.patch<Apartment>(`${this.base}${API_PATHS.mortgage.apartmentDetail(id)}`, body);
  }

  /**
   * DELETE /api/mortgage/apartments/<id>/
   * Soft-delete (is_active=false). JWT required (owner).
   */
  deleteApartment(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}${API_PATHS.mortgage.apartmentDetail(id)}`
    );
  }

  /**
   * POST /api/predict-price/
   * Krisha ML regression: market price vs listing.
   */
  predictPrice(body: PricePredictionRequest): Observable<PricePredictionResponse> {
    return this.http.post<PricePredictionResponse>(
      `${this.base}${API_PATHS.mortgage.predictPrice}`,
      body
    );
  }

  /**
   * GET /api/property/<id>/analysis/
   * Same model using stored apartment (id = mortgage apartment pk).
   */
  getPropertyPriceAnalysis(apartmentId: number): Observable<PricePredictionResponse> {
    return this.http.get<PricePredictionResponse>(
      `${this.base}${API_PATHS.mortgage.propertyPriceAnalysis(apartmentId)}`
    );
  }
}
