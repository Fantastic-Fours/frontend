import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from '../services/auth-token.service';
import { API_BASE_URL } from '../constants/api.constants';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = inject(AuthTokenService);
  const token = authToken.getAccessToken();

  const isApiRequest =
    req.url.startsWith(API_BASE_URL) ||
    req.url.includes('/api/') ||
    req.url.startsWith('/api');

  if (isApiRequest && token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
