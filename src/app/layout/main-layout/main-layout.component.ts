import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FEATURE_MODULES } from '../../core/constants/feature-registry';
import { ThemeService } from '../../core/services/theme.service';
@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarModule,
    ButtonModule,
    RippleModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly modules = FEATURE_MODULES;
  readonly sidebarVisible = signal(false);
  readonly expandedGroups = signal<Record<string, boolean>>({});

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/dashboard') || url === '/') {
      return 'Dashboard';
    }
    const segment = url.split('/').filter(Boolean)[0];
    const mod = FEATURE_MODULES.find((m) => m.routePath === segment);
    if (!mod) {
      return 'ConstructPro';
    }
    const pageId = url.split('/').filter(Boolean)[1];
    if (!pageId) {
      return mod.title;
    }
    const page = mod.pages.find((p) => p.id === pageId);
    return page?.title ?? mod.title;
  });

  constructor() {
    // Default-expand group matching current route
    const initial = this.router.url.split('/').filter(Boolean)[0];
    if (initial) {
      const mod = FEATURE_MODULES.find((m) => m.routePath === initial);
      if (mod) {
        this.expandedGroups.update((g) => ({ ...g, [mod.id]: true }));
      }
    }
  }

  toggleGroup(moduleId: string): void {
    this.expandedGroups.update((g) => ({ ...g, [moduleId]: !g[moduleId] }));
  }

  isGroupExpanded(moduleId: string): boolean {
    return !!this.expandedGroups()[moduleId];
  }

  openSidebar(): void {
    this.sidebarVisible.set(true);
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  onNavClick(): void {
    this.closeSidebar();
  }
}
