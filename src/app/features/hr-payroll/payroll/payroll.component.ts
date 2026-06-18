import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { PayrollRunsApiService } from '../../../core/api/project-planning';
import {
  PAYROLL_STATUS_FILTER_OPTIONS,
  auditTimestamp,
  buildPayrollRun,
  canApprovePayroll,
  canMarkPaid,
  canSubmitPayroll,
  currentPeriodMonth,
  formatMoney,
  initialPayrollRuns,
  newAttachmentId,
  payrollStatusLabel,
  payrollStatusSeverity,
  type PayrollLineItem,
  type PayrollRun
} from './payroll.data';

@Component({
  selector: 'app-payroll',
  imports: [
    FormsModule,
    Breadcrumb,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Select,
    TableModule,
    Tag
  ],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss'
})
export class PayrollComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly payrollRunsApi = inject(PayrollRunsApiService);

  readonly statusFilterOptions = PAYROLL_STATUS_FILTER_OPTIONS;
  readonly runs = signal<PayrollRun[]>([]);

  readonly statusFilter = signal<'all' | PayrollRun['status']>('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.runs()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailRun = signal<PayrollRun | null>(null);
  readonly lineDetailVisible = signal(false);
  readonly lineDetail = signal<PayrollLineItem | null>(null);
  readonly createConfirmVisible = signal(false);
  readonly newPeriodMonth = signal(currentPeriodMonth());

  readonly filteredRuns = computed(() => {
    const status = this.statusFilter();
    const q = this.searchText().trim().toLowerCase();
    return this.runs()
      .filter((r) => {
        if (status !== 'all' && r.status !== status) return false;
        if (!q) return true;
        return r.periodLabel.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      })
      .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
  });

  ngOnInit(): void {
    this.payrollRunsApi.list().subscribe({
      next: (data) => console.log('[Payroll] GET /payroll-runs', data),
      error: (err) => console.error('[Payroll] GET /payroll-runs failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: 'Payroll' });
    return items;
  });

  statusSeverity(status: PayrollRun['status']) {
    return payrollStatusSeverity(status);
  }

  statusLabel(status: PayrollRun['status']) {
    return payrollStatusLabel(status);
  }

  money(amount: number, currency: string) {
    return formatMoney(amount, currency);
  }

  openCreate(): void {
    this.newPeriodMonth.set(currentPeriodMonth());
    this.createConfirmVisible.set(true);
  }

  confirmCreateRun(): void {
    const month = this.newPeriodMonth();
    if (this.runs().some((r) => r.periodMonth === month)) {
      return;
    }
    const run = buildPayrollRun(month);
    this.runs.update((list) => [run, ...list]);
    this.selectedId.set(run.id);
    this.createConfirmVisible.set(false);
  }

  openDetail(run: PayrollRun): void {
    this.detailRun.set(run);
    this.selectedId.set(run.id);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  openLineDetail(line: PayrollLineItem): void {
    this.lineDetail.set(line);
    this.lineDetailVisible.set(true);
  }

  submitForApproval(run: PayrollRun): void {
    if (!canSubmitPayroll(run)) return;
    this.patchRun({
      ...run,
      status: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for payroll approval', by: 'Payroll officer' }, ...run.audit]
    });
  }

  approveRun(run: PayrollRun): void {
    if (!canApprovePayroll(run)) return;
    this.patchRun({
      ...run,
      status: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Payroll run approved', by: 'Finance manager' }, ...run.audit]
    });
  }

  rejectRun(run: PayrollRun): void {
    if (!canApprovePayroll(run)) return;
    this.patchRun({
      ...run,
      status: 'rejected',
      audit: [{ at: auditTimestamp(), action: 'Payroll run rejected — recalculate', by: 'Finance manager' }, ...run.audit]
    });
  }

  generateBankFile(run: PayrollRun): void {
    if (run.status !== 'approved' && run.status !== 'paid') return;
    const att = {
      id: newAttachmentId(),
      name: `bank-transfer-${run.periodMonth}.csv`,
      type: 'CSV',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRun({
      ...run,
      bankFileGenerated: true,
      attachments: [att, ...run.attachments],
      audit: [{ at: auditTimestamp(), action: 'Bank transfer file generated', by: 'Payroll system' }, ...run.audit]
    });
  }

  markPaid(run: PayrollRun): void {
    if (!canMarkPaid(run)) return;
    this.patchRun({
      ...run,
      status: 'paid',
      audit: [{ at: auditTimestamp(), action: 'Payroll marked as paid', by: 'Payroll officer' }, ...run.audit]
    });
  }

  recalculate(run: PayrollRun): void {
    const rebuilt = buildPayrollRun(run.periodMonth);
    this.patchRun({
      ...rebuilt,
      id: run.id,
      status: run.status === 'paid' ? 'approved' : 'draft',
      bankFileGenerated: false,
      audit: [{ at: auditTimestamp(), action: 'Recalculated from synced attendance', by: 'Payroll officer' }, ...run.audit]
    });
  }

  canSubmit(run: PayrollRun) {
    return canSubmitPayroll(run);
  }

  canApprove(run: PayrollRun) {
    return canApprovePayroll(run);
  }

  canPay(run: PayrollRun) {
    return canMarkPaid(run);
  }

  exportCsv(run: PayrollRun): void {
    const header = [
      'employeeCode',
      'employeeName',
      'department',
      'daysWorked',
      'basicSalary',
      'overtimePay',
      'allowances',
      'grossPay',
      'deductions',
      'netPay'
    ];
    const lines = [
      header.join(','),
      ...run.lines.map((l) =>
        [
          l.employeeCode,
          `"${l.employeeName.replace(/"/g, '""')}"`,
          l.department,
          l.daysWorked,
          l.basicSalary,
          l.overtimePay,
          l.allowances,
          l.grossPay,
          l.statutoryDeductions,
          l.netPay
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `payroll-${run.periodMonth}.csv`;
    a.click();
  }

  private patchRun(updated: PayrollRun): void {
    this.runs.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRun()?.id === updated.id) {
      this.detailRun.set(updated);
    }
  }
}
