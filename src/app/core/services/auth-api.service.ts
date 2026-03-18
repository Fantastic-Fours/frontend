import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type {
  AuthTokenRequest,
  AuthTokenResponse,
  AuthRefreshRequest,
  AuthRefreshResponse,
  AuthRegisterRequest,
  AuthRegisterResponse,
  AuthVerifyCodeRequest,
  AuthVerifyCodeResponse,
  AuthResendCodeRequest,
  AuthResendCodeResponse,
} from '../interfaces/auth.types';
import { AuthTokenService } from './auth-token.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly base = API_BASE_URL;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: AuthTokenService
  ) {}

  /**
   * POST /api/auth/token/
   * Exchange username/password for access and refresh tokens.
   * Stores tokens in AuthTokenService on success.
   */
  getToken(credentials: AuthTokenRequest): Observable<AuthTokenResponse> {
    return this.http
      .post<AuthTokenResponse>(`${this.base}${API_PATHS.auth.token}`, credentials)
      .pipe(tap((res) => this.tokenService.setTokens(res.access, res.refresh)));
  }

  /**
   * POST /api/auth/token/refresh/
   * Refresh access token using current refresh token.
   * Updates stored access token on success.
   */
  refreshToken(): Observable<AuthRefreshResponse> {
    const refresh = this.tokenService.getRefreshToken();
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    return this.http
      .post<AuthRefreshResponse>(`${this.base}${API_PATHS.auth.refresh}`, {
        refresh,
      } satisfies AuthRefreshRequest)
      .pipe(tap((res) => this.tokenService.setAccessToken(res.access)));
  }

  /**
   * POST /api/auth/register/
   * Create a new user. Does not log in; use getToken after success.
   */
  register(payload: AuthRegisterRequest): Observable<AuthRegisterResponse> {
    return this.http.post<AuthRegisterResponse>(
      `${this.base}${API_PATHS.auth.register}`,
      payload
    );
  }

  /**
   * POST /api/auth/verify-code/
   * Activate account by email verification code.
   */
  verifyCode(payload: AuthVerifyCodeRequest): Observable<AuthVerifyCodeResponse> {
    return this.http.post<AuthVerifyCodeResponse>(
      `${this.base}${API_PATHS.auth.verifyCode}`,
      payload
    );
  }

  /**
   * POST /api/auth/resend-code/
   * Resend verification code.
   */
  resendCode(payload: AuthResendCodeRequest): Observable<AuthResendCodeResponse> {
    return this.http.post<AuthResendCodeResponse>(
      `${this.base}${API_PATHS.auth.resendCode}`,
      payload
    );
  }

  logout(): void {
    this.tokenService.clear();
  }
}
