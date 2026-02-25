import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type {
  MortgageMatchRequest,
  MortgageMatchResponse,
  MortgageProgramsResponse,
} from '../interfaces/mortgage.types';

@Injectable({ providedIn: 'root' })
export class MortgageApiService {
  private readonly base = API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  /**
   * POST /api/mortgage/match/
   * Get matching mortgage programs for the given parameters.
   */
  match(params: MortgageMatchRequest): Observable<MortgageMatchResponse> {
    return this.http.post<MortgageMatchResponse>(
      `${this.base}${API_PATHS.mortgage.match}`,
      params
    );
  }

  /**
   * GET /api/mortgage/programs/
   * List programs with DRF PageNumberPagination (page, page_size).
   */
  getPrograms(page?: number, pageSize?: number): Observable<MortgageProgramsResponse> {
    let httpParams = new HttpParams();
    if (page != null) {
      httpParams = httpParams.set('page', String(page));
    }
    if (pageSize != null) {
      httpParams = httpParams.set('page_size', String(pageSize));
    }
    return this.http.get<MortgageProgramsResponse>(
      `${this.base}${API_PATHS.mortgage.programs}`,
      { params: httpParams }
    );
  }
}
