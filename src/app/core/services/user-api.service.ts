import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type {
  UserProfile,
  UserProfileUpdate,
  SavedApartmentsResponse,
  SavedApartmentCreateRequest,
  CalculationHistoryResponse,
  CalculationHistoryCreateRequest,
  CalculationHistoryItem,
  ApartmentListItem,
} from '../interfaces/user.types';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly base = API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  /** GET /api/users/me/ — current user profile. */
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}${API_PATHS.users.me}`);
  }

  /** PATCH /api/users/me/ — update profile. */
  patchMe(payload: UserProfileUpdate): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}${API_PATHS.users.me}`, payload);
  }

  /** GET /api/users/me/saved-apartments/ — paginated saved apartments. */
  getSavedApartments(page?: number, pageSize?: number): Observable<SavedApartmentsResponse> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', String(page));
    if (pageSize != null) params = params.set('page_size', String(pageSize));
    return this.http.get<SavedApartmentsResponse>(
      `${this.base}${API_PATHS.users.savedApartments}`,
      { params }
    );
  }

  /** POST /api/users/me/saved-apartments/ — add apartment to saved. */
  addSavedApartment(payload: SavedApartmentCreateRequest): Observable<{ id: number; apartment: ApartmentListItem; created_at: string }> {
    return this.http.post<{ id: number; apartment: ApartmentListItem; created_at: string }>(
      `${this.base}${API_PATHS.users.savedApartments}`,
      payload
    );
  }

  /** DELETE /api/users/me/saved-apartments/:id/ — remove from saved. */
  removeSavedApartment(savedId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}${API_PATHS.users.savedApartmentDetail(savedId)}`
    );
  }

  /** GET /api/users/me/calculation-history/ — mortgage calculation history (paginated). */
  getCalculationHistory(page?: number, pageSize?: number): Observable<CalculationHistoryResponse> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', String(page));
    if (pageSize != null) params = params.set('page_size', String(pageSize));
    return this.http.get<CalculationHistoryResponse>(
      `${this.base}${API_PATHS.users.calculationHistory}`,
      { params }
    );
  }

  /** POST /api/users/me/calculation-history/ — сохранить расчёт (например AI Top-3). */
  createCalculationHistory(payload: CalculationHistoryCreateRequest): Observable<CalculationHistoryItem> {
    return this.http.post<CalculationHistoryItem>(
      `${this.base}${API_PATHS.users.calculationHistory}`,
      payload
    );
  }

  /** GET /api/users/me/my-listings/ — apartments created by current user. */
  getMyListings(): Observable<ApartmentListItem[]> {
    return this.http.get<ApartmentListItem[]>(`${this.base}${API_PATHS.users.myListings}`);
  }
}
