import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../core/constants/feature-registry';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-module-hub',
  imports: [RouterLink, Breadcrumb, Card, Tag],
  templateUrl: './module-hub.component.html',
  styleUrl: './module-hub.component.scss'
})
export class ModuleHubComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly moduleId = signal<string | undefined>(
    (this.route.snapshot.data as { moduleId?: string }).moduleId
  );

  constructor() {
    this.route.data
      .pipe(
        map((data) => (data as { moduleId: string }).moduleId),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => this.moduleId.set(id));
  }

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
