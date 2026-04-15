import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenService } from '../services/auth-token.service';

/** Требует JWT; иначе редирект на /login */
export const authRequiredGuard: CanActivateFn = () => {
  const tokens = inject(AuthTokenService);
  const router = inject(Router);
  if (tokens.hasTokens()) return true;
  void router.navigate(['/login']);
  return false;
};
