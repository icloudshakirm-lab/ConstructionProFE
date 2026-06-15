import { InjectionToken } from '@angular/core';

/** Injected in `app.config` from `environment.apiBaseUrl`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
