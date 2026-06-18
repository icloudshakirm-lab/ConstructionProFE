import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import { EmployeesApiService } from '../../../core/api/project-planning';
import {
  CURRENCY_OPTIONS,
  DEPARTMENT_FORM_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMPLOYEE_APPROVAL_FILTER_OPTIONS,
  EMPLOYEE_FORM_STATUS_OPTIONS,
  EMPLOYEE_PROJECT_FILTER_OPTIONS,
  EMPLOYEE_PROJECT_FORM_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  GOVERNMENT_ID_TYPE_OPTIONS,
  GRADE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  allSiteOptions,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  employeeFullName,
  employeeStatusSeverity,
  formatSalary,
  governmentIdTypeLabel,
  initialEmployeeRecords,
  newAttachmentId,
  newEducationId,
  newEmployeeId,
  newWorkHistoryId,
  projectNameForId,
  siteNameForId,
  type EducationRecord,
  type EmployeeFormValue,
  type EmployeeRecord,
  type WorkHistoryRecord
} from './employee-records.data';

type ChildKind = 'education' | 'workHistory';

@Component({
  selector: 'app-employee-records',
  imports: [
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
  templateUrl: './employee-records.component.html',
  styleUrl: './employee-records.component.scss'
})
export class EmployeeRecordsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly employeesApi = inject(EmployeesApiService);

  readonly statusFilterOptions = EMPLOYEE_STATUS_OPTIONS;
  readonly approvalFilterOptions = EMPLOYEE_APPROVAL_FILTER_OPTIONS;
  readonly departmentFilterOptions = DEPARTMENT_OPTIONS;
  readonly projectFilterOptions = EMPLOYEE_PROJECT_FILTER_OPTIONS;
  readonly formStatusOptions = EMPLOYEE_FORM_STATUS_OPTIONS;
  readonly departmentFormOptions = DEPARTMENT_FORM_OPTIONS;
  readonly projectFormOptions = EMPLOYEE_PROJECT_FORM_OPTIONS;
  readonly gradeOptions = GRADE_OPTIONS;
  readonly employmentTypeOptions = EMPLOYMENT_TYPE_OPTIONS;
  readonly genderOptions = GENDER_OPTIONS;
  readonly maritalStatusOptions = MARITAL_STATUS_OPTIONS;
  readonly governmentIdTypeOptions = GOVERNMENT_ID_TYPE_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly allSites = allSiteOptions();

  readonly employees = signal<EmployeeRecord[]>([]);

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | EmployeeRecord['approvalStatus']>('all');
  readonly departmentFilter = signal('all');
  readonly projectFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.employees()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailEmployee = signal<EmployeeRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly employeeToDelete = signal<EmployeeRecord | null>(null);

  readonly childFormVisible = signal(false);
  readonly childFormMode = signal<'create' | 'edit'>('create');
  readonly childFormKind = signal<ChildKind>('education');
  readonly childEditingId = signal<string | null>(null);
  readonly childFormError = signal<string | null>(null);

  readonly employeeForm = this.fb.nonNullable.group({
    employeeCode: ['', [Validators.required, Validators.maxLength(24)]],
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    middleName: ['', Validators.maxLength(60)],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    dateOfBirth: ['', Validators.required],
    gender: ['Male' as EmployeeRecord['gender'], Validators.required],
    nationality: ['', [Validators.required, Validators.maxLength(60)]],
    maritalStatus: ['Single' as EmployeeRecord['maritalStatus'], Validators.required],
    personalEmail: ['', [Validators.email, Validators.maxLength(120)]],
    personalPhone: ['', [Validators.required, Validators.maxLength(24)]],
    emergencyContactName: ['', Validators.maxLength(80)],
    emergencyContactPhone: ['', Validators.maxLength(24)],
    emergencyContactRelation: ['', Validators.maxLength(40)],
    governmentIdType: ['national_id' as EmployeeRecord['governmentIdType'], Validators.required],
    governmentIdNumber: ['', [Validators.required, Validators.maxLength(40)]],
    workEmail: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    workPhone: ['', Validators.maxLength(24)],
    designation: ['', [Validators.required, Validators.maxLength(80)]],
    department: ['', Validators.required],
    grade: ['G4', Validators.required],
    employmentType: ['Full-time' as EmployeeRecord['employmentType'], Validators.required],
    joinDate: ['', Validators.required],
    confirmationDate: [''],
    terminationDate: [''],
    reportingManager: ['', Validators.maxLength(80)],
    status: ['Active' as EmployeeRecord['status'], Validators.required],
    projectId: [''],
    siteId: [''],
    basicSalary: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED', Validators.required],
    bankName: ['', Validators.maxLength(80)],
    bankAccountNumber: ['', Validators.maxLength(40)],
    iban: ['', Validators.maxLength(34)],
    presentAddress: ['', Validators.maxLength(200)],
    permanentAddress: ['', Validators.maxLength(200)],
    city: ['', Validators.maxLength(60)],
    country: ['', Validators.maxLength(60)]
  });

  readonly educationForm = this.fb.nonNullable.group({
    institution: ['', [Validators.required, Validators.maxLength(120)]],
    qualification: ['', [Validators.required, Validators.maxLength(80)]],
    fieldOfStudy: ['', Validators.maxLength(80)],
    startYear: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(2100)]],
    endYear: [null as number | null],
    gradeOrGpa: ['', Validators.maxLength(40)],
    verified: [false]
  });

  readonly workHistoryForm = this.fb.nonNullable.group({
    employer: ['', [Validators.required, Validators.maxLength(120)]],
    jobTitle: ['', [Validators.required, Validators.maxLength(80)]],
    startDate: ['', Validators.required],
    endDate: [''],
    location: ['', Validators.maxLength(80)],
    reasonForLeaving: ['', Validators.maxLength(120)],
    notes: ['', Validators.maxLength(500)]
  });

  readonly filteredEmployees = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const dept = this.departmentFilter();
    const project = this.projectFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.employees()
      .filter((e) => {
        if (status !== 'all' && e.status !== status) return false;
        if (approval !== 'all' && e.approvalStatus !== approval) return false;
        if (dept !== 'all' && e.department !== dept) return false;
        if (project !== 'all' && e.projectId !== project) return false;
        if (!q) return true;
        const name = employeeFullName(e).toLowerCase();
        return (
          name.includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.governmentIdNumber.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => employeeFullName(a).localeCompare(employeeFullName(b)));
  });

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Add employee' : 'Edit employee'
  );

  readonly childFormHeader = computed(() => {
    const kind = this.childFormKind() === 'education' ? 'Education' : 'Work history';
    return this.childFormMode() === 'create' ? `Add ${kind.toLowerCase()}` : `Edit ${kind.toLowerCase()}`;
  });

  readonly siteFormOptions = computed(() => {
    const projectId = this.employeeForm.controls.projectId.value;
    if (!projectId) {
      return [{ label: 'No site', value: '' }, ...this.allSites.map((s) => ({ label: s.label, value: s.value }))];
    }
    const filtered = this.allSites.filter((s) => s.projectId === projectId);
    return [{ label: 'No site', value: '' }, ...filtered.map((s) => ({ label: s.label, value: s.value }))];
  });

  ngOnInit(): void {
    this.employeesApi.list().subscribe({
      next: (data) => console.log('[EmployeeRecords] GET /employees', data),
      error: (err) => console.error('[EmployeeRecords] GET /employees failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Employee Records' });
    return items;
  });

  fullName(e: EmployeeRecord): string {
    return employeeFullName(e);
  }

  statusSeverity(status: EmployeeRecord['status']) {
    return employeeStatusSeverity(status);
  }

  approvalSeverity(status: EmployeeRecord['approvalStatus']) {
    return approvalStatusSeverity(status);
  }

  approvalLabel(status: EmployeeRecord['approvalStatus']) {
    return approvalStatusLabel(status);
  }

  govIdLabel(type: EmployeeRecord['governmentIdType']) {
    return governmentIdTypeLabel(type);
  }

  projectLabel(id: string | null) {
    return projectNameForId(id);
  }

  siteLabel(id: string | null) {
    return siteNameForId(id);
  }

  salaryDisplay(e: EmployeeRecord) {
    return formatSalary(e.basicSalary, e.currency);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.employeeForm.reset({
      employeeCode: `EMP-${Date.now().toString().slice(-4)}`,
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      nationality: 'UAE',
      maritalStatus: 'Single',
      personalEmail: '',
      personalPhone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      governmentIdType: 'national_id',
      governmentIdNumber: '',
      workEmail: '',
      workPhone: '',
      designation: '',
      department: 'Operations',
      grade: 'G4',
      employmentType: 'Full-time',
      joinDate: '',
      confirmationDate: '',
      terminationDate: '',
      reportingManager: '',
      status: 'Active',
      projectId: '',
      siteId: '',
      basicSalary: 0,
      currency: 'AED',
      bankName: '',
      bankAccountNumber: '',
      iban: '',
      presentAddress: '',
      permanentAddress: '',
      city: '',
      country: 'United Arab Emirates'
    });
    this.formVisible.set(true);
  }

  openEdit(employee: EmployeeRecord): void {
    this.formMode.set('edit');
    this.editingId.set(employee.id);
    this.formError.set(null);
    this.employeeForm.patchValue({
      ...employee,
      projectId: employee.projectId ?? '',
      siteId: employee.siteId ?? ''
    });
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  saveEmployee(): void {
    this.employeeForm.markAllAsTouched();
    if (this.employeeForm.invalid) {
      this.formError.set('Fix the highlighted fields before saving.');
      return;
    }

    const raw = this.employeeForm.getRawValue();
    const payload = this.normalizeFormPayload(raw);

    if (this.formMode() === 'create') {
      const created: EmployeeRecord = {
        id: newEmployeeId(),
        ...payload,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Employee record created', by: 'HR admin' }],
        attachments: [],
        education: [],
        workHistory: []
      };
      this.employees.update((list) => [...list, created]);
      this.selectedId.set(created.id);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    if (!id) return;
    const existing = this.employees().find((e) => e.id === id);
    if (!existing) return;

    this.patchEmployee({
      ...existing,
      ...payload,
      audit: [{ at: auditTimestamp(), action: 'Employee record updated', by: 'HR admin' }, ...existing.audit]
    });
    this.formVisible.set(false);
  }

  openDetail(employee: EmployeeRecord): void {
    this.detailEmployee.set(employee);
    this.selectedId.set(employee.id);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  editFromDetail(): void {
    const e = this.detailEmployee();
    if (!e) return;
    this.detailVisible.set(false);
    this.openEdit(e);
  }

  requestDelete(employee: EmployeeRecord): void {
    this.employeeToDelete.set(employee);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.employeeToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.employeeToDelete();
    if (!target) return;
    const next = this.employees().filter((e) => e.id !== target.id);
    this.employees.set(next);
    if (this.selectedId() === target.id) {
      this.selectedId.set(next[0]?.id ?? null);
    }
    if (this.detailEmployee()?.id === target.id) {
      this.detailVisible.set(false);
      this.detailEmployee.set(null);
    }
    this.cancelDelete();
  }

  submitForApproval(employee: EmployeeRecord): void {
    if (!canSubmitForApproval(employee)) return;
    this.patchEmployee({
      ...employee,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for HR approval', by: 'HR officer' }, ...employee.audit]
    });
  }

  approveEmployee(employee: EmployeeRecord): void {
    if (!canApproveOrReject(employee)) return;
    this.patchEmployee({
      ...employee,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Employee record approved', by: 'HR manager' }, ...employee.audit]
    });
  }

  rejectEmployee(employee: EmployeeRecord): void {
    if (!canApproveOrReject(employee)) return;
    this.patchEmployee({
      ...employee,
      approvalStatus: 'rejected',
      audit: [
        { at: auditTimestamp(), action: 'Approval rejected — verify government ID and documents', by: 'HR manager' },
        ...employee.audit
      ]
    });
  }

  canSubmit(e: EmployeeRecord): boolean {
    return canSubmitForApproval(e);
  }

  canApprove(e: EmployeeRecord): boolean {
    return canApproveOrReject(e);
  }

  mockAddAttachment(employee: EmployeeRecord): void {
    const attachment = {
      id: newAttachmentId(),
      name: `Document-${Date.now().toString(36).slice(-4)}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchEmployee({
      ...employee,
      attachments: [attachment, ...employee.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${attachment.name}`, by: 'HR admin' }, ...employee.audit]
    });
  }

  openAddEducation(): void {
    this.childFormKind.set('education');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.educationForm.reset({
      institution: '',
      qualification: '',
      fieldOfStudy: '',
      startYear: new Date().getFullYear(),
      endYear: null,
      gradeOrGpa: '',
      verified: false
    });
    this.childFormVisible.set(true);
  }

  openEditEducation(row: EducationRecord): void {
    this.childFormKind.set('education');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.educationForm.patchValue(row);
    this.childFormVisible.set(true);
  }

  openAddWorkHistory(): void {
    this.childFormKind.set('workHistory');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.workHistoryForm.reset({
      employer: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      location: '',
      reasonForLeaving: '',
      notes: ''
    });
    this.childFormVisible.set(true);
  }

  openEditWorkHistory(row: WorkHistoryRecord): void {
    this.childFormKind.set('workHistory');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.workHistoryForm.patchValue({ ...row, endDate: row.endDate ?? '' });
    this.childFormVisible.set(true);
  }

  closeChildForm(): void {
    this.childFormVisible.set(false);
    this.childFormError.set(null);
  }

  saveChildRecord(): void {
    const employee = this.detailEmployee();
    if (!employee) return;

    if (this.childFormKind() === 'education') {
      this.saveEducation(employee);
    } else {
      this.saveWorkHistory(employee);
    }
  }

  deleteEducation(row: EducationRecord): void {
    const employee = this.detailEmployee();
    if (!employee) return;
    this.patchEmployee({
      ...employee,
      education: employee.education.filter((e) => e.id !== row.id),
      audit: [{ at: auditTimestamp(), action: `Education removed: ${row.qualification}`, by: 'HR admin' }, ...employee.audit]
    });
  }

  deleteWorkHistory(row: WorkHistoryRecord): void {
    const employee = this.detailEmployee();
    if (!employee) return;
    this.patchEmployee({
      ...employee,
      workHistory: employee.workHistory.filter((w) => w.id !== row.id),
      audit: [
        { at: auditTimestamp(), action: `Work history removed: ${row.employer}`, by: 'HR admin' },
        ...employee.audit
      ]
    });
  }

  exportCsv(): void {
    const rows = this.filteredEmployees();
    const header = [
      'id',
      'employeeCode',
      'fullName',
      'designation',
      'department',
      'grade',
      'status',
      'approvalStatus',
      'governmentIdType',
      'governmentIdNumber',
      'joinDate',
      'projectId',
      'siteId',
      'basicSalary',
      'currency'
    ];
    const lines = [
      header.join(','),
      ...rows.map((e) =>
        [
          e.id,
          e.employeeCode,
          `"${employeeFullName(e).replace(/"/g, '""')}"`,
          `"${e.designation.replace(/"/g, '""')}"`,
          e.department,
          e.grade,
          e.status,
          e.approvalStatus,
          e.governmentIdType,
          `"${e.governmentIdNumber.replace(/"/g, '""')}"`,
          e.joinDate,
          e.projectId ?? '',
          e.siteId ?? '',
          e.basicSalary,
          e.currency
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-records-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  fieldInvalid(name: keyof EmployeeFormValue): boolean {
    const c = this.employeeForm.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  private saveEducation(employee: EmployeeRecord): void {
    this.educationForm.markAllAsTouched();
    if (this.educationForm.invalid) {
      this.childFormError.set('Complete required education fields.');
      return;
    }
    const raw = this.educationForm.getRawValue();
    const record: EducationRecord = {
      id: this.childFormMode() === 'create' ? newEducationId() : this.childEditingId()!,
      institution: raw.institution.trim(),
      qualification: raw.qualification.trim(),
      fieldOfStudy: raw.fieldOfStudy.trim(),
      startYear: raw.startYear,
      endYear: raw.endYear,
      gradeOrGpa: raw.gradeOrGpa.trim(),
      verified: raw.verified
    };

    const education =
      this.childFormMode() === 'create'
        ? [...employee.education, record]
        : employee.education.map((e) => (e.id === record.id ? record : e));

    this.patchEmployee({
      ...employee,
      education,
      audit: [
        {
          at: auditTimestamp(),
          action:
            this.childFormMode() === 'create'
              ? `Education added: ${record.qualification}`
              : `Education updated: ${record.qualification}`,
          by: 'HR admin'
        },
        ...employee.audit
      ]
    });
    this.childFormVisible.set(false);
  }

  private saveWorkHistory(employee: EmployeeRecord): void {
    this.workHistoryForm.markAllAsTouched();
    if (this.workHistoryForm.invalid) {
      this.childFormError.set('Complete required work history fields.');
      return;
    }
    const raw = this.workHistoryForm.getRawValue();
    if (raw.endDate && raw.endDate < raw.startDate) {
      this.childFormError.set('End date must be on or after start date.');
      return;
    }

    const record: WorkHistoryRecord = {
      id: this.childFormMode() === 'create' ? newWorkHistoryId() : this.childEditingId()!,
      employer: raw.employer.trim(),
      jobTitle: raw.jobTitle.trim(),
      startDate: raw.startDate,
      endDate: raw.endDate || null,
      location: raw.location.trim(),
      reasonForLeaving: raw.reasonForLeaving.trim(),
      notes: raw.notes.trim()
    };

    const workHistory =
      this.childFormMode() === 'create'
        ? [...employee.workHistory, record]
        : employee.workHistory.map((w) => (w.id === record.id ? record : w));

    this.patchEmployee({
      ...employee,
      workHistory,
      audit: [
        {
          at: auditTimestamp(),
          action:
            this.childFormMode() === 'create'
              ? `Work history added: ${record.employer}`
              : `Work history updated: ${record.employer}`,
          by: 'HR admin'
        },
        ...employee.audit
      ]
    });
    this.childFormVisible.set(false);
  }

  private normalizeFormPayload(raw: ReturnType<typeof this.employeeForm.getRawValue>): EmployeeFormValue {
    return {
      employeeCode: raw.employeeCode.trim(),
      firstName: raw.firstName.trim(),
      middleName: raw.middleName.trim(),
      lastName: raw.lastName.trim(),
      dateOfBirth: raw.dateOfBirth,
      gender: raw.gender,
      nationality: raw.nationality.trim(),
      maritalStatus: raw.maritalStatus,
      personalEmail: raw.personalEmail.trim(),
      personalPhone: raw.personalPhone.trim(),
      emergencyContactName: raw.emergencyContactName.trim(),
      emergencyContactPhone: raw.emergencyContactPhone.trim(),
      emergencyContactRelation: raw.emergencyContactRelation.trim(),
      governmentIdType: raw.governmentIdType,
      governmentIdNumber: raw.governmentIdNumber.trim(),
      workEmail: raw.workEmail.trim(),
      workPhone: raw.workPhone.trim(),
      designation: raw.designation.trim(),
      department: raw.department,
      grade: raw.grade,
      employmentType: raw.employmentType,
      joinDate: raw.joinDate,
      confirmationDate: raw.confirmationDate,
      terminationDate: raw.terminationDate,
      reportingManager: raw.reportingManager.trim(),
      status: raw.status,
      projectId: raw.projectId || null,
      siteId: raw.siteId || null,
      basicSalary: raw.basicSalary,
      currency: raw.currency,
      bankName: raw.bankName.trim(),
      bankAccountNumber: raw.bankAccountNumber.trim(),
      iban: raw.iban.trim(),
      presentAddress: raw.presentAddress.trim(),
      permanentAddress: raw.permanentAddress.trim(),
      city: raw.city.trim(),
      country: raw.country.trim()
    };
  }

  private patchEmployee(updated: EmployeeRecord): void {
    this.employees.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    if (this.detailEmployee()?.id === updated.id) {
      this.detailEmployee.set(updated);
    }
  }
}
