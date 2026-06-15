import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CompaniesApiService } from '../../../core/api/companies-api.service';
import { CompanyDTO } from '../../../core/api/erp-api.models';
import { CompanyFormDialogComponent } from './components/company-form-dialog.component';
import { Button } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-company-info-page',
  imports: [CommonModule, CompanyFormDialogComponent, Button],
  templateUrl: './company-info-page.component.html',
})
export class CompanyInfoPageComponent implements OnInit {
  private readonly api = inject(CompaniesApiService);

  readonly companies = signal<CompanyDTO[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formVisible = signal(false);
  readonly selectedCompanyId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (data) => {
        this.companies.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.msg(err));
        this.loading.set(false);
      },
    });
  }

  openNew(): void {
    this.selectedCompanyId.set(null);
    this.formVisible.set(true);
  }

  openEdit(id: number): void {
    this.selectedCompanyId.set(id);
    this.formVisible.set(true);
  }

  onFormVisibleChange(visible: boolean): void {
    this.formVisible.set(visible);
    if (!visible) {
      this.selectedCompanyId.set(null);
    }
  }

  remove(id: number): void {
    if (!confirm('Are you sure you want to delete this company?')) {
      return;
    }
    this.api.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => alert(this.msg(err)),
    });
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}

