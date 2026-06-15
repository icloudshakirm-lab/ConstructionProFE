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
import { CurrenciesApiService } from '../../../../core/api/currencies-api.service';

@Component({
  standalone: true,
  selector: 'app-currency-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button],
  templateUrl: './currency-form-dialog.component.html',
  styleUrl: './currency-form-dialog.component.css',
})
export class CurrencyFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CurrenciesApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() currencyId: number | null = null;
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    symbol: [''],
    decimalPlaces: [null as number | null],
    description: [''],
  });

  get header(): string {
    return this.currencyId != null ? 'Edit currency' : 'New currency';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.prepareOpen();
    }
  }

  private prepareOpen(): void {
    this.error.set(null);
    this.saving.set(false);
    if (this.currencyId == null) {
      this.form.reset({ code: '', name: '', symbol: '', decimalPlaces: null, description: '' });
      return;
    }
    this.api.getById(this.currencyId).subscribe({
      next: (r) => {
        this.form.patchValue({
          code: r.code,
          name: r.name,
          symbol: r.symbol ?? '',
          decimalPlaces: r.decimalPlaces ?? null,
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

    const dp = v.decimalPlaces;
    const body = {
      code: v.code,
      name: v.name,
      symbol: v.symbol?.trim() ? v.symbol.trim() : null,
      decimalPlaces: dp === null || dp === undefined || Number.isNaN(Number(dp)) ? null : Number(dp),
      description: v.description?.trim() ? v.description.trim() : null,
    };

    if (this.currencyId == null) {
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
      this.api.update(this.currencyId, body).subscribe({
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
