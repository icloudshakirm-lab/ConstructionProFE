import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnitsApiService } from '../../../core/api/units-api.service';
import type {
  CreateUnitOfMeasureRequest,
  UnitOfMeasureDTO,
  UpdateUnitOfMeasureRequest,
} from '../../../core/api/erp-api.models';

@Component({
  standalone: true,
  selector: 'app-units-page',
  imports: [
    CommonModule,
    TableModule,
    Button,
    InputText,
    Dialog,
    Textarea,
    Select,
    ToggleSwitch,
    FormsModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Units of Measure</h1>
          <p class="text-sm text-slate-500">Define measurement units for products (e.g., Pcs, Kg, Box, Dozen).</p>
        </div>
        <p-button label="Add Unit" icon="pi pi-plus" (click)="showAddDialog()"></p-button>
      </div>

      <div class="bg-white dark:bg-slate-900 shadow rounded-xl border border-slate-200 dark:border-slate-800">
        <p-table
          [value]="units()"
          [loading]="loading()"
          [rows]="10"
          [paginator]="true"
          styleClass="cp-data-grid cp-data-grid--compact"
          responsiveLayout="scroll"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Base Unit</th>
              <th>Conversion Factor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-unit>
            <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td class="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                {{ unit.code }}
              </td>
              <td>{{ unit.name }}</td>
              <td class="text-slate-600 dark:text-slate-400 font-mono text-xs">{{ unit.symbol || '—' }}</td>
              <td>
                @if (unit.isBase) {
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200"
                  >
                    Base Unit
                  </span>
                } @else {
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    Derived
                  </span>
                }
              </td>
              <td class="text-slate-600 dark:text-slate-400">
                {{ getBaseUnitName(unit.baseUnitId) }}
              </td>
              <td class="font-mono text-xs text-slate-950 dark:text-slate-50">
                @if (unit.isBase) {
                  1.000000
                } @else {
                  {{ unit.conversionFactor | number: '1.0-6' }}
                }
              </td>
              <td>
                @if (unit.isActive) {
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Active
                  </span>
                } @else {
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    Inactive
                  </span>
                }
              </td>
              <td class="cp-data-grid__num">
                <p-button
                  icon="pi pi-pencil"
                  (click)="showEditDialog(unit)"
                  variant="text"
                  size="small"
                  severity="info"
                ></p-button>
                <p-button
                  icon="pi pi-trash"
                  (click)="delete(unit.id)"
                  variant="text"
                  size="small"
                  severity="danger"
                ></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="cp-data-grid__empty">No units found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog
      [header]="editingUnit() ? 'Edit Unit' : 'Add Unit'"
      [(visible)]="displayDialog"
      [modal]="true"
      [style]="{ width: 'min(calc(100vw - 2rem), 32rem)' }"
      [draggable]="false"
      [resizable]="false"
    >
      @if (error()) {
        <p
          class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {{ error() }}
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 pt-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="code" class="text-sm font-medium text-slate-700 dark:text-slate-300"
              >Code *</label
            >
            <input
              id="code"
              pInputText
              formControlName="code"
              placeholder="e.g. PCS"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="name" class="text-sm font-medium text-slate-700 dark:text-slate-300"
              >Name *</label
            >
            <input
              id="name"
              pInputText
              formControlName="name"
              placeholder="e.g. Pieces"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="symbol" class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Symbol</label
          >
          <input
            id="symbol"
            pInputText
            formControlName="symbol"
            placeholder="e.g. pcs"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="description" class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Description</label
          >
          <textarea
            id="description"
            pTextarea
            formControlName="description"
            rows="3"
            placeholder="Optional details..."
            class="w-full"
          ></textarea>
        </div>

        <div
          class="flex items-center gap-3 py-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
        >
          <p-toggleSwitch id="isBase" formControlName="isBase"></p-toggleSwitch>
          <div>
            <label for="isBase" class="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >Is Base Unit</label
            >
            <p class="text-xs text-slate-500">
              Base units are standard measurements (e.g. Pieces, kg) that other units convert to.
            </p>
          </div>
        </div>

        @if (!form.get('isBase')?.value) {
          <div
            class="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800"
          >
            <div class="flex flex-col gap-1.5">
              <label for="baseUnit" class="text-sm font-medium text-slate-700 dark:text-slate-300"
                >Base Unit *</label
              >
              <p-select
                id="baseUnit"
                formControlName="baseUnitId"
                [options]="baseUnits()"
                optionLabel="name"
                optionValue="id"
                placeholder="Select Base Unit"
                styleClass="w-full"
                [showClear]="true"
                appendTo="body"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label
                for="conversionFactor"
                class="text-sm font-medium text-slate-700 dark:text-slate-300"
                >Conversion Factor *</label
              >
              <input
                id="conversionFactor"
                type="number"
                step="any"
                pInputText
                formControlName="conversionFactor"
                placeholder="e.g. 12"
                class="w-full"
              />
            </div>
          </div>
        }

        <div class="flex items-center gap-3 py-2">
          <p-toggleSwitch id="isActive" formControlName="isActive"></p-toggleSwitch>
          <label for="isActive" class="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >Is Active</label
          >
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-slate-150 dark:border-slate-800">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            variant="text"
            severity="secondary"
            (click)="displayDialog.set(false)"
          ></p-button>
          <p-button
            type="submit"
            [label]="editingUnit() ? 'Update' : 'Save'"
            icon="pi pi-check"
            [disabled]="form.invalid || saving()"
            [loading]="saving()"
          ></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .p-select {
        width: 100%;
      }
      textarea {
        resize: none;
      }
    `,
  ],
})
export class UnitsPageComponent implements OnInit {
  private readonly unitsApi = inject(UnitsApiService);
  private readonly fb = inject(FormBuilder);

  readonly units = signal<UnitOfMeasureDTO[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly displayDialog = signal(false);
  readonly editingUnit = signal<UnitOfMeasureDTO | null>(null);

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(1)]],
    name: ['', [Validators.required, Validators.minLength(1)]],
    symbol: [''],
    description: [''],
    isBase: [true],
    baseUnitId: [{ value: null as number | null, disabled: true }, Validators.required],
    conversionFactor: [
      { value: 1, disabled: true },
      [Validators.required, Validators.min(0.000001)],
    ],
    isActive: [true],
  });

  // Base units available for selection (excluding the unit being edited to prevent self-reference)
  readonly baseUnits = computed(() => {
    const list = this.units();
    const editing = this.editingUnit();
    return list.filter((u) => u.isBase && (!editing || u.id !== editing.id));
  });

  ngOnInit(): void {
    this.loadUnits();

    // Dynamically toggle validations and disabled state when isBase changes
    this.form.get('isBase')?.valueChanges.subscribe((isBase) => {
      const baseCtrl = this.form.get('baseUnitId');
      const convCtrl = this.form.get('conversionFactor');
      if (isBase) {
        baseCtrl?.setValue(null);
        baseCtrl?.disable();
        baseCtrl?.clearValidators();

        convCtrl?.setValue(1);
        convCtrl?.disable();
        convCtrl?.clearValidators();
      } else {
        baseCtrl?.enable();
        baseCtrl?.setValidators([Validators.required]);

        convCtrl?.enable();
        convCtrl?.setValue(null);
        convCtrl?.setValidators([Validators.required, Validators.min(0.000001)]);
      }
      baseCtrl?.updateValueAndValidity();
      convCtrl?.updateValueAndValidity();
    });
  }

  loadUnits(): void {
    this.loading.set(true);
    this.unitsApi.list().subscribe({
      next: (data) => {
        this.units.set(data);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(this.msg(e));
      },
    });
  }

  getBaseUnitName(baseUnitId: number | null): string {
    if (!baseUnitId) return '—';
    const found = this.units().find((u) => u.id === baseUnitId);
    return found ? `${found.name} (${found.code})` : '—';
  }

  showAddDialog(): void {
    this.editingUnit.set(null);
    this.error.set(null);
    this.saving.set(false);
    this.form.reset({
      code: '',
      name: '',
      symbol: '',
      description: '',
      isBase: true,
      baseUnitId: null,
      conversionFactor: 1,
      isActive: true,
    });
    this.displayDialog.set(true);
  }

  showEditDialog(unit: UnitOfMeasureDTO): void {
    this.editingUnit.set(unit);
    this.error.set(null);
    this.saving.set(false);
    this.form.reset({
      code: unit.code,
      name: unit.name,
      symbol: unit.symbol || '',
      description: unit.description || '',
      isBase: unit.isBase,
      baseUnitId: unit.baseUnitId,
      conversionFactor: unit.conversionFactor || 1,
      isActive: unit.isActive,
    });
    this.displayDialog.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const editing = this.editingUnit();

    this.saving.set(true);
    this.error.set(null);

    if (editing) {
      const request: UpdateUnitOfMeasureRequest = {
        code: val.code!,
        name: val.name!,
        description: val.description || null,
        symbol: val.symbol || null,
        conversionFactor: val.isBase ? 1 : Number(val.conversionFactor),
        baseUnitId: val.isBase ? null : val.baseUnitId,
        isBase: val.isBase!,
        isActive: val.isActive!,
      };
      this.unitsApi.update(editing.id, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.displayDialog.set(false);
          this.loadUnits();
        },
        error: (e) => {
          this.saving.set(false);
          this.error.set(this.msg(e));
        },
      });
    } else {
      const request: CreateUnitOfMeasureRequest = {
        code: val.code!,
        name: val.name!,
        description: val.description || null,
        symbol: val.symbol || null,
        conversionFactor: val.isBase ? 1 : Number(val.conversionFactor),
        baseUnitId: val.isBase ? null : val.baseUnitId,
        isBase: val.isBase!,
        isActive: val.isActive!,
      };
      this.unitsApi.create(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.displayDialog.set(false);
          this.loadUnits();
        },
        error: (e) => {
          this.saving.set(false);
          this.error.set(this.msg(e));
        },
      });
    }
  }

  delete(id: number): void {
    if (confirm('Are you sure you want to delete this unit of measure?')) {
      this.loading.set(true);
      this.unitsApi.delete(id).subscribe({
        next: () => {
          this.loadUnits();
        },
        error: (e) => {
          this.loading.set(false);
          alert(this.msg(e));
        },
      });
    }
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
