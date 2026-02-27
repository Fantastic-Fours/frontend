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

/** Request body for POST /api/auth/register/ */
export interface AuthRegisterRequest {
  username: string;
  password: string;
  password_confirm: string;
}

/** Response from POST /api/auth/register/ */
export interface AuthRegisterResponse {
  id: number;
  username: string;
}
