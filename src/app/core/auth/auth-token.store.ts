import { Injectable, signal } from '@angular/core';

const ACCESS_KEY = 'netledger.jwt.access';
const REFRESH_KEY = 'netledger.jwt.refresh';

@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);

  /** Current access JWT (also persisted when set). */
  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();

  constructor() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    this._accessToken.set(localStorage.getItem(ACCESS_KEY));
    this._refreshToken.set(localStorage.getItem(REFRESH_KEY));
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  }

  clear(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  }
}
