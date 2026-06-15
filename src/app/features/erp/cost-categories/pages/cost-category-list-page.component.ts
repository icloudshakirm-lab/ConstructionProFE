import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CostCategoriesApiService } from '../../../../core/api/cost-categories-api.service';
import { CostCentersApiService } from '../../../../core/api/cost-centers-api.service';
import type { CostCategoryDTO, CostCenterDTO } from '../../../../core/api/erp-api.models';
import { CostCategoryFormDialogComponent } from '../components/cost-category-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-cost-category-list-page',
  imports: [CommonModule, RouterLink, CostCategoryFormDialogComponent],
  templateUrl: './cost-category-list-page.component.html',
  styleUrl: './cost-category-list-page.component.css',
})
export class CostCategoryListPageComponent implements OnInit {
  private readonly api = inject(CostCategoriesApiService);
  private readonly costCentersApi = inject(CostCentersApiService);

  readonly rows = signal<CostCategoryDTO[]>([]);
  readonly costCenterLabels = signal<Map<number, string>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly formVisible = signal(false);

  openNew(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  ngOnInit(): void {
    this.load();
  }

  costCenterLabel(id: number): string {
    return this.costCenterLabels().get(id) ?? `id ${id}`;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      categories: this.api.list(),
      centers: this.costCentersApi.list(),
    }).subscribe({
      next: ({ categories, centers }) => {
        this.rows.set(categories);
        this.costCenterLabels.set(
          new Map(centers.map((c: CostCenterDTO) => [c.id, `${c.code} — ${c.name}`])),
        );
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
