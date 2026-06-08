import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import {
  employeeFullName,
  initialEmployeeRecords,
  projectNameForId,
  siteNameForId,
  type EmployeeRecord
} from '../employee-records/employee-records.data';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday';
export type PayrollSyncStatus = 'pending' | 'synced' | 'failed' | 'not_applicable';
export type AttendanceApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type ExceptionType =
  | 'late_arrival'
  | 'early_departure'
  | 'missing_checkout'
  | 'wrong_project'
  | 'unapproved_overtime'
  | 'other';

export interface AttendanceAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface AttendanceAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  workedHours: number;
  projectId: string | null;
  siteId: string | null;
  allocationPct: number;
  exceptionType: ExceptionType | null;
  exceptionNotes: string;
  payrollSyncStatus: PayrollSyncStatus;
  payrollSyncAt: string;
  approvalStatus: AttendanceApprovalStatus;
  audit: AttendanceAuditEntry[];
  attachments: AttendanceAttachment[];
}

export type AttendanceFormValue = Pick<
  AttendanceRecord,
  | 'employeeId'
  | 'attendanceDate'
  | 'status'
  | 'checkIn'
  | 'checkOut'
  | 'workedHours'
  | 'projectId'
  | 'siteId'
  | 'allocationPct'
  | 'exceptionType'
  | 'exceptionNotes'
>;

export const ATTENDANCE_STATUS_OPTIONS: { label: string; value: AttendanceStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Present', value: 'Present' },
  { label: 'Half Day', value: 'Half Day' },
  { label: 'Absent', value: 'Absent' },
  { label: 'On Leave', value: 'On Leave' },
  { label: 'Holiday', value: 'Holiday' }
];

