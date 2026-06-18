import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import { MaterialConsumptionApiService } from '../../../core/api/project-planning';
import {
  BOQ_SECTION_FILTER_OPTIONS,
  CONSUMPTION_APPROVAL_FILTER_OPTIONS,
  CONSUMPTION_STATUS_OPTIONS,
  COST_CODE_FILTER_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  consumptionStatusLabel,
  consumptionStatusSeverity,
  initialConsumptionRecords,
  newAttachmentId,
  projectConsumptionSummary,
  projectLabel,
  siteLabel,
  type ConsumptionAdjustmentFormValue,
  type MaterialConsumptionRecord
} from './material-consumption.data';

@Component({
  selector: 'app-material-consumption',
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Select,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    Textarea
  ],
  templateUrl: './material-consumption.component.html',
  styleUrl: './material-consumption.component.scss'
})
export class MaterialConsumptionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly materialConsumptionApi = inject(MaterialConsumptionApiService);

  readonly statusFilterOptions = CONSUMPTION_STATUS_OPTIONS;
  readonly approvalFilterOptions = CONSUMPTION_APPROVAL_FILTER_OPTIONS;
  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly costCodeFilterOptions = COST_CODE_FILTER_OPTIONS;
  readonly sectionFilterOptions = BOQ_SECTION_FILTER_OPTIONS;

  readonly records = signal<MaterialConsumptionRecord[]>([]);

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | MaterialConsumptionRecord['approvalStatus']>('all');
  readonly projectFilter = signal('all');
  readonly costCodeFilter = signal('all');
  readonly sectionFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.records()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailRecord = signal<MaterialConsumptionRecord | null>(null);
  readonly adjustVisible = signal(false);
  readonly adjustError = signal<string | null>(null);

  readonly adjustForm = this.fb.nonNullable.group({
    consumedQty: [0, [Validators.required, Validators.min(0)]],
    consumedAmount: [0, [Validators.required, Validators.min(0)]],
    notes: ['', Validators.maxLength(500)]
  });

  readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const project = this.projectFilter();
    const costCode = this.costCodeFilter();
    const section = this.sectionFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.records()
      .filter((r) => {
        if (status !== 'all' && r.status !== status) return false;
        if (approval !== 'all' && r.approvalStatus !== approval) return false;
        if (project !== 'all' && r.projectId !== project) return false;
        if (costCode !== 'all' && r.costCode !== costCode) return false;
        if (section !== 'all' && r.boqSection !== section) return false;
        if (!q) return true;
        return (
          r.boqItemCode.toLowerCase().includes(q) ||
          r.boqDescription.toLowerCase().includes(q) ||
          r.costCode.toLowerCase().includes(q) ||
          projectLabel(r.projectId).toLowerCase().includes(q) ||
          siteLabel(r.siteId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.varianceAmountPct - a.varianceAmountPct);
  });

  readonly summary = computed(() => projectConsumptionSummary(this.records(), this.projectFilter()));

  ngOnInit(): void {
    this.materialConsumptionApi.list().subscribe({
      next: (data) => console.log('[MaterialConsumption] GET /material-consumption', data),
      error: (err) => console.error('[MaterialConsumption] GET /material-consumption failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: 'Material Consumption by Project' });
    return items;
  });

  projectName(id: string) {
    return projectLabel(id);
  }

  siteName(id: string | null) {
    return siteLabel(id);
  }

  statusLabel(s: MaterialConsumptionRecord['status']) {
    return consumptionStatusLabel(s);
  }

  statusSeverity(s: MaterialConsumptionRecord['status']) {
    return consumptionStatusSeverity(s);
  }

  approvalLabel(s: MaterialConsumptionRecord['approvalStatus']) {
    return approvalStatusLabel(s);
  }

  approvalSeverity(s: MaterialConsumptionRecord['approvalStatus']) {
    return approvalStatusSeverity(s);
  }

  openDetail(row: MaterialConsumptionRecord): void {
    this.detailRecord.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.detailRecord.set(null);
  }

  openAdjust(row: MaterialConsumptionRecord): void {
    this.detailRecord.set(row);
    this.adjustError.set(null);
    this.adjustForm.reset({
      consumedQty: row.consumedQty,
      consumedAmount: row.consumedAmount,
      notes: row.notes
    });
    this.adjustVisible.set(true);
  }

  closeAdjust(): void {
    this.adjustVisible.set(false);
    this.adjustError.set(null);
  }

  saveAdjustment(): void {
    const record = this.detailRecord();
    if (!record) return;
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      this.adjustError.set('Please enter valid consumption values.');
      return;
    }

    const value = this.adjustForm.getRawValue() as ConsumptionAdjustmentFormValue;
    const varianceQtyPct = record.budgetQty > 0 ? Math.round((value.consumedQty / record.budgetQty) * 1000) / 10 : 0;
    const varianceAmountPct =
      record.budgetAmount > 0 ? Math.round((value.consumedAmount / record.budgetAmount) * 1000) / 10 : 0;
    const status =
      varianceAmountPct > 100 ? 'over_budget' : varianceAmountPct > 80 ? 'warning' : 'on_track';

    const updated: MaterialConsumptionRecord = {
      ...record,
      ...value,
      remainingQty: record.budgetQty - value.consumedQty,
      remainingAmount: record.budgetAmount - value.consumedAmount,
      varianceQtyPct,
      varianceAmountPct,
      status,
      approvalStatus: 'draft',
      lastUpdated: new Date().toISOString().slice(0, 10),
      audit: [
        { at: auditTimestamp(), action: 'Consumption quantities adjusted — pending approval', by: 'Cost controller' },
        ...record.audit
      ]
    };

    this.patchRecord(updated);
    this.closeAdjust();
  }

  submitForApproval(record: MaterialConsumptionRecord): void {
    if (!canSubmitForApproval(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'pending_approval',
      audit: [
        { at: auditTimestamp(), action: 'Submitted for QS / cost controller approval', by: 'Cost controller' },
        ...record.audit
      ]
    });
  }

  approveRecord(record: MaterialConsumptionRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Consumption record approved for P&L', by: 'QS manager' }, ...record.audit]
    });
  }

  rejectRecord(record: MaterialConsumptionRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'rejected',
      audit: [
        { at: auditTimestamp(), action: 'Rejected — verify issuance tags and site quantities', by: 'QS manager' },
        ...record.audit
      ]
    });
  }

  canSubmit(r: MaterialConsumptionRecord) {
    return canSubmitForApproval(r);
  }

  canApprove(r: MaterialConsumptionRecord) {
    return canApproveOrReject(r);
  }

  mockAddAttachment(record: MaterialConsumptionRecord): void {
    const att = {
      id: newAttachmentId(),
      name: `Consumption-report-${record.boqItemCode}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRecord({
      ...record,
      attachments: [att, ...record.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${att.name}`, by: 'Cost controller' }, ...record.audit]
    });
  }

  exportCsv(): void {
    const rows = this.filteredRecords();
    const header = [
      'boqItemCode',
      'boqDescription',
      'projectId',
      'siteId',
      'costCode',
      'budgetQty',
      'consumedQty',
      'varianceQtyPct',
      'budgetAmount',
      'consumedAmount',
      'varianceAmountPct',
      'status',
      'approvalStatus'
    ];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.boqItemCode,
          `"${r.boqDescription.replace(/"/g, '""')}"`,
          r.projectId,
          r.siteId ?? '',
          r.costCode,
          r.budgetQty,
          r.consumedQty,
          r.varianceQtyPct,
          r.budgetAmount,
          r.consumedAmount,
          r.varianceAmountPct,
          r.status,
          r.approvalStatus
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'material-consumption-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private patchRecord(updated: MaterialConsumptionRecord): void {
    this.records.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRecord()?.id === updated.id) this.detailRecord.set(updated);
  }
}
