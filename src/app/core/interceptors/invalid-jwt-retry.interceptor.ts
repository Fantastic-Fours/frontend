import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthTokenService } from '../services/auth-token.service';

/** Предотвращает бесконечный повтор при повторном 401. */
const SKIP_INVALID_JWT_RETRY = 'X-Skip-Invalid-Jwt-Retry';

/**
 * Если в localStorage лежит битый/чужой access-токен, JWTAuthentication на бэкенде
 * вернёт 401 до IsAuthenticatedOrReadOnly — даже для публичных GET.
 * Очищаем токены и один раз повторяем GET/HEAD без Authorization.
 */
export const invalidJwtRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthTokenService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (req.headers.has(SKIP_INVALID_JWT_RETRY)) {
        return throwError(() => err);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return throwError(() => err);
      }
      if (!req.headers.has('Authorization')) {
        return throwError(() => err);
      }
      auth.clear();
      const retry = req.clone({
        headers: req.headers.delete('Authorization').set(SKIP_INVALID_JWT_RETRY, '1'),
      });
      return next(retry);
    }),
  );
};
