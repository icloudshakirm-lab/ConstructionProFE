import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { getModuleById } from '../../core/constants/feature-registry';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-module-hub',
  imports: [RouterLink, BreadcrumbModule, CardModule, TagModule],
  templateUrl: './module-hub.component.html',
  styleUrl: './module-hub.component.scss'
})
export class ModuleHubComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly moduleId = toSignal(
    this.route.data.pipe(map((data) => (data as { moduleId: string }).moduleId))
  );

  readonly module = computed(() => {
    const id = this.moduleId();
    return id ? getModuleById(id) : undefined;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const mod = this.module();
    if (!mod) {
      return [{ label: 'Home', routerLink: '/dashboard' }];
    }
    return [{ label: 'Home', routerLink: '/dashboard' }, { label: mod.title }];
  });
}
