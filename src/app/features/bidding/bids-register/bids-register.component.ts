import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  BID_APPROVAL_FILTER_OPTIONS,
  CURRENCY_OPTIONS,
  INWARD_BID_TYPE_OPTIONS,
  INWARD_FORM_STATUS_OPTIONS,
  INWARD_STATUS_OPTIONS,
  OUTWARD_FORM_STATUS_OPTIONS,
  OUTWARD_STATUS_OPTIONS,
  PAGE_BID_DIRECTION,
  PAGE_SUBTITLES,
  PAGE_TITLES,
  PARTNER_INVITE_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PROJECT_FORM_OPTIONS,
  TRADE_PACKAGE_OPTIONS,
  allSiteFormOptions,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  inwardBidTypeLabel,
  newAttachmentId,
  newBidId,
  newQuotationId,
  partnerName,
  projectLabel,
  recordDisplayName,
  recordStatus,
  siteLabel,
  statusSeverityForRecord,
  initialBidRegisters,
  type BidDirection,
  type BidRegisterRecord,
  type OutwardQuotation
} from './bids-register.data';

@Component({
  selector: 'app-bids-register',
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Button,
    Checkbox,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    MultiSelect,
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
  templateUrl: './bids-register.component.html',
  styleUrl: './bids-register.component.scss'
})
export class BidsRegisterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly pageId = (this.route.snapshot.data['pageId'] as string) ?? 'inward-bids';
  readonly bidDirection: BidDirection = PAGE_BID_DIRECTION[this.pageId] ?? 'inward';
  readonly isInward = this.bidDirection === 'inward';
  readonly pageTitle = PAGE_TITLES[this.pageId] ?? 'Bids';
  readonly pageSubtitle = PAGE_SUBTITLES[this.pageId] ?? '';

  readonly approvalFilterOptions = BID_APPROVAL_FILTER_OPTIONS;
  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly projectFormOptions = PROJECT_FORM_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly inwardTypeOptions = INWARD_BID_TYPE_OPTIONS;
  readonly tradePackageOptions = TRADE_PACKAGE_OPTIONS;
  readonly partnerOptions = PARTNER_INVITE_OPTIONS;
  readonly inwardStatusOptions = INWARD_STATUS_OPTIONS;
  readonly outwardStatusOptions = OUTWARD_STATUS_OPTIONS;
  readonly inwardFormStatusOptions = INWARD_FORM_STATUS_OPTIONS;
  readonly outwardFormStatusOptions = OUTWARD_FORM_STATUS_OPTIONS;
  readonly allSites = allSiteFormOptions();

  readonly records = signal<BidRegisterRecord[]>(initialBidRegisters());

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | BidRegisterRecord['approvalStatus']>('all');
  readonly projectFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(
    this.records().find((r) => r.bidDirection === this.bidDirection)?.id ?? null
  );

  readonly detailVisible = signal(false);
  readonly detailRecord = signal<BidRegisterRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly recordToDelete = signal<BidRegisterRecord | null>(null);
  readonly childFormVisible = signal(false);
  readonly childFormMode = signal<'create' | 'edit'>('create');
  readonly childEditingId = signal<string | null>(null);
  readonly childFormError = signal<string | null>(null);

  readonly inwardForm = this.fb.nonNullable.group({
    bidNumber: ['', Validators.required],
    projectName: ['', Validators.required],
    clientName: ['', Validators.required],
    tenderReference: ['', Validators.required],
    bidType: ['lump_sum' as BidRegisterRecord['bidType'], Validators.required],
    submissionDeadline: ['', Validators.required],
    submittedDate: [''],
    bidValue: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED', Validators.required],
    marginPct: [0, [Validators.min(0), Validators.max(100)]],
    bondRequired: [false],
    bondAmount: [0, Validators.min(0)],
    competitors: [''],
    inwardStatus: ['draft' as BidRegisterRecord['inwardStatus'], Validators.required],
    bidManager: ['', Validators.required],
    scopeSummary: ['', Validators.required]
  });

  readonly outwardForm = this.fb.nonNullable.group({
    bidNumber: ['', Validators.required],
    packageName: ['', Validators.required],
    projectId: ['', Validators.required],
    siteId: ['', Validators.required],
    tradePackage: ['', Validators.required],
    invitationDate: ['', Validators.required],
    closingDate: ['', Validators.required],
    targetBudget: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED', Validators.required],
    invitedPartners: [[] as string[]],
    outwardStatus: ['draft' as BidRegisterRecord['outwardStatus'], Validators.required],
    bidManager: ['', Validators.required],
    scopeSummary: ['', Validators.required]
  });

  readonly quotationForm = this.fb.nonNullable.group({
    partnerName: ['', Validators.required],
    partnerType: ['subcontractor' as OutwardQuotation['partnerType'], Validators.required],
    quotedValue: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED', Validators.required],
    validityDays: [30, [Validators.required, Validators.min(1)]],
    receivedDate: ['', Validators.required],
    compliant: [true],
    notes: ['']
  });

  readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const project = this.projectFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.records()
      .filter((r) => r.bidDirection === this.bidDirection)
      .filter((r) => {
        if (status !== 'all' && recordStatus(r) !== status) return false;
        if (approval !== 'all' && r.approvalStatus !== approval) return false;
        if (project !== 'all' && r.projectId !== project) return false;
        if (!q) return true;
        const name = recordDisplayName(r).toLowerCase();
        return (
          name.includes(q) ||
          r.bidNumber.toLowerCase().includes(q) ||
          r.bidManager.toLowerCase().includes(q) ||
          (r.clientName?.toLowerCase().includes(q) ?? false) ||
          (r.tenderReference?.toLowerCase().includes(q) ?? false) ||
          (r.tradePackage?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => (b.submissionDeadline ?? b.closingDate ?? '').localeCompare(a.submissionDeadline ?? a.closingDate ?? ''));
  });

  readonly siteFormOptions = computed(() => {
    const projectId = this.outwardForm.controls.projectId.value;
    if (!projectId) return this.allSites.map((s) => ({ label: s.label, value: s.value }));
    return this.allSites.filter((s) => s.projectId === projectId).map((s) => ({ label: s.label, value: s.value }));
  });

  readonly addButtonLabel = computed(() => (this.isInward ? 'Add inward bid' : 'Add outward package'));

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? this.addButtonLabel() : `Edit ${this.isInward ? 'inward bid' : 'outward package'}`
  );

  readonly statusFilterOptions = computed(() =>
    this.isInward ? this.inwardStatusOptions : this.outwardStatusOptions
  );

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: this.pageTitle });
    return items;
  });

  displayName(r: BidRegisterRecord) {
    return recordDisplayName(r);
  }

  statusLabel(r: BidRegisterRecord) {
    return recordStatus(r);
  }

  statusSeverity(r: BidRegisterRecord) {
    return statusSeverityForRecord(r);
  }

  approvalLabel(s: BidRegisterRecord['approvalStatus']) {
    return approvalStatusLabel(s);
  }

  approvalSeverity(s: BidRegisterRecord['approvalStatus']) {
    return approvalStatusSeverity(s);
  }

  bidTypeLabel(t: BidRegisterRecord['bidType']) {
    return t ? inwardBidTypeLabel(t) : '—';
  }

  projectName(id: string | null | undefined) {
    return projectLabel(id);
  }

  siteName(id: string | null | undefined) {
    return siteLabel(id);
  }

  partnerLabel(id: string | null | undefined) {
    return partnerName(id);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    const prefix = this.isInward ? 'IB' : 'OB';
    const num = `${prefix}-${Date.now().toString().slice(-4)}`;
    if (this.isInward) {
      this.inwardForm.reset({
        bidNumber: num,
        projectName: '',
        clientName: '',
        tenderReference: '',
        bidType: 'lump_sum',
        submissionDeadline: '',
        submittedDate: '',
        bidValue: 0,
        currency: 'AED',
        marginPct: 10,
        bondRequired: false,
        bondAmount: 0,
        competitors: '',
        inwardStatus: 'draft',
        bidManager: '',
        scopeSummary: ''
      });
    } else {
      this.outwardForm.reset({
        bidNumber: num,
        packageName: '',
        projectId: '',
        siteId: '',
        tradePackage: 'Concrete works',
        invitationDate: '',
        closingDate: '',
        targetBudget: 0,
        currency: 'AED',
        invitedPartners: [],
        outwardStatus: 'draft',
        bidManager: '',
        scopeSummary: ''
      });
    }
    this.formVisible.set(true);
  }

  openEdit(row: BidRegisterRecord): void {
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    if (this.isInward) {
      this.inwardForm.patchValue({
        bidNumber: row.bidNumber,
        projectName: row.projectName ?? '',
        clientName: row.clientName ?? '',
        tenderReference: row.tenderReference ?? '',
        bidType: row.bidType ?? 'lump_sum',
        submissionDeadline: row.submissionDeadline ?? '',
        submittedDate: row.submittedDate ?? '',
        bidValue: row.bidValue ?? 0,
        currency: row.currency,
        marginPct: row.marginPct ?? 0,
        bondRequired: row.bondRequired ?? false,
        bondAmount: row.bondAmount ?? 0,
        competitors: row.competitors ?? '',
        inwardStatus: row.inwardStatus ?? 'draft',
        bidManager: row.bidManager,
        scopeSummary: row.scopeSummary
      });
    } else {
      this.outwardForm.patchValue({
        bidNumber: row.bidNumber,
        packageName: row.packageName ?? '',
        projectId: row.projectId ?? '',
        siteId: row.siteId ?? '',
        tradePackage: row.tradePackage ?? '',
        invitationDate: row.invitationDate ?? '',
        closingDate: row.closingDate ?? '',
        targetBudget: row.targetBudget ?? 0,
        currency: row.currency,
        invitedPartners: row.invitedPartners ?? [],
        outwardStatus: row.outwardStatus ?? 'draft',
        bidManager: row.bidManager,
        scopeSummary: row.scopeSummary
      });
    }
    this.formVisible.set(true);
  }

  openDetail(row: BidRegisterRecord): void {
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

  onOutwardProjectChange(): void {
    const projectId = this.outwardForm.controls.projectId.value;
    const siteId = this.outwardForm.controls.siteId.value;
    const site = this.allSites.find((s) => s.value === siteId);
    if (site && site.projectId !== projectId) {
      this.outwardForm.controls.siteId.setValue('');
    }
  }

  saveBid(): void {
    const form = this.isInward ? this.inwardForm : this.outwardForm;
    if (form.invalid) {
      form.markAllAsTouched();
      this.formError.set('Please complete all required fields.');
      return;
    }

    if (this.formMode() === 'create') {
      const base: BidRegisterRecord = {
        id: newBidId(),
        bidDirection: this.bidDirection,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Bid record created', by: form.getRawValue().bidManager }],
        attachments: [],
        ...(this.isInward
          ? {
              ...this.inwardForm.getRawValue(),
              bidPlanId: null,
              quotations: undefined
            }
          : {
              ...this.outwardForm.getRawValue(),
              awardedPartnerId: null,
              awardedValue: 0,
              quotations: []
            })
      } as BidRegisterRecord;
      this.records.update((list) => [base, ...list]);
      this.selectedId.set(base.id);
    } else {
      const id = this.editingId();
      if (!id) return;
      const existing = this.records().find((r) => r.id === id);
      if (!existing) return;
      const updated: BidRegisterRecord = {
        ...existing,
        ...(this.isInward ? this.inwardForm.getRawValue() : this.outwardForm.getRawValue()),
        audit: [{ at: auditTimestamp(), action: 'Bid record updated', by: form.getRawValue().bidManager }, ...existing.audit]
      };
      this.patchRecord(updated);
      if (this.detailRecord()?.id === id) this.detailRecord.set(updated);
    }
    this.closeForm();
  }

  requestDelete(row: BidRegisterRecord): void {
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
    if (this.selectedId() === target.id) {
      this.selectedId.set(this.records().find((r) => r.bidDirection === this.bidDirection)?.id ?? null);
    }
    if (this.detailRecord()?.id === target.id) this.closeDetail();
    this.cancelDelete();
  }

  submitForApproval(record: BidRegisterRecord): void {
    if (!canSubmitForApproval(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for commercial approval', by: record.bidManager }, ...record.audit]
    });
  }

  approveBid(record: BidRegisterRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Bid approved', by: 'Commercial director' }, ...record.audit]
    });
  }

  rejectBid(record: BidRegisterRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'rejected',
      audit: [{ at: auditTimestamp(), action: 'Bid rejected — revise pricing or scope', by: 'Commercial director' }, ...record.audit]
    });
  }

  issueInvitations(record: BidRegisterRecord): void {
    if (!record.invitedPartners?.length) return;
    this.patchRecord({
      ...record,
      outwardStatus: 'invited',
      audit: [
        { at: auditTimestamp(), action: `Invitations issued to ${record.invitedPartners.length} partner(s)`, by: record.bidManager },
        ...record.audit
      ]
    });
  }

  awardPackage(record: BidRegisterRecord, quotation: OutwardQuotation): void {
    this.patchRecord({
      ...record,
      outwardStatus: 'awarded',
      awardedPartnerId: this.partnerOptions.find((p) => p.label === quotation.partnerName)?.value ?? null,
      awardedValue: quotation.quotedValue,
      quotations: (record.quotations ?? []).map((q) => ({
        ...q,
        rank: q.id === quotation.id ? 1 : (q.rank ?? null)
      })),
      audit: [
        { at: auditTimestamp(), action: `Awarded to ${quotation.partnerName} at ${quotation.currency} ${quotation.quotedValue}`, by: record.bidManager },
        ...record.audit
      ]
    });
  }

  canSubmit(r: BidRegisterRecord) {
    return canSubmitForApproval(r);
  }

  canApprove(r: BidRegisterRecord) {
    return canApproveOrReject(r);
  }

  canInvite(r: BidRegisterRecord) {
    return !this.isInward && r.outwardStatus === 'draft' && (r.invitedPartners?.length ?? 0) > 0;
  }

  mockAddAttachment(record: BidRegisterRecord): void {
    const att = {
      id: newAttachmentId(),
      name: `Bid-${record.bidNumber}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRecord({
      ...record,
      attachments: [att, ...record.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${att.name}`, by: record.bidManager }, ...record.audit]
    });
  }

  openAddQuotation(): void {
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.quotationForm.reset({
      partnerName: '',
      partnerType: 'subcontractor',
      quotedValue: 0,
      currency: 'AED',
      validityDays: 30,
      receivedDate: new Date().toISOString().slice(0, 10),
      compliant: true,
      notes: ''
    });
    this.childFormVisible.set(true);
  }

  closeChildForm(): void {
    this.childFormVisible.set(false);
    this.childFormError.set(null);
  }

  saveQuotation(): void {
    const record = this.detailRecord();
    if (!record) return;
    if (this.quotationForm.invalid) {
      this.quotationForm.markAllAsTouched();
      this.childFormError.set('Please complete quotation fields.');
      return;
    }
    const value = this.quotationForm.getRawValue();
    const quote: OutwardQuotation = {
      id: newQuotationId(),
      ...value,
      rank: null
    };
    this.patchRecord({
      ...record,
      outwardStatus: record.outwardStatus === 'invited' ? 'evaluating' : record.outwardStatus,
      quotations: [...(record.quotations ?? []), quote],
      audit: [{ at: auditTimestamp(), action: `Quotation received: ${quote.partnerName}`, by: record.bidManager }, ...record.audit]
    });
    this.closeChildForm();
  }

  exportCsv(): void {
    const rows = this.filteredRecords();
    const header = this.isInward
      ? ['bidNumber', 'projectName', 'clientName', 'bidValue', 'currency', 'marginPct', 'submissionDeadline', 'inwardStatus', 'approvalStatus']
      : ['bidNumber', 'packageName', 'projectId', 'tradePackage', 'targetBudget', 'closingDate', 'outwardStatus', 'approvalStatus'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        this.isInward
          ? [
              r.bidNumber,
              `"${(r.projectName ?? '').replace(/"/g, '""')}"`,
              `"${(r.clientName ?? '').replace(/"/g, '""')}"`,
              r.bidValue,
              r.currency,
              r.marginPct,
              r.submissionDeadline,
              r.inwardStatus,
              r.approvalStatus
            ].join(',')
          : [
              r.bidNumber,
              `"${(r.packageName ?? '').replace(/"/g, '""')}"`,
              r.projectId,
              r.tradePackage,
              r.targetBudget,
              r.closingDate,
              r.outwardStatus,
              r.approvalStatus
            ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.pageId}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private patchRecord(updated: BidRegisterRecord): void {
    this.records.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRecord()?.id === updated.id) this.detailRecord.set(updated);
  }
}
