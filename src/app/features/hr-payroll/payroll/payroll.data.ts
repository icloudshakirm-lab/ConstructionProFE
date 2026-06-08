import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import { employeeFullName, formatSalary } from '../employee-records/employee-records.data';
import {
  activeEmployees,
  initialAttendanceRecords,
  type AttendanceRecord
} from '../hr-attendance/hr-attendance.data';

export type PayrollRunStatus = 'draft' | 'pending_approval' | 'approved' | 'paid' | 'rejected';

export interface PayrollAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface PayrollAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface ProjectAllocationLine {
  projectId: string;
  projectName: string;
  allocationPct: number;
  chargedAmount: number;
}

export interface PayrollLineItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  currency: string;
  daysWorked: number;
  daysInMonth: number;
  overtimeHours: number;
  overtimePay: number;
  allowances: number;
  grossPay: number;
  statutoryDeductions: number;
  netPay: number;
  projectAllocations: ProjectAllocationLine[];
}

export interface PayrollRun {
  id: string;
  periodMonth: string;
  periodLabel: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  currency: string;
  lines: PayrollLineItem[];
  bankFileGenerated: boolean;
  audit: PayrollAuditEntry[];
  attachments: PayrollAttachment[];
}

export const PAYROLL_STATUS_FILTER_OPTIONS: { label: string; value: PayrollRunStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Paid', value: 'paid' },
  { label: 'Rejected', value: 'rejected' }
];

export function newPayrollRunId(): string {
  return `pr-${Date.now().toString(36).slice(-6)}`;
}

export function newPayrollLineId(): string {
  return `pl-${Date.now().toString(36).slice(-6)}`;
}

export function newAttachmentId(): string {
  return `prf-${Date.now().toString(36).slice(-6)}`;
}

export function auditTimestamp(): string {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function currentPeriodMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function periodLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function payrollStatusSeverity(
  status: PayrollRunStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'paid':
    case 'approved':
      return 'success';
    case 'pending_approval':
      return 'warn';
    case 'rejected':
      return 'danger';
    case 'draft':
      return 'secondary';
  }
}

export function payrollStatusLabel(status: PayrollRunStatus): string {
  const labels: Record<PayrollRunStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function canSubmitPayroll(run: PayrollRun): boolean {
  return run.status === 'draft' || run.status === 'rejected';
}

export function canApprovePayroll(run: PayrollRun): boolean {
  return run.status === 'pending_approval';
}

export function canMarkPaid(run: PayrollRun): boolean {
  return run.status === 'approved';
}

export function formatMoney(amount: number, currency: string): string {
  return formatSalary(amount, currency);
}

function projectName(id: string): string {
  return DEMO_PROJECTS.find((p) => p.id === id)?.name ?? id;
}

function countWorkedDays(
  employeeId: string,
  month: string,
  attendance: AttendanceRecord[]
): number {
  const prefix = month;
  return attendance.filter(
    (a) =>
      a.employeeId === employeeId &&
      a.attendanceDate.startsWith(prefix) &&
      (a.status === 'Present' || a.status === 'Half Day') &&
      (a.payrollSyncStatus === 'synced' || a.approvalStatus === 'approved')
  ).reduce((sum, a) => sum + (a.status === 'Half Day' ? 0.5 : 1), 0);
}

function buildAllocations(
  employeeId: string,
  month: string,
  attendance: AttendanceRecord[],
  grossPay: number
): ProjectAllocationLine[] {
  const monthRecords = attendance.filter(
    (a) => a.employeeId === employeeId && a.attendanceDate.startsWith(month) && a.projectId
  );
  const byProject = new Map<string, number>();
  for (const r of monthRecords) {
    const pid = r.projectId!;
    byProject.set(pid, (byProject.get(pid) ?? 0) + r.allocationPct);
  }
  const totalPct = [...byProject.values()].reduce((s, v) => s + v, 0) || 1;
  return [...byProject.entries()].map(([projectId, pct]) => ({
    projectId,
    projectName: projectName(projectId),
    allocationPct: Math.round((pct / totalPct) * 100),
    chargedAmount: Math.round((grossPay * pct) / totalPct)
  }));
}

export function buildPayrollLinesFromAttendance(
  periodMonth: string,
  attendance: AttendanceRecord[] = initialAttendanceRecords()
): PayrollLineItem[] {
  const dim = daysInMonth(periodMonth);
  const employees = activeEmployees();

  return employees.map((emp) => {
    const daysWorked = countWorkedDays(emp.id, periodMonth, attendance);
    const overtimeHours = Math.max(0, Math.round((daysWorked - 22) * 2));
    const overtimePay = Math.round((emp.basicSalary / dim / 8) * overtimeHours * 1.5);
    const allowances = emp.department === 'Fleet' ? 500 : 0;
    const grossPay = Math.round((emp.basicSalary / dim) * daysWorked) + overtimePay + allowances;
    const statutoryDeductions = Math.round(grossPay * 0.05);
    const netPay = grossPay - statutoryDeductions;

    return {
      id: newPayrollLineId(),
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: employeeFullName(emp),
      department: emp.department,
      basicSalary: emp.basicSalary,
      currency: emp.currency,
      daysWorked,
      daysInMonth: dim,
      overtimeHours,
      overtimePay,
      allowances,
      grossPay,
      statutoryDeductions,
      netPay,
      projectAllocations: buildAllocations(emp.id, periodMonth, attendance, grossPay)
    };
  });
}

export function buildPayrollRun(
  periodMonth: string,
  attendance?: AttendanceRecord[]
): PayrollRun {
  const lines = buildPayrollLinesFromAttendance(periodMonth, attendance);
  const currency = lines[0]?.currency ?? 'AED';
  const totalGross = lines.reduce((s, l) => s + l.grossPay, 0);
  const totalNet = lines.reduce((s, l) => s + l.netPay, 0);
  const totalDeductions = lines.reduce((s, l) => s + l.statutoryDeductions, 0);

  return {
    id: newPayrollRunId(),
    periodMonth,
    periodLabel: periodLabel(periodMonth),
    status: 'draft',
    employeeCount: lines.length,
    totalGross,
    totalNet,
    totalDeductions,
    currency,
    lines,
    bankFileGenerated: false,
    audit: [{ at: auditTimestamp(), action: `Payroll run created for ${periodLabel(periodMonth)}`, by: 'Payroll officer' }],
    attachments: []
  };
}

function previousMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function initialPayrollRuns(): PayrollRun[] {
  const lastMonth = previousMonth();
  const current = currentPeriodMonth();
  const paidRun = buildPayrollRun(lastMonth);
  paidRun.status = 'paid';
  paidRun.bankFileGenerated = true;
  paidRun.audit = [
    { at: auditTimestamp(), action: 'Payroll approved and bank file generated', by: 'Finance manager' },
    { at: auditTimestamp(), action: 'Marked as paid', by: 'Payroll officer' },
    ...paidRun.audit
  ];
  paidRun.attachments = [
    { id: 'prf-1', name: `bank-transfer-${lastMonth}.csv`, type: 'CSV', uploadedAt: lastMonth + '-28' },
    { id: 'prf-2', name: `payslips-${lastMonth}.zip`, type: 'Archive', uploadedAt: lastMonth + '-28' }
  ];

  const draftRun = buildPayrollRun(current);
  return [draftRun, paidRun];
}
