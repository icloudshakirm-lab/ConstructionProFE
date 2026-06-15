import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { CostCentersApiService } from '../../../../core/api/cost-centers-api.service';
import type { CostCenterDTO } from '../../../../core/api/erp-api.models';
import { CostCenterFormDialogComponent } from '../components/cost-center-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-cost-center-list-page',
  imports: [CommonModule, RouterLink, Button, TableModule, Tag, CostCenterFormDialogComponent],
  templateUrl: './cost-center-list-page.component.html',
  styleUrl: './cost-center-list-page.component.css',
})
export class CostCenterListPageComponent implements OnInit {
  private readonly api = inject(CostCentersApiService);

  readonly rows = signal<CostCenterDTO[]>([]);
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

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
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
