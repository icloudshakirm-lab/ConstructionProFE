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
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  ATTENDANCE_APPROVAL_FILTER_OPTIONS,
  ATTENDANCE_FORM_STATUS_OPTIONS,
  ATTENDANCE_STATUS_OPTIONS,
  DEPARTMENT_FILTER_OPTIONS,
  EXCEPTION_TYPE_OPTIONS,
  PAYROLL_SYNC_FILTER_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PROJECT_FORM_OPTIONS,
  activeEmployees,
  allSiteFormOptions,
  approvalStatusLabel,
  approvalStatusSeverity,
  attendanceStatusSeverity,
  auditTimestamp,
  buildAttendanceFromEmployee,
  canApproveOrReject,
  canSubmitForApproval,
  canSyncToPayroll,
  defaultWorkedHours,
  employeeSelectOptions,
  exceptionTypeLabel,
  initialAttendanceRecords,
  newAttachmentId,
  newAttendanceId,
  payrollSyncLabel,
  payrollSyncSeverity,
  projectLabel,
  siteLabel,
  todayIso,
  type AttendanceFormValue,
  type AttendanceRecord,
  type AttendanceStatus
} from './hr-attendance.data';

interface AttendanceRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  record: AttendanceRecord | null;
}

@Component({
  selector: 'app-hr-attendance',
  imports: [
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
  templateUrl: './hr-attendance.component.html',
  styleUrl: './hr-attendance.component.scss'
})
export class HrAttendanceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly statusFilterOptions = ATTENDANCE_STATUS_OPTIONS;
  readonly syncFilterOptions = PAYROLL_SYNC_FILTER_OPTIONS;
  readonly approvalFilterOptions = ATTENDANCE_APPROVAL_FILTER_OPTIONS;
  readonly departmentFilterOptions = DEPARTMENT_FILTER_OPTIONS;
  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly formStatusOptions = ATTENDANCE_FORM_STATUS_OPTIONS;
  readonly projectFormOptions = PROJECT_FORM_OPTIONS;
  readonly exceptionTypeOptions = EXCEPTION_TYPE_OPTIONS;
  readonly employeeOptions = employeeSelectOptions();
  readonly allSites = allSiteFormOptions();

  readonly records = signal<AttendanceRecord[]>([]);
  readonly selectedDate = signal(todayIso());
  readonly statusFilter = signal('all');
  readonly syncFilter = signal<'all' | AttendanceRecord['payrollSyncStatus']>('all');
  readonly approvalFilter = signal<'all' | AttendanceRecord['approvalStatus']>('all');
  readonly departmentFilter = signal('all');
  readonly projectFilter = signal('all');
  readonly exceptionsOnly = signal(false);
  readonly searchText = signal('');

  readonly detailVisible = signal(false);
  readonly detailRecord = signal<AttendanceRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly recordToDelete = signal<AttendanceRecord | null>(null);

  readonly attendanceForm = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    attendanceDate: ['', Validators.required],
    status: ['Present' as AttendanceStatus, Validators.required],
    checkIn: [''],
    checkOut: [''],
    workedHours: [8, [Validators.required, Validators.min(0), Validators.max(24)]],
    projectId: [''],
    siteId: [''],
    allocationPct: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    exceptionType: ['' as AttendanceRecord['exceptionType'] | ''],
    exceptionNotes: ['', Validators.maxLength(500)]
  });

  readonly attendanceRows = computed((): AttendanceRow[] => {
    const date = this.selectedDate();
    const dept = this.departmentFilter();
    const project = this.projectFilter();
    const status = this.statusFilter();
    const sync = this.syncFilter();
    const approval = this.approvalFilter();
    const exceptionsOnly = this.exceptionsOnly();
    const q = this.searchText().trim().toLowerCase();

    return activeEmployees()
      .filter((emp) => {
        if (dept !== 'all' && emp.department !== dept) return false;
        if (project !== 'all' && emp.projectId !== project) return false;
        if (!q) return true;
        const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return name.includes(q) || emp.employeeCode.toLowerCase().includes(q);
      })
      .map((emp) => {
        const record =
          this.records().find((r) => r.employeeId === emp.id && r.attendanceDate === date) ?? null;
        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`.trim(),
          department: emp.department,
          designation: emp.designation,
          record
        };
      })
      .filter((row) => {
        if (status !== 'all') {
          if (!row.record || row.record.status !== status) return false;
        }
        if (sync !== 'all') {
          if (!row.record || row.record.payrollSyncStatus !== sync) return false;
        }
        if (approval !== 'all') {
          if (!row.record || row.record.approvalStatus !== approval) return false;
        }
        if (exceptionsOnly && (!row.record || !row.record.exceptionType)) return false;
        return true;
      });
  });

  readonly markedCount = computed(
    () => this.attendanceRows().filter((r) => r.record !== null).length
  );

  readonly pendingSyncCount = computed(
    () =>
      this.records().filter(
        (r) =>
          r.attendanceDate === this.selectedDate() &&
          r.approvalStatus === 'approved' &&
          r.payrollSyncStatus === 'pending'
      ).length
  );

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Mark attendance' : 'Edit attendance'
  );

  readonly siteFormOptions = computed(() => {
    const projectId = this.attendanceForm.controls.projectId.value;
    const base = [{ label: 'No site', value: '' }];
    if (!projectId) {
      return [...base, ...this.allSites.map((s) => ({ label: s.label, value: s.value }))];
    }
    return [
      ...base,
      ...this.allSites.filter((s) => s.projectId === projectId).map((s) => ({ label: s.label, value: s.value }))
    ];
  });

  ngOnInit(): void {
    console.warn(
      '[HrAttendance] No attendance API in swagger yet — using empty list until backend adds endpoint.'
    );
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    items.push({ label: 'Attendance' });
    return items;
  });

  statusSeverity(status: AttendanceStatus) {
    return attendanceStatusSeverity(status);
  }

  syncSeverity(status: AttendanceRecord['payrollSyncStatus']) {
    return payrollSyncSeverity(status);
  }

  syncLabel(status: AttendanceRecord['payrollSyncStatus']) {
    return payrollSyncLabel(status);
  }

  approvalLabel(status: AttendanceRecord['approvalStatus']) {
    return approvalStatusLabel(status);
  }

  approvalSeverity(status: AttendanceRecord['approvalStatus']) {
    return approvalStatusSeverity(status);
  }

  exceptionLabel(type: AttendanceRecord['exceptionType']) {
    return exceptionTypeLabel(type);
  }

  projectName(id: string | null) {
    return projectLabel(id);
  }

  siteName(id: string | null) {
    return siteLabel(id);
  }

  quickMark(row: AttendanceRow, status: AttendanceStatus): void {
    const emp = activeEmployees().find((e) => e.id === row.employeeId);
    if (!emp) return;

    if (row.record) {
      const updated: AttendanceRecord = {
        ...row.record,
        status,
        checkIn: status === 'Present' || status === 'Half Day' ? row.record.checkIn || '07:30' : '',
        checkOut:
          status === 'Present' ? row.record.checkOut || '16:30' : status === 'Half Day' ? '12:00' : '',
        workedHours: defaultWorkedHours(status),
        payrollSyncStatus: status === 'Holiday' ? 'not_applicable' : 'pending',
        audit: [
          { at: auditTimestamp(), action: `Quick mark: ${status}`, by: 'HR officer' },
          ...row.record.audit
        ]
      };
      this.patchRecord(updated);
      return;
    }

    const created = buildAttendanceFromEmployee(emp, this.selectedDate(), status);
    this.records.update((list) => [...list, created]);
  }

  markAllPresent(): void {
    const date = this.selectedDate();
    const toCreate: AttendanceRecord[] = [];
    for (const row of this.attendanceRows()) {
      if (row.record) continue;
      const emp = activeEmployees().find((e) => e.id === row.employeeId);
      if (emp) toCreate.push(buildAttendanceFromEmployee(emp, date, 'Present'));
    }
    if (toCreate.length) {
      this.records.update((list) => [...list, ...toCreate]);
    }
  }

  openCreateForEmployee(employeeId?: string): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.attendanceForm.reset({
      employeeId: employeeId ?? '',
      attendanceDate: this.selectedDate(),
      status: 'Present',
      checkIn: '07:30',
      checkOut: '16:30',
      workedHours: 8,
      projectId: '',
      siteId: '',
      allocationPct: 100,
      exceptionType: '',
      exceptionNotes: ''
    });
    if (employeeId) {
      const emp = activeEmployees().find((e) => e.id === employeeId);
      if (emp) {
        this.attendanceForm.patchValue({
          projectId: emp.projectId ?? '',
          siteId: emp.siteId ?? ''
        });
      }
    }
    this.formVisible.set(true);
  }

  openEdit(record: AttendanceRecord): void {
    this.formMode.set('edit');
    this.editingId.set(record.id);
    this.formError.set(null);
    this.attendanceForm.patchValue({
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workedHours: record.workedHours,
      projectId: record.projectId ?? '',
      siteId: record.siteId ?? '',
      allocationPct: record.allocationPct,
      exceptionType: record.exceptionType ?? '',
      exceptionNotes: record.exceptionNotes
    });
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  onStatusChange(status: AttendanceStatus): void {
    this.attendanceForm.patchValue({ workedHours: defaultWorkedHours(status) });
  }

  saveAttendance(): void {
    this.attendanceForm.markAllAsTouched();
    if (this.attendanceForm.invalid) {
      this.formError.set('Fix the highlighted fields before saving.');
      return;
    }

    const raw = this.attendanceForm.getRawValue();
    const emp = activeEmployees().find((e) => e.id === raw.employeeId);
    if (!emp) {
      this.formError.set('Select a valid employee.');
      return;
    }

    const payload = this.normalizePayload(raw, emp);

    if (this.formMode() === 'create') {
      const duplicate = this.records().some(
        (r) => r.employeeId === payload.employeeId && r.attendanceDate === payload.attendanceDate
      );
      if (duplicate) {
        this.formError.set('Attendance already exists for this employee on this date.');
        return;
      }
      const created: AttendanceRecord = {
        ...payload,
        id: newAttendanceId(),
        payrollSyncStatus: payload.status === 'Holiday' ? 'not_applicable' : 'pending',
        payrollSyncAt: '',
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Attendance record created', by: 'HR officer' }],
        attachments: []
      };
      this.records.update((list) => [...list, created]);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    const existing = this.records().find((r) => r.id === id);
    if (!existing) return;

    this.patchRecord({
      ...existing,
      ...payload,
      payrollSyncStatus:
        existing.payrollSyncStatus === 'synced' ? 'synced' : payload.status === 'Holiday' ? 'not_applicable' : 'pending',
      audit: [{ at: auditTimestamp(), action: 'Attendance updated', by: 'HR officer' }, ...existing.audit]
    });
    this.formVisible.set(false);
  }

  openDetail(record: AttendanceRecord): void {
    this.detailRecord.set(record);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  editFromDetail(): void {
    const r = this.detailRecord();
    if (!r) return;
    this.detailVisible.set(false);
    this.openEdit(r);
  }

  requestDelete(record: AttendanceRecord): void {
    this.recordToDelete.set(record);
    this.deleteConfirmVisible.set(true);
  }

  confirmDelete(): void {
    const target = this.recordToDelete();
    if (!target) return;
    this.records.update((list) => list.filter((r) => r.id !== target.id));
    if (this.detailRecord()?.id === target.id) {
      this.detailVisible.set(false);
      this.detailRecord.set(null);
    }
    this.recordToDelete.set(null);
    this.deleteConfirmVisible.set(false);
  }

  submitForApproval(record: AttendanceRecord): void {
    if (!canSubmitForApproval(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for approval', by: 'HR officer' }, ...record.audit]
    });
  }

  approveRecord(record: AttendanceRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Attendance approved', by: 'HR manager' }, ...record.audit]
    });
  }

  rejectRecord(record: AttendanceRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'rejected',
      audit: [{ at: auditTimestamp(), action: 'Attendance rejected', by: 'HR manager' }, ...record.audit]
    });
  }

  syncToPayroll(record: AttendanceRecord): void {
    if (!canSyncToPayroll(record)) return;
    this.patchRecord({
      ...record,
      payrollSyncStatus: 'synced',
      payrollSyncAt: auditTimestamp(),
      audit: [{ at: auditTimestamp(), action: 'Synced to payroll', by: 'Payroll system' }, ...record.audit]
    });
  }

  syncAllApproved(): void {
    const date = this.selectedDate();
    const toSync = this.records().filter(
      (r) => r.attendanceDate === date && canSyncToPayroll(r)
    );
    for (const r of toSync) {
      this.syncToPayroll(r);
    }
  }

  mockAddAttachment(record: AttendanceRecord): void {
    const att = {
      id: newAttachmentId(),
      name: `Timesheet-${record.attendanceDate}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRecord({
      ...record,
      attachments: [att, ...record.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment: ${att.name}`, by: 'HR officer' }, ...record.audit]
    });
  }

  exportCsv(): void {
    const rows = this.attendanceRows().filter((r) => r.record);
    const header = [
      'date',
      'employeeCode',
      'employeeName',
      'department',
      'status',
      'checkIn',
      'checkOut',
      'workedHours',
      'projectId',
      'allocationPct',
      'exceptionType',
      'payrollSyncStatus',
      'approvalStatus'
    ];
    const lines = [
      header.join(','),
      ...rows.map((row) => {
        const r = row.record!;
        return [
          r.attendanceDate,
          r.employeeCode,
          `"${r.employeeName.replace(/"/g, '""')}"`,
          r.department,
          r.status,
          r.checkIn,
          r.checkOut,
          r.workedHours,
          r.projectId ?? '',
          r.allocationPct,
          r.exceptionType ?? '',
          r.payrollSyncStatus,
          r.approvalStatus
        ].join(',');
      })
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${this.selectedDate()}.csv`;
    a.click();
  }

  canSubmit(r: AttendanceRecord) {
    return canSubmitForApproval(r);
  }

  canApprove(r: AttendanceRecord) {
    return canApproveOrReject(r);
  }

  canSync(r: AttendanceRecord) {
    return canSyncToPayroll(r);
  }

  private normalizePayload(
    raw: ReturnType<typeof this.attendanceForm.getRawValue>,
    emp: ReturnType<typeof activeEmployees>[number]
  ): AttendanceFormValue & {
    employeeCode: string;
    employeeName: string;
    department: string;
    designation: string;
  } {
    return {
      employeeId: raw.employeeId,
      employeeCode: emp.employeeCode,
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      department: emp.department,
      designation: emp.designation,
      attendanceDate: raw.attendanceDate,
      status: raw.status,
      checkIn: raw.checkIn.trim(),
      checkOut: raw.checkOut.trim(),
      workedHours: raw.workedHours,
      projectId: raw.projectId || null,
      siteId: raw.siteId || null,
      allocationPct: raw.allocationPct,
      exceptionType: (raw.exceptionType || null) as AttendanceRecord['exceptionType'],
      exceptionNotes: raw.exceptionNotes.trim()
    };
  }

  private patchRecord(updated: AttendanceRecord): void {
    this.records.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRecord()?.id === updated.id) {
      this.detailRecord.set(updated);
    }
  }
}
