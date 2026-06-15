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
import { ContributorsApiService } from '../../../../core/api/contributors-api.service';

@Component({
  standalone: true,
  selector: 'app-contributor-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button],
  templateUrl: './contributor-form-dialog.component.html',
  styleUrl: './contributor-form-dialog.component.css',
})
export class ContributorFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ContributorsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() contributorId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phoneNumber: [''],
  });

  get header(): string {
    return this.contributorId != null ? 'Edit contributor' : 'New contributor';
  }

  get isEdit(): boolean {
    return this.contributorId != null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.contributorId == null) {
      this.form.reset({ name: '', phoneNumber: '' });
      return;
    }
    this.api.getById(this.contributorId).subscribe({
      next: (r) => {
        this.form.patchValue({
          name: r.name,
          phoneNumber: r.phoneNumber ?? '',
        });
      },
      error: (e) => this.error.set(this.msg(e)),
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

    if (this.contributorId == null) {
      this.api
        .create({
          name: v.name,
          phoneNumber: v.phoneNumber || null,
        })
        .subscribe({
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
      this.api
        .update(this.contributorId, {
          id: this.contributorId,
          name: v.name,
        })
        .subscribe({
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
