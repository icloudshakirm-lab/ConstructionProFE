import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { CompaniesApiService } from '../../../../core/api/companies-api.service';

@Component({
  standalone: true,
  selector: 'app-company-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, ToggleSwitch],
  templateUrl: './company-form-dialog.component.html',
})
export class CompanyFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CompaniesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() companyId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    legalName: [''],
    taxRegistrationNumber: [''],
    website: [''],
    primaryPhone: [''],
    primaryEmail: ['', [Validators.email]],
    notes: [''],
    isActive: [true],
  });

  get header(): string {
    return this.companyId != null ? 'Edit company' : 'New company';
  }

  get isEdit(): boolean {
    return this.companyId != null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    this.loading.set(false);
    if (this.companyId == null) {
      this.form.reset({
        code: '',
        name: '',
        legalName: '',
        taxRegistrationNumber: '',
        website: '',
        primaryPhone: '',
        primaryEmail: '',
        notes: '',
        isActive: true,
      });
      return;
    }

    this.loading.set(true);
    this.api.getById(this.companyId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          legalName: r.legalName ?? '',
          taxRegistrationNumber: r.taxRegistrationNumber ?? '',
          website: r.website ?? '',
          primaryPhone: r.primaryPhone ?? '',
          primaryEmail: r.primaryEmail ?? '',
          notes: r.notes ?? '',
          isActive: r.isActive,
        });
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
    if (!open) {
      this.error.set(null);
    }
  }

  cancel(): void {
    this.onVisibilityChange(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const payload = {
      code: v.code,
      name: v.name,
      legalName: v.legalName || null,
      taxRegistrationNumber: v.taxRegistrationNumber || null,
      website: v.website || null,
      primaryPhone: v.primaryPhone || null,
      primaryEmail: v.primaryEmail || null,
      notes: v.notes || null,
    };

    if (this.companyId == null) {
      this.api.create(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
          this.onVisibilityChange(false);
        },
        error: (e) => {
          this.error.set(this.msg(e));
          this.saving.set(false);
        },
      });
    } else {
      this.api.update(this.companyId, { ...payload, isActive: v.isActive }).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
          this.onVisibilityChange(false);
        },
        error: (e) => {
          this.error.set(this.msg(e));
          this.saving.set(false);
        },
      });
    }
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
