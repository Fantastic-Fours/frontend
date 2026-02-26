/** Request body for POST /api/auth/token/ */
export interface AuthTokenRequest {
  username: string;
  password: string;
}

/** Response from POST /api/auth/token/ */
export interface AuthTokenResponse {
  access: string;
  refresh: string;
}

/** Request body for POST /api/auth/token/refresh/ */
export interface AuthRefreshRequest {
  refresh: string;
}

/** Response from POST /api/auth/token/refresh/ */
export interface AuthRefreshResponse {
  access: string;
}
