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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { LedgersApiService } from '../../../core/api/ledgers-api.service';
import { LedgerGroupsApiService } from '../../../core/api/ledger-groups-api.service';

@Component({
  standalone: true,
  selector: 'app-chart-of-account-add-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Button,
  ],
  templateUrl: './chart-of-account-add-dialog.component.html',
  styleUrl: './chart-of-account-add-dialog.component.css',
})
export class ChartOfAccountAddDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly ledgersApi = inject(LedgersApiService);
  private readonly groupsApi = inject(LedgerGroupsApiService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Ledger group under which the new ledger or child group is created. */
  @Input() parentGroupId: number | null = null;
  @Input() parentLabel = '';
  /** Which tab to show first (`+ Ledger` vs `+ Group` from the tree). */
  @Input() initialTab: 'ledger' | 'group' = 'ledger';
  @Output() saved = new EventEmitter<void>();

  activeTab: 'ledger' | 'group' = 'ledger';

  readonly savingLedger = signal(false);
  readonly savingGroup = signal(false);
  readonly errorLedger = signal<string | null>(null);
  readonly errorGroup = signal<string | null>(null);

  readonly ledgerForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    type: [0],
  });

  readonly groupForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.activeTab = this.initialTab;
      this.errorLedger.set(null);
      this.errorGroup.set(null);
      this.savingLedger.set(false);
      this.savingGroup.set(false);
      this.ledgerForm.reset({ code: '', name: '', description: '', type: 0 });
      this.groupForm.reset({ code: '', name: '', description: '' });
    }
  }

  onVisibilityChange(open: boolean): void {
    this.visibleChange.emit(open);
  }

  cancel(): void {
    this.onVisibilityChange(false);
  }

  onTabChange(value: string | number | undefined): void {
    if (value === 'ledger' || value === 'group') {
      this.activeTab = value;
    }
  }

  submitLedger(): void {
    if (this.parentGroupId == null) {
      this.errorLedger.set('Missing parent group.');
      return;
    }
    if (this.ledgerForm.invalid) {
      this.ledgerForm.markAllAsTouched();
      return;
    }
    const v = this.ledgerForm.getRawValue();
    this.savingLedger.set(true);
    this.errorLedger.set(null);
    this.ledgersApi
      .create({
        code: v.code,
        name: v.name,
        description: v.description || null,
        groupLedgerId: this.parentGroupId,
        type: v.type,
      })
      .subscribe({
        next: () => {
          this.savingLedger.set(false);
          this.saved.emit();
          this.onVisibilityChange(false);
        },
        error: (e) => {
          this.errorLedger.set(this.msg(e));
          this.savingLedger.set(false);
        },
      });
  }

  submitGroup(): void {
    if (this.parentGroupId == null) {
      this.errorGroup.set('Missing parent group.');
      return;
    }
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }
    const v = this.groupForm.getRawValue();
    this.savingGroup.set(true);
    this.errorGroup.set(null);
    this.groupsApi
      .create({
        code: v.code,
        name: v.name,
        description: v.description || null,
        parentGroupId: this.parentGroupId,
      })
      .subscribe({
        next: () => {
          this.savingGroup.set(false);
          this.saved.emit();
          this.onVisibilityChange(false);
        },
        error: (e) => {
          this.errorGroup.set(this.msg(e));
          this.savingGroup.set(false);
        },
      });
  }

  private msg(e: unknown): string {
    const err = e as {
      message?: string;
      error?: { detail?: string; title?: string; message?: string };
    };
    return (
      err.error?.detail ??
      err.error?.title ??
      err.error?.message ??
      err.message ??
      'Request failed'
    );
  }
}
