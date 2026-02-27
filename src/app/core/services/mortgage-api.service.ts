import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type {
  MortgageMatchRequest,
  MortgageMatchResponse,
  MortgageProgramsResponse,
  MortgageProgramItem,
  ProgramListItem,
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
    return this.http.post<Apartment>(
      `${this.base}${API_PATHS.mortgage.apartments}`,
      body
    );
  }

  /**
   * PATCH /api/mortgage/apartments/<id>/
   * Update apartment. JWT required (owner).
   */
  updateApartment(id: number, body: Partial<Apartment>): Observable<Apartment> {
    return this.http.patch<Apartment>(
      `${this.base}${API_PATHS.mortgage.apartmentDetail(id)}`,
      body
    );
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
}
