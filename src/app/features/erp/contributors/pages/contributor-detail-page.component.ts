import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContributorsApiService } from '../../../../core/api/contributors-api.service';
import type { ContributorRecord } from '../../../../core/api/erp-api.models';
import { ContributorFormDialogComponent } from '../components/contributor-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-contributor-detail-page',
  imports: [CommonModule, RouterLink, ContributorFormDialogComponent],
  templateUrl: './contributor-detail-page.component.html',
  styleUrl: './contributor-detail-page.component.css',
})
export class ContributorDetailPageComponent implements OnInit {
  private readonly api = inject(ContributorsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly row = signal<ContributorRecord | null>(null);
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
    if (id == null || !confirm('Delete this contributor?')) {
      return;
    }
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: () => void this.router.navigateByUrl('/app/contributors'),
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
