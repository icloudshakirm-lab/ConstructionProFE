import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'constructpro-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.readStoredTheme());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  set(theme: AppTheme): void {
    if (this.theme() === theme) {
      this.apply(theme);
      return;
    }
    this.theme.set(theme);
    this.apply(theme);
    this.persist(theme);
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private apply(theme: AppTheme): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('app-dark', theme === 'dark');
    root.dataset['theme'] = theme;
    root.style.colorScheme = theme;
  }

  private readStoredTheme(): AppTheme {
    if (typeof localStorage === 'undefined') {
      return this.systemPreference();
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return this.systemPreference();
  }

  private systemPreference(): AppTheme {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private persist(theme: AppTheme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private browsing */
    }
  }
}
