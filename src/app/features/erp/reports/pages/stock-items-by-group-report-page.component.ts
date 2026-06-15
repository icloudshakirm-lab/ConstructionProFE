import { Component, DestroyRef, inject, signal, viewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ItemDTO, LookupDTO } from '../../../../core/api/erp-api.models';
import { Select } from 'primeng/select';
import { OnInit } from '@angular/core';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Select],
  template: `
    <div class="mx-auto max-w-5xl space-y-4">
      <header class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-50">Items by group</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">GET /reports/stock/items-by-group/(groupId)</p>
      </header>

      <form class="flex flex-wrap items-end gap-3" [formGroup]="form" (ngSubmit)="load()">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Stock Group</label>
          <p-select
            #selectInput
            formControlName="groupId"
            [options]="groups()"
            optionLabel="name"
            optionValue="id"
            [filter]="true"
            filterBy="name"
            placeholder="Select a Group"
            styleClass="w-64"
            (onChange)="load()"
            (keydown.enter)="load()"
          ></p-select>
        </div>
        <button
          type="submit"
          class="rounded-lg bg-[var(--p-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--p-primary-contrast-color)] shadow-sm hover:opacity-95"
        >
          Run
        </button>
        @if (error()) {
          <span class="text-sm text-rose-700 dark:text-rose-300">{{ error() }}</span>
        }
      </form>

      <div class="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table class="cp-data-grid__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Barcode</th>
              <th>Group ID</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="4" class="cp-data-grid__empty">Loading…</td>
              </tr>
            } @else if (rows().length === 0) {
              <tr>
                <td colspan="4" class="cp-data-grid__empty">No rows.</td>
              </tr>
            } @else {
              @for (r of rows(); track r.id) {
                <tr>
                  <td>{{ r.id }}</td>
                  <td>{{ r.title }}</td>
                  <td>{{ r.barcode }}</td>
                  <td>{{ r.itemGroupId }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StockItemsByGroupReportPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ReportsApiService);
  private readonly lookups = inject(LookupsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    groupId: this.fb.control<number | null>(null),
  });

  readonly selectInput = viewChild<Select>('selectInput');

  readonly groups = signal<LookupDTO[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<ItemDTO[]>([]);

  ngOnInit(): void {
    this.lookups.listItemGroups().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.groups.set(data),
      error: () => this.error.set('Failed to load groups list.'),
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.selectInput()?.focus();
    }, 50);
  }

  load(): void {
    const groupId = this.form.get('groupId')?.value;
    if (!groupId) {
      this.error.set('Please select a group.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api
      .getItemsByGroup(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.rows.set(r ?? []);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(e instanceof Error ? e.message : 'Failed to load report.');
        },
      });
  }
}

