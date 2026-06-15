import { Component, DestroyRef, inject, signal, viewChild, AfterViewInit, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ReportsApiService } from '../../../../core/api/reports-api.service';
import { LookupsApiService } from '../../../../core/api/lookups-api.service';
import type { ItemDTO, LookupDTO } from '../../../../core/api/erp-api.models';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Button, Select, TableModule, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Reports · Stock" severity="info" />
          <h1>Items by group</h1>
          <p class="erp-list-page__subtitle">List items belonging to a stock group.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Back to reports" icon="pi pi-arrow-left" [text]="true" routerLink="/erp/reports" />
        </div>
      </header>

      <form class="erp-list-page__toolbar" [formGroup]="form" (ngSubmit)="load()">
        <div class="erp-list-page__field">
          <label for="ibg-group">Stock group</label>
          <p-select
            #selectInput
            inputId="ibg-group"
            formControlName="groupId"
            [options]="groups()"
            optionLabel="name"
            optionValue="id"
            [filter]="true"
            filterBy="name"
            placeholder="Select a group"
            appendTo="body"
            styleClass="w-full"
            (onChange)="load()"
          />
        </div>
        <p-button type="submit" label="Run report" icon="pi pi-play" [loading]="loading()" />
        @if (rows().length > 0) {
          <span class="erp-list-page__count">{{ rows().length }} item(s)</span>
        }
      </form>

      @if (error()) {
        <p class="erp-list-page__alert">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="erp-list-page__loading">Loading report…</p>
      } @else {
        <p-table
          [value]="rows()"
          [rows]="15"
          [paginator]="rows().length > 15"
          dataKey="id"
          styleClass="cp-data-grid"
          [scrollable]="true"
          scrollHeight="flex"
        >
          <ng-template #header>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Barcode</th>
              <th>Group ID</th>
            </tr>
          </ng-template>
          <ng-template #body let-r>
            <tr>
              <td>{{ r.id }}</td>
              <td><strong>{{ r.title }}</strong></td>
              <td>{{ r.barcode }}</td>
              <td>{{ r.itemGroupId }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="cp-data-grid__empty">Select a group and run the report.</td>
            </tr>
          </ng-template>
        </p-table>
      }
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
    setTimeout(() => this.selectInput()?.focus(), 50);
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
