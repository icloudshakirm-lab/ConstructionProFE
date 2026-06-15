import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContributorsApiService } from '../../../../core/api/contributors-api.service';
import type { ContributorListResponse } from '../../../../core/api/erp-api.models';
import { ContributorFormDialogComponent } from '../components/contributor-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-contributor-list-page',
  imports: [CommonModule, RouterLink, ContributorFormDialogComponent],
  templateUrl: './contributor-list-page.component.html',
  styleUrl: './contributor-list-page.component.css',
})
export class ContributorListPageComponent implements OnInit {
  private readonly api = inject(ContributorsApiService);

  readonly result = signal<ContributorListResponse | null>(null);
  readonly page = signal(1);
  readonly perPage = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly formContributorId = signal<number | null>(null);

  openNew(): void {
    this.formContributorId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.formContributorId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
    if (!v) {
      this.formContributorId.set(null);
    }
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list(this.page(), this.perPage()).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  setPage(p: number): void {
    if (p < 1) {
      return;
    }
    this.page.set(p);
    this.load();
  }

  onPerPageChange(ev: Event): void {
    const t = ev.target as HTMLSelectElement;
    this.perPage.set(Number(t.value));
    this.page.set(1);
    this.load();
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
