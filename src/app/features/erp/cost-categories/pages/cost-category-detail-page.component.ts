import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { forkJoin } from 'rxjs';
import { CostCategoriesApiService } from '../../../../core/api/cost-categories-api.service';
import { CostCentersApiService } from '../../../../core/api/cost-centers-api.service';
import type { CostCategoryDTO, CostCenterDTO } from '../../../../core/api/erp-api.models';
import { CostCategoryFormDialogComponent } from '../components/cost-category-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-cost-category-detail-page',
  imports: [CommonModule, RouterLink, Button, CostCategoryFormDialogComponent],
  templateUrl: './cost-category-detail-page.component.html',
  styleUrl: './cost-category-detail-page.component.css',
})
export class CostCategoryDetailPageComponent implements OnInit {
  private readonly api = inject(CostCategoriesApiService);
  private readonly costCentersApi = inject(CostCentersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly row = signal<CostCategoryDTO | null>(null);
  readonly costCenterLabel = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly formVisible = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.error.set('Invalid id');
      this.loading.set(false);
      return;
    }
    this.fetchRow(id);
  }

  private fetchRow(id: number): void {
    this.loading.set(true);
    forkJoin({
      category: this.api.getById(id),
      centers: this.costCentersApi.list(),
    }).subscribe({
      next: ({ category, centers }) => {
        this.row.set(category);
        const map = new Map(centers.map((c: CostCenterDTO) => [c.id, `${c.code} — ${c.name}`]));
        this.costCenterLabel.set(map.get(category.costCenterId) ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  openEdit(): void {
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  onFormSaved(): void {
    const id = this.row()?.id;
    if (id != null) {
      this.fetchRow(id);
    }
  }

  remove(): void {
    const id = this.row()?.id;
    if (id == null || !confirm('Delete this cost category?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => void this.router.navigateByUrl('/erp/cost-categories'),
      error: (e) => {
        this.error.set(this.msg(e));
        this.deleting.set(false);
      },
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
