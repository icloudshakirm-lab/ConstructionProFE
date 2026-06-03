import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Chip } from 'primeng/chip';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { MenuItem } from 'primeng/api';

type RouteData = { moduleId: string; pageId: string };

@Component({
  selector: 'app-feature-placeholder',
  imports: [RouterLink, Breadcrumb, Button, Card, Chip, Tag],
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss'
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly routeData = signal<RouteData | undefined>(this.readRouteData());

  constructor() {
    this.route.data
      .pipe(
        map((data) => data as RouteData),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => this.routeData.set(data));
  }

  readonly module = computed(() => {
    const data = this.routeData();
    return data ? getModuleById(data.moduleId) : undefined;
  });

  readonly page = computed(() => {
    const mod = this.module();
    const data = this.routeData();
    if (!mod || !data) {
      return undefined;
    }
    return mod.pages.find((p) => p.id === data.pageId);
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const mod = this.module();
    const page = this.page();
    if (!mod || !page) {
      return [{ label: 'Home', routerLink: '/dashboard' }];
    }
    return [
      { label: 'Home', routerLink: '/dashboard' },
      { label: mod.title, routerLink: `/${mod.routePath}` },
      { label: page.title }
    ];
  });

  private readRouteData(): RouteData | undefined {
    const data = this.route.snapshot.data as Partial<RouteData>;
    if (data.moduleId && data.pageId) {
      return { moduleId: data.moduleId, pageId: data.pageId };
    }
    return undefined;
  }
}
