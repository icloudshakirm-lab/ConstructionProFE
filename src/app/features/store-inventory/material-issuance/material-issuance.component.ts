import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import {
  COST_CODE_OPTIONS,
  ISSUANCE_APPROVAL_FILTER_OPTIONS,
  ISSUANCE_STATUS_OPTIONS,
  MATERIAL_CATALOG,
  PROJECT_FILTER_OPTIONS,
  PROJECT_FORM_OPTIONS,
  WAREHOUSE_OPTIONS,
  allSiteFormOptions,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  boqConsumptionForRecord,
  boqLineOptions,
  canApproveOrReject,
  canIssue,
  canSubmitForApproval,
  initialMaterialIssuances,
  issuanceStatusSeverity,
  lineAmount,
  newAttachmentId,
  newIssuanceId,
  newLineId,
  projectLabel,
  siteLabel,
  totalIssuanceAmount,
  varianceSeverity,
  type IssuanceFormValue,
  type MaterialIssueLine,
  type MaterialIssuanceRecord
} from './material-issuance.data';

@Component({
  selector: 'app-material-issuance',
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
  templateUrl: './material-issuance.component.html',
  styleUrl: './material-issuance.component.scss'
})
export class MaterialIssuanceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly statusFilterOptions = ISSUANCE_STATUS_OPTIONS;
  readonly approvalFilterOptions = ISSUANCE_APPROVAL_FILTER_OPTIONS;
  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly projectFormOptions = PROJECT_FORM_OPTIONS;
  readonly warehouseOptions = WAREHOUSE_OPTIONS;
  readonly costCodeOptions = COST_CODE_OPTIONS;
  readonly boqOptions = boqLineOptions();
  readonly materialOptions = MATERIAL_CATALOG.map((m) => ({
    label: `${m.code} — ${m.name}`,
    value: m.code,
    ...m
  }));
  readonly allSites = allSiteFormOptions();

  readonly records = signal<MaterialIssuanceRecord[]>(initialMaterialIssuances());

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | MaterialIssuanceRecord['approvalStatus']>('all');
  readonly projectFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.records()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailRecord = signal<MaterialIssuanceRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly recordToDelete = signal<MaterialIssuanceRecord | null>(null);

  readonly lineFormVisible = signal(false);
  readonly lineFormMode = signal<'create' | 'edit'>('create');
  readonly lineEditingId = signal<string | null>(null);
  readonly lineFormError = signal<string | null>(null);

  readonly issuanceForm = this.fb.nonNullable.group({
    issueNumber: ['', Validators.required],
    issueDate: ['', Validators.required],
    projectId: ['', Validators.required],
    siteId: ['', Validators.required],
    warehouse: ['', Validators.required],
    costCode: ['', Validators.required],
    requisitionRef: ['', Validators.maxLength(40)],
    requestedBy: ['', Validators.required],
    remarks: ['', Validators.maxLength(500)]
  });

  readonly lineForm = this.fb.nonNullable.group({
    materialCode: ['', Validators.required],
    boqItemId: ['', Validators.required],
    issuedQty: [0, [Validators.required, Validators.min(0.01)]],
    unitRate: [0, [Validators.required, Validators.min(0)]]
  });

  readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const project = this.projectFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.records()
      .filter((r) => {
        if (status !== 'all' && r.status !== status) return false;
        if (approval !== 'all' && r.approvalStatus !== approval) return false;
        if (project !== 'all' && r.projectId !== project) return false;
        if (!q) return true;
        return (
          r.issueNumber.toLowerCase().includes(q) ||
          r.requisitionRef.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q) ||
          r.costCode.toLowerCase().includes(q) ||
          projectLabel(r.projectId).toLowerCase().includes(q) ||
          r.lines.some(
            (l) =>
              l.boqItemCode.toLowerCase().includes(q) ||
              l.materialName.toLowerCase().includes(q) ||
              l.materialCode.toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  });

  readonly siteFormOptions = computed(() => {
    const projectId = this.issuanceForm.controls.projectId.value;
    if (!projectId) return this.allSites.map((s) => ({ label: s.label, value: s.value }));
    return this.allSites.filter((s) => s.projectId === projectId).map((s) => ({ label: s.label, value: s.value }));
  });

  readonly boqConsumption = computed(() => {
    const record = this.detailRecord();
    if (!record) return [];
    return boqConsumptionForRecord(record, this.records());
  });

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Create material issuance' : 'Edit material issuance'
  );

  readonly lineFormHeader = computed(() =>
    this.lineFormMode() === 'create' ? 'Add material line (BOQ tagged)' : 'Edit material line'
  );

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: 'Material Issuance' });
    return items;
  });

  projectName(id: string) {
    return projectLabel(id);
  }

  siteName(id: string) {
    return siteLabel(id);
  }

  totalAmount(r: MaterialIssuanceRecord) {
    return totalIssuanceAmount(r);
  }

  lineTotal(line: MaterialIssueLine) {
    return lineAmount(line);
  }

  statusSeverity(status: MaterialIssuanceRecord['status']) {
    return issuanceStatusSeverity(status);
  }

  approvalLabel(status: MaterialIssuanceRecord['approvalStatus']) {
    return approvalStatusLabel(status);
  }

  approvalSeverity(status: MaterialIssuanceRecord['approvalStatus']) {
    return approvalStatusSeverity(status);
  }

  varianceTagSeverity(pct: number) {
    return varianceSeverity(pct);
  }

  boqTagsSummary(r: MaterialIssuanceRecord): string {
    const codes = [...new Set(r.lines.map((l) => l.boqItemCode))];
    return codes.join(', ') || '—';
  }

  linesPreview(lines: MaterialIssueLine[]): MaterialIssueLine[] {
    return lines.slice(0, 2);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.issuanceForm.reset({
      issueNumber: `MIN-${Date.now().toString().slice(-4)}`,
      issueDate: new Date().toISOString().slice(0, 10),
      projectId: '',
      siteId: '',
      warehouse: 'Central store — HO',
      costCode: 'CIV-01',
      requisitionRef: '',
      requestedBy: '',
      remarks: ''
    });
    this.formVisible.set(true);
  }

  openEdit(row: MaterialIssuanceRecord): void {
    if (row.status === 'issued') return;
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.issuanceForm.patchValue(row);
    this.formVisible.set(true);
  }

  openDetail(row: MaterialIssuanceRecord): void {
    this.detailRecord.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.detailRecord.set(null);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  onProjectChange(): void {
    const projectId = this.issuanceForm.controls.projectId.value;
    const siteId = this.issuanceForm.controls.siteId.value;
    const site = this.allSites.find((s) => s.value === siteId);
    if (site && site.projectId !== projectId) {
      this.issuanceForm.controls.siteId.setValue('');
    }
  }

  saveIssuance(): void {
    if (this.issuanceForm.invalid) {
      this.issuanceForm.markAllAsTouched();
      this.formError.set('Please complete all required fields.');
      return;
    }
    const value = this.issuanceForm.getRawValue() as IssuanceFormValue;

    if (this.formMode() === 'create') {
      const created: MaterialIssuanceRecord = {
        id: newIssuanceId(),
        ...value,
        issuedBy: '',
        status: 'draft',
        approvalStatus: 'draft',
        lines: [],
        audit: [{ at: auditTimestamp(), action: 'Issuance note created', by: value.requestedBy }],
        attachments: []
      };
      this.records.update((list) => [created, ...list]);
      this.selectedId.set(created.id);
      this.closeForm();
      this.openDetail(created);
    } else {
      const id = this.editingId();
      if (!id) return;
      const existing = this.records().find((r) => r.id === id);
      if (!existing) return;
      const updated: MaterialIssuanceRecord = {
        ...existing,
        ...value,
        audit: [{ at: auditTimestamp(), action: 'Issuance note updated', by: value.requestedBy }, ...existing.audit]
      };
      this.patchRecord(updated);
      this.closeForm();
    }
  }

  requestDelete(row: MaterialIssuanceRecord): void {
    if (row.status === 'issued') return;
    this.recordToDelete.set(row);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.recordToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.recordToDelete();
    if (!target) return;
    this.records.update((list) => list.filter((r) => r.id !== target.id));
    if (this.selectedId() === target.id) this.selectedId.set(this.records()[0]?.id ?? null);
    if (this.detailRecord()?.id === target.id) this.closeDetail();
    this.cancelDelete();
  }

  submitForApproval(record: MaterialIssuanceRecord): void {
    if (!canSubmitForApproval(record)) return;
    this.patchRecord({
      ...record,
      status: 'pending_approval',
      approvalStatus: 'pending_approval',
      audit: [
        { at: auditTimestamp(), action: 'Submitted for store approval — BOQ consumption pending sign-off', by: record.requestedBy },
        ...record.audit
      ]
    });
  }

  approveIssuance(record: MaterialIssuanceRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Issuance approved — within BOQ budget check passed', by: 'Site superintendent' }, ...record.audit]
    });
  }

  rejectIssuance(record: MaterialIssuanceRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      status: 'draft',
      approvalStatus: 'rejected',
      audit: [
        { at: auditTimestamp(), action: 'Rejected — revise quantities or BOQ tag', by: 'Site superintendent' },
        ...record.audit
      ]
    });
  }

  issueMaterials(record: MaterialIssuanceRecord): void {
    if (!canIssue(record)) return;
    this.patchRecord({
      ...record,
      status: 'issued',
      issuedBy: 'Store keeper',
      audit: [
        {
          at: auditTimestamp(),
          action: `Materials issued — AED ${totalIssuanceAmount(record).toLocaleString()} charged to BOQ cost codes`,
          by: 'Store keeper'
        },
        ...record.audit
      ]
    });
  }

  canSubmit(r: MaterialIssuanceRecord) {
    return canSubmitForApproval(r);
  }

  canApprove(r: MaterialIssuanceRecord) {
    return canApproveOrReject(r);
  }

  canPostIssue(r: MaterialIssuanceRecord) {
    return canIssue(r);
  }

  mockAddAttachment(record: MaterialIssuanceRecord): void {
    const att = {
      id: newAttachmentId(),
      name: `Challan-${record.issueNumber}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRecord({
      ...record,
      attachments: [att, ...record.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${att.name}`, by: record.requestedBy }, ...record.audit]
    });
  }

  openAddLine(): void {
    this.lineFormMode.set('create');
    this.lineEditingId.set(null);
    this.lineFormError.set(null);
    this.lineForm.reset({ materialCode: '', boqItemId: '', issuedQty: 0, unitRate: 0 });
    this.lineFormVisible.set(true);
  }

  openEditLine(row: MaterialIssueLine): void {
    const record = this.detailRecord();
    if (!record || record.status === 'issued') return;
    this.lineFormMode.set('edit');
    this.lineEditingId.set(row.id);
    this.lineFormError.set(null);
    this.lineForm.patchValue({
      materialCode: row.materialCode,
      boqItemId: row.boqItemId,
      issuedQty: row.issuedQty,
      unitRate: row.unitRate
    });
    this.lineFormVisible.set(true);
  }

  closeLineForm(): void {
    this.lineFormVisible.set(false);
    this.lineFormError.set(null);
  }

  onMaterialChange(): void {
    const code = this.lineForm.controls.materialCode.value;
    const mat = MATERIAL_CATALOG.find((m) => m.code === code);
    if (!mat) return;
    this.lineForm.controls.unitRate.setValue(mat.typicalRate);
    if (this.lineFormMode() === 'create') {
      this.lineForm.controls.boqItemId.setValue(mat.boqItemId);
    }
  }

  onBoqChange(): void {
    const boqId = this.lineForm.controls.boqItemId.value;
    const boq = this.boqOptions.find((o) => o.value === boqId);
    if (!boq) return;
    const qty = this.lineForm.controls.issuedQty.value;
    if (qty > boq.budgetQty) {
      this.lineFormError.set(`Warning: issued qty exceeds BOQ budget qty (${boq.budgetQty} ${boq.unit})`);
    } else {
      this.lineFormError.set(null);
    }
  }

  saveLine(): void {
    const record = this.detailRecord();
    if (!record || record.status === 'issued') return;
    if (this.lineForm.invalid) {
      this.lineForm.markAllAsTouched();
      this.lineFormError.set('Please complete all required line fields.');
      return;
    }

    const raw = this.lineForm.getRawValue();
    const mat = MATERIAL_CATALOG.find((m) => m.code === raw.materialCode);
    const boq = this.boqOptions.find((o) => o.value === raw.boqItemId);
    if (!mat || !boq) return;

    const line: MaterialIssueLine = {
      id: this.lineFormMode() === 'create' ? newLineId() : this.lineEditingId()!,
      boqItemId: boq.value,
      boqItemCode: boq.itemCode,
      boqDescription: boq.description,
      boqSection: boq.section,
      materialCode: mat.code,
      materialName: mat.name,
      unit: mat.unit,
      issuedQty: raw.issuedQty,
      unitRate: raw.unitRate,
      boqBudgetQty: boq.budgetQty,
      boqBudgetAmount: boq.budgetAmount
    };

    const lines =
      this.lineFormMode() === 'create'
        ? [...record.lines, line]
        : record.lines.map((l) => (l.id === line.id ? line : l));

    this.patchRecord({
      ...record,
      lines,
      audit: [
        {
          at: auditTimestamp(),
          action:
            this.lineFormMode() === 'create'
              ? `Line added: ${mat.name} → BOQ ${boq.itemCode}`
              : `Line updated: ${mat.name} → BOQ ${boq.itemCode}`,
          by: record.requestedBy
        },
        ...record.audit
      ]
    });
    this.closeLineForm();
  }

  deleteLine(row: MaterialIssueLine): void {
    const record = this.detailRecord();
    if (!record || record.status === 'issued') return;
    this.patchRecord({
      ...record,
      lines: record.lines.filter((l) => l.id !== row.id),
      audit: [
        { at: auditTimestamp(), action: `Line removed: ${row.materialName} (BOQ ${row.boqItemCode})`, by: record.requestedBy },
        ...record.audit
      ]
    });
  }

  exportCsv(): void {
    const rows = this.filteredRecords();
    const header = [
      'issueNumber',
      'issueDate',
      'projectId',
      'siteId',
      'costCode',
      'status',
      'approvalStatus',
      'lineCount',
      'boqTags',
      'totalAmount'
    ];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.issueNumber,
          r.issueDate,
          r.projectId,
          r.siteId,
          r.costCode,
          r.status,
          r.approvalStatus,
          r.lines.length,
          `"${this.boqTagsSummary(r).replace(/"/g, '""')}"`,
          totalIssuanceAmount(r)
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'material-issuance-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private patchRecord(updated: MaterialIssuanceRecord): void {
    this.records.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRecord()?.id === updated.id) this.detailRecord.set(updated);
  }
}
