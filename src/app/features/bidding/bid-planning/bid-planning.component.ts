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
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  BID_PLAN_APPROVAL_FILTER_OPTIONS,
  BID_PLAN_FORM_STATUS_OPTIONS,
  BID_PLAN_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  SECTOR_OPTIONS,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  canApproveOrReject,
  canConvertToBid,
  canSubmitForApproval,
  daysUntilDue,
  initialBidPlans,
  newAttachmentId,
  newBidPlanId,
  planStatusLabel,
  planStatusSeverity,
  type BidPlanFormValue,
  type BidPlanRecord
} from './bid-planning.data';

@Component({
  selector: 'app-bid-planning',
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
    Tag,
    Textarea
  ],
  templateUrl: './bid-planning.component.html',
  styleUrl: './bid-planning.component.scss'
})
export class BidPlanningComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly statusFilterOptions = BID_PLAN_STATUS_OPTIONS;
  readonly approvalFilterOptions = BID_PLAN_APPROVAL_FILTER_OPTIONS;
  readonly sectorOptions = SECTOR_OPTIONS;
  readonly formStatusOptions = BID_PLAN_FORM_STATUS_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly plans = signal<BidPlanRecord[]>(initialBidPlans());
  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | BidPlanRecord['approvalStatus']>('all');
  readonly sectorFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.plans()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailPlan = signal<BidPlanRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly planToDelete = signal<BidPlanRecord | null>(null);

  readonly planForm = this.fb.nonNullable.group({
    planCode: ['', [Validators.required, Validators.maxLength(24)]],
    opportunityName: ['', [Validators.required, Validators.maxLength(120)]],
    clientName: ['', [Validators.required, Validators.maxLength(80)]],
    sector: ['', Validators.required],
    estimatedValue: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED', Validators.required],
    location: ['', Validators.maxLength(80)],
    rfpReceivedDate: ['', Validators.required],
    bidDueDate: ['', Validators.required],
    status: ['identified' as BidPlanRecord['status'], Validators.required],
    winProbabilityPct: [25, [Validators.min(0), Validators.max(100)]],
    bidManager: ['', [Validators.required, Validators.maxLength(80)]],
    estimator: ['', Validators.maxLength(80)],
    goNoGoDate: [''],
    scopeSummary: ['', [Validators.required, Validators.maxLength(1000)]],
    risks: ['', Validators.maxLength(500)]
  });

  readonly filteredPlans = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const sector = this.sectorFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.plans()
      .filter((p) => {
        if (status !== 'all' && p.status !== status) return false;
        if (approval !== 'all' && p.approvalStatus !== approval) return false;
        if (sector !== 'all' && p.sector !== sector) return false;
        if (!q) return true;
        return (
          p.opportunityName.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.planCode.toLowerCase().includes(q) ||
          p.bidManager.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.bidDueDate.localeCompare(b.bidDueDate));
  });

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Add bid opportunity' : 'Edit bid opportunity'
  );

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: 'Bid Planning' });
    return items;
  });

  readonly sectorFilterOptions = computed(() => [
    { label: 'All sectors', value: 'all' },
    ...SECTOR_OPTIONS
  ]);

  statusLabel(s: BidPlanRecord['status']) {
    return planStatusLabel(s);
  }

  statusSeverity(s: BidPlanRecord['status']) {
    return planStatusSeverity(s);
  }

  approvalLabel(s: BidPlanRecord['approvalStatus']) {
    return approvalStatusLabel(s);
  }

  approvalSeverity(s: BidPlanRecord['approvalStatus']) {
    return approvalStatusSeverity(s);
  }

  dueInDays(dueDate: string) {
    return daysUntilDue(dueDate);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.planForm.reset({
      planCode: `BPL-${Date.now().toString().slice(-4)}`,
      opportunityName: '',
      clientName: '',
      sector: 'Commercial high-rise',
      estimatedValue: 0,
      currency: 'AED',
      location: '',
      rfpReceivedDate: '',
      bidDueDate: '',
      status: 'identified',
      winProbabilityPct: 25,
      bidManager: '',
      estimator: '',
      goNoGoDate: '',
      scopeSummary: '',
      risks: ''
    });
    this.formVisible.set(true);
  }

  openEdit(row: BidPlanRecord): void {
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.planForm.patchValue(row);
    this.formVisible.set(true);
  }

  openDetail(row: BidPlanRecord): void {
    this.detailPlan.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.detailPlan.set(null);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  savePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      this.formError.set('Please complete all required fields.');
      return;
    }
    const value = this.planForm.getRawValue() as BidPlanFormValue;

    if (this.formMode() === 'create') {
      const created: BidPlanRecord = {
        id: newBidPlanId(),
        ...value,
        linkedInwardBidId: null,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Opportunity added to bid pipeline', by: value.bidManager }],
        attachments: []
      };
      this.plans.update((list) => [created, ...list]);
      this.selectedId.set(created.id);
    } else {
      const id = this.editingId();
      if (!id) return;
      const existing = this.plans().find((p) => p.id === id);
      if (!existing) return;
      this.patchPlan({
        ...existing,
        ...value,
        audit: [{ at: auditTimestamp(), action: 'Bid plan updated', by: value.bidManager }, ...existing.audit]
      });
    }
    this.closeForm();
  }

  requestDelete(row: BidPlanRecord): void {
    this.planToDelete.set(row);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.planToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.planToDelete();
    if (!target) return;
    this.plans.update((list) => list.filter((p) => p.id !== target.id));
    if (this.selectedId() === target.id) this.selectedId.set(this.plans()[0]?.id ?? null);
    if (this.detailPlan()?.id === target.id) this.closeDetail();
    this.cancelDelete();
  }

  submitForApproval(plan: BidPlanRecord): void {
    if (!canSubmitForApproval(plan)) return;
    this.patchPlan({
      ...plan,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for go/no-go approval', by: plan.bidManager }, ...plan.audit]
    });
  }

  approvePlan(plan: BidPlanRecord): void {
    if (!canApproveOrReject(plan)) return;
    this.patchPlan({
      ...plan,
      approvalStatus: 'approved',
      status: plan.status === 'identified' || plan.status === 'qualifying' ? 'go' : plan.status,
      audit: [{ at: auditTimestamp(), action: 'Go/no-go approved — proceed to bid', by: 'Commercial director' }, ...plan.audit]
    });
  }

  rejectPlan(plan: BidPlanRecord): void {
    if (!canApproveOrReject(plan)) return;
    this.patchPlan({
      ...plan,
      approvalStatus: 'rejected',
      audit: [{ at: auditTimestamp(), action: 'Go/no-go rejected — revise scope or margin', by: 'Commercial director' }, ...plan.audit]
    });
  }

  markPlanned(plan: BidPlanRecord): void {
    if (plan.status !== 'go') return;
    this.patchPlan({
      ...plan,
      status: 'planned',
      audit: [{ at: auditTimestamp(), action: 'Marked as planned to bid', by: plan.bidManager }, ...plan.audit]
    });
  }

  convertToInwardBid(plan: BidPlanRecord): void {
    if (!canConvertToBid(plan)) return;
    const inwardBidId = `ibd-${Date.now().toString(36).slice(-6)}`;
    this.patchPlan({
      ...plan,
      status: 'converted',
      linkedInwardBidId: inwardBidId,
      audit: [
        {
          at: auditTimestamp(),
          action: `Converted to inward bid — create IB record in Inward Bids (${inwardBidId})`,
          by: plan.bidManager
        },
        ...plan.audit
      ]
    });
  }

  canSubmit(p: BidPlanRecord) {
    return canSubmitForApproval(p);
  }

  canApprove(p: BidPlanRecord) {
    return canApproveOrReject(p);
  }

  canConvert(p: BidPlanRecord) {
    return canConvertToBid(p);
  }

  canMarkPlanned(p: BidPlanRecord) {
    return p.status === 'go' && p.approvalStatus === 'approved';
  }

  mockAddAttachment(plan: BidPlanRecord): void {
    const att = {
      id: newAttachmentId(),
      name: `RFP-${Date.now().toString(36).slice(-4)}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchPlan({
      ...plan,
      attachments: [att, ...plan.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${att.name}`, by: plan.bidManager }, ...plan.audit]
    });
  }

  exportCsv(): void {
    const rows = this.filteredPlans();
    const header = [
      'planCode',
      'opportunityName',
      'clientName',
      'sector',
      'estimatedValue',
      'currency',
      'bidDueDate',
      'status',
      'winProbabilityPct',
      'bidManager',
      'approvalStatus'
    ];
    const lines = [
      header.join(','),
      ...rows.map((p) =>
        [
          p.planCode,
          `"${p.opportunityName.replace(/"/g, '""')}"`,
          `"${p.clientName.replace(/"/g, '""')}"`,
          p.sector,
          p.estimatedValue,
          p.currency,
          p.bidDueDate,
          p.status,
          p.winProbabilityPct,
          `"${p.bidManager.replace(/"/g, '""')}"`,
          p.approvalStatus
        ].join(',')
      )
    ];
    this.downloadCsv(lines.join('\n'), 'bid-planning-export.csv');
  }

  private patchPlan(updated: BidPlanRecord): void {
    this.plans.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    if (this.detailPlan()?.id === updated.id) this.detailPlan.set(updated);
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
