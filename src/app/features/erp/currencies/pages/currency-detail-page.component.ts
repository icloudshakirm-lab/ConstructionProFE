import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';
import type { CurrencyDTO } from '../../../../core/api/erp-api.models';
import { CurrencyFormDialogComponent } from '../components/currency-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-currency-detail-page',
  imports: [CommonModule, RouterLink, CurrencyFormDialogComponent],
  templateUrl: './currency-detail-page.component.html',
  styleUrl: './currency-detail-page.component.css',
})
export class CurrencyDetailPageComponent implements OnInit {
  private readonly api = inject(CurrenciesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly row = signal<CurrencyDTO | null>(null);
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
    this.api.getById(id).subscribe({
      next: (r) => {
        this.row.set(r);
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
    if (id == null || !confirm('Delete this currency?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => void this.router.navigateByUrl('/app/currencies'),
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
