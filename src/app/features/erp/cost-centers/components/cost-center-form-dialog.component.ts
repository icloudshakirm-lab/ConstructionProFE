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
import { CostCentersApiService } from '../../../../core/api/cost-centers-api.service';

@Component({
  standalone: true,
  selector: 'app-cost-center-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button],
  templateUrl: './cost-center-form-dialog.component.html',
  styleUrl: './cost-center-form-dialog.component.css',
})
export class CostCenterFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CostCentersApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** When set, dialog loads the row and submits PUT. */
  @Input() costCenterId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
  });

  get header(): string {
    return this.costCenterId != null ? 'Edit cost center' : 'New cost center';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.costCenterId == null) {
      this.form.reset({ code: '', name: '', description: '' });
      return;
    }
    this.api.getById(this.costCenterId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          description: r.description ?? '',
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

    const body = {
      code: v.code,
      name: v.name,
      description: v.description || null,
    };

    if (this.costCenterId == null) {
      this.api.create(body).subscribe({
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
      this.api.update(this.costCenterId, body).subscribe({
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