export const ATTENDANCE_FORM_STATUS_OPTIONS = ATTENDANCE_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const PAYROLL_SYNC_FILTER_OPTIONS: { label: string; value: PayrollSyncStatus | 'all' }[] = [
  { label: 'All sync states', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Synced', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'N/A', value: 'not_applicable' }
];

export const EXCEPTION_FILTER_OPTIONS: { label: string; value: ExceptionType | 'all' | 'none' }[] = [
  { label: 'All records', value: 'all' },
  { label: 'With exceptions', value: 'late_arrival' },
  { label: 'No exceptions', value: 'none' }
];

export const EXCEPTION_TYPE_OPTIONS: { label: string; value: ExceptionType | '' }[] = [
  { label: 'None', value: '' },
  { label: 'Late arrival', value: 'late_arrival' },
  { label: 'Early departure', value: 'early_departure' },
  { label: 'Missing check-out', value: 'missing_checkout' },
  { label: 'Wrong project allocation', value: 'wrong_project' },
  { label: 'Unapproved overtime', value: 'unapproved_overtime' },
  { label: 'Other', value: 'other' }
];

export const ATTENDANCE_APPROVAL_FILTER_OPTIONS: { label: string; value: AttendanceApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const DEPARTMENT_FILTER_OPTIONS = [
  { label: 'All departments', value: 'all' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Fleet', value: 'Fleet' },
  { label: 'HSE', value: 'HSE' },
  { label: 'Finance', value: 'Finance' },
  { label: 'HR', value: 'HR' },
  { label: 'Administration', value: 'Administration' }
];

export const PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const PROJECT_FORM_OPTIONS = PROJECT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export function allSiteFormOptions() {
  return DEMO_PROJECTS.flatMap((p) =>
    p.sites.map((s) => ({
      label: `${s.name} — ${p.name}`,
      value: s.id,
      projectId: p.id
    }))
  );
}

export function activeEmployees(): EmployeeRecord[] {
  return initialEmployeeRecords().filter((e) => e.status === 'Active' || e.status === 'Probation');
}

export function employeeSelectOptions() {
  return activeEmployees().map((e) => ({
    label: `${employeeFullName(e)} (${e.employeeCode})`,
    value: e.id
  }));
}

export function newAttendanceId(): string {
  return `att-${Date.now().toString(36).slice(-6)}`;
}

export function newAttachmentId(): string {
  return `attf-${Date.now().toString(36).slice(-6)}`;
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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function attendanceStatusSeverity(
  status: AttendanceStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'Present':
      return 'success';
    case 'Half Day':
      return 'info';
    case 'On Leave':
    case 'Holiday':
      return 'secondary';
    case 'Absent':
      return 'danger';
  }
}

export function payrollSyncSeverity(
  status: PayrollSyncStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'synced':
      return 'success';
    case 'pending':
      return 'warn';
    case 'failed':
      return 'danger';
    case 'not_applicable':
      return 'secondary';
  }
}

export function payrollSyncLabel(status: PayrollSyncStatus): string {
  const labels: Record<PayrollSyncStatus, string> = {
    pending: 'Pending sync',
    synced: 'Synced',
    failed: 'Sync failed',
    not_applicable: 'N/A'
  };
  return labels[status];
}

export function approvalStatusLabel(status: AttendanceApprovalStatus): string {
  const labels: Record<AttendanceApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: AttendanceApprovalStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
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

export function exceptionTypeLabel(type: ExceptionType | null): string {
  if (!type) return '—';
  return EXCEPTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function canSubmitForApproval(r: AttendanceRecord): boolean {
  return r.approvalStatus === 'draft' || r.approvalStatus === 'rejected';
}

export function canApproveOrReject(r: AttendanceRecord): boolean {
  return r.approvalStatus === 'pending_approval';
}

export function canSyncToPayroll(r: AttendanceRecord): boolean {
  return r.approvalStatus === 'approved' && r.payrollSyncStatus !== 'synced' && r.status !== 'Holiday';
}

export function defaultWorkedHours(status: AttendanceStatus): number {
  switch (status) {
    case 'Present':
      return 8;
    case 'Half Day':
      return 4;
    default:
      return 0;
  }
}

export function buildAttendanceFromEmployee(
  employee: EmployeeRecord,
  date: string,
  status: AttendanceStatus,
  extra: Partial<AttendanceRecord> = {}
): AttendanceRecord {
  return {
    id: newAttendanceId(),
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employeeFullName(employee),
    department: employee.department,
    designation: employee.designation,
    attendanceDate: date,
    status,
    checkIn: status === 'Present' || status === 'Half Day' ? '07:30' : '',
    checkOut: status === 'Present' ? '16:30' : status === 'Half Day' ? '12:00' : '',
    workedHours: defaultWorkedHours(status),
    projectId: employee.projectId,
    siteId: employee.siteId,
    allocationPct: employee.projectId ? 100 : 0,
    exceptionType: extra.exceptionType ?? null,
    exceptionNotes: extra.exceptionNotes ?? '',
    payrollSyncStatus: extra.payrollSyncStatus ?? (status === 'Holiday' ? 'not_applicable' : 'pending'),
    payrollSyncAt: extra.payrollSyncAt ?? '',
    approvalStatus: extra.approvalStatus ?? 'draft',
    audit: extra.audit ?? [{ at: auditTimestamp(), action: `Attendance marked: ${status}`, by: 'HR officer' }],
    attachments: extra.attachments ?? []
  };
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function initialAttendanceRecords(): AttendanceRecord[] {
  const employees = activeEmployees().slice(0, 8);
  const today = todayIso();
  const records: AttendanceRecord[] = [];

  const pattern: AttendanceStatus[] = ['Present', 'Present', 'Half Day', 'Present', 'Absent', 'On Leave', 'Present'];

  for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
    const date = addDays(today, dayOffset);
    employees.forEach((emp, i) => {
      const status = pattern[(i + dayOffset + 7) % pattern.length];
      const extra: Partial<AttendanceRecord> = {};
      if (dayOffset === 0 && i === 0) {
        extra.exceptionType = 'late_arrival';
        extra.exceptionNotes = 'Checked in 45 minutes late — traffic on site access road.';
        extra.checkIn = '08:15';
      }
      if (dayOffset === -1 && i === 2) {
        extra.exceptionType = 'wrong_project';
        extra.exceptionNotes = 'Allocated to P-001 but worked on P-003 mobilization.';
        extra.allocationPct = 60;
      }
      if (dayOffset === -2 && i === 1) {
        extra.approvalStatus = 'approved';
        extra.payrollSyncStatus = 'synced';
        extra.payrollSyncAt = auditTimestamp();
      }
      records.push(buildAttendanceFromEmployee(emp, date, status, extra));
    });
  }

  return records;
}

export function projectLabel(id: string | null): string {
  return projectNameForId(id);
}

export function siteLabel(id: string | null): string {
  return siteNameForId(id);
}
