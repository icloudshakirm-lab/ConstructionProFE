import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenStore } from '../auth/auth-token.store';

/** Paths that must not receive `Authorization: Bearer` (token acquisition / refresh). */
const AUTH_PATHS_WITHOUT_JWT = new Set(['/auth/login', '/auth/register', '/auth/refresh']);

function pathnameOf(url: string): string {
  try {
    return new URL(url, 'https://placeholder.local').pathname;
  } catch {
    return url.split('?')[0] ?? url;
  }
}

function shouldAttachJwt(url: string): boolean {
  const path = pathnameOf(url).replace(/\/+$/, '') || '/';
  for (const segment of AUTH_PATHS_WITHOUT_JWT) {
    if (path === segment || path.endsWith(segment)) {
      return false;
    }
  }
  return true;
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldAttachJwt(req.url)) {
    return next(req);
  }
  const store = inject(AuthTokenStore);
  const token = store.accessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
