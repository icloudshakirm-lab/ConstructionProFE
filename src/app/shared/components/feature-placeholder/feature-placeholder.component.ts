import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-feature-placeholder',
  imports: [RouterLink, BreadcrumbModule, ButtonModule, CardModule, ChipModule, TagModule],
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss'
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly routeData = toSignal(
    this.route.data.pipe(map((data) => data as { moduleId: string; pageId: string }))
  );

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
}
