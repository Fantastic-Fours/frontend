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
  email: string;
  password: string;
  password_confirm: string;
}

/** Response from POST /api/auth/register/ */
export interface AuthRegisterResponse {
  detail: string;
  email: string;
}

/** Request body for POST /api/auth/verify-code/ */
export interface AuthVerifyCodeRequest {
  email: string;
  code: string;
}

/** Response from POST /api/auth/verify-code/ */
export interface AuthVerifyCodeResponse {
  detail: string;
}

/** Request body for POST /api/auth/resend-code/ */
export interface AuthResendCodeRequest {
  email: string;
}

/** Response from POST /api/auth/resend-code/ */
export interface AuthResendCodeResponse {
  detail: string;
}

/** Request body for POST /api/auth/forgot-password/ */
export interface AuthForgotPasswordRequest {
  email: string;
}

/** Response from POST /api/auth/forgot-password/ */
export interface AuthForgotPasswordResponse {
  detail: string;
}

/** Request body for POST /api/auth/resend-reset-code/ */
export interface AuthResendResetCodeRequest {
  email: string;
}

/** Response from POST /api/auth/resend-reset-code/ */
export interface AuthResendResetCodeResponse {
  detail: string;
}

/** Request body for POST /api/auth/reset-password/ */
export interface AuthResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirm: string;
}

/** Response from POST /api/auth/reset-password/ */
export interface AuthResetPasswordResponse {
  detail: string;
}
