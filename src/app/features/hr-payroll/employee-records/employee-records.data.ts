import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import { SITE_EMPLOYEES } from '../../site-mobile/site-mobile-employees.data';

export type EmployeeStatus = 'Active' | 'On Leave' | 'Probation' | 'Terminated';
export type EmployeeApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Temporary';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type GovernmentIdType = 'national_id' | 'passport' | 'social_security';

export interface EmployeeAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface EmployeeAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface EducationRecord {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  gradeOrGpa: string;
  verified: boolean;
}

export interface WorkHistoryRecord {
  id: string;
  employer: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  location: string;
  reasonForLeaving: string;
  notes: string;
}

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  maritalStatus: MaritalStatus;
  personalEmail: string;
  personalPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  governmentIdType: GovernmentIdType;
  governmentIdNumber: string;
  workEmail: string;
  workPhone: string;
  designation: string;
  department: string;
  grade: string;
  employmentType: EmploymentType;
  joinDate: string;
  confirmationDate: string;
  terminationDate: string;
  reportingManager: string;
  status: EmployeeStatus;
  projectId: string | null;
  siteId: string | null;
  basicSalary: number;
  currency: string;
  bankName: string;
  bankAccountNumber: string;
  iban: string;
  presentAddress: string;
  permanentAddress: string;
  city: string;
  country: string;
  approvalStatus: EmployeeApprovalStatus;
  audit: EmployeeAuditEntry[];
  attachments: EmployeeAttachment[];
  education: EducationRecord[];
  workHistory: WorkHistoryRecord[];
}

export type EmployeeFormValue = Pick<
  EmployeeRecord,
  | 'employeeCode'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'dateOfBirth'
  | 'gender'
  | 'nationality'
  | 'maritalStatus'
  | 'personalEmail'
  | 'personalPhone'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelation'
  | 'governmentIdType'
  | 'governmentIdNumber'
  | 'workEmail'
  | 'workPhone'
  | 'designation'
  | 'department'
  | 'grade'
  | 'employmentType'
  | 'joinDate'
  | 'confirmationDate'
  | 'terminationDate'
  | 'reportingManager'
  | 'status'
  | 'projectId'
  | 'siteId'
  | 'basicSalary'
  | 'currency'
  | 'bankName'
  | 'bankAccountNumber'
  | 'iban'
  | 'presentAddress'
  | 'permanentAddress'
  | 'city'
  | 'country'
>;

export const EMPLOYEE_STATUS_OPTIONS: { label: string; value: EmployeeStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Probation', value: 'Probation' },
  { label: 'On Leave', value: 'On Leave' },
  { label: 'Terminated', value: 'Terminated' }
];

export const EMPLOYEE_FORM_STATUS_OPTIONS = EMPLOYEE_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const EMPLOYEE_APPROVAL_FILTER_OPTIONS: { label: string; value: EmployeeApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const DEPARTMENT_OPTIONS = [
  { label: 'All departments', value: 'all' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Fleet', value: 'Fleet' },
  { label: 'HSE', value: 'HSE' },
  { label: 'Finance', value: 'Finance' },
  { label: 'HR', value: 'HR' },
  { label: 'Administration', value: 'Administration' }
];

export const DEPARTMENT_FORM_OPTIONS = DEPARTMENT_OPTIONS.filter((o) => o.value !== 'all');

export const GRADE_OPTIONS = [
  { label: 'G1 — Entry', value: 'G1' },
  { label: 'G2', value: 'G2' },
  { label: 'G3', value: 'G3' },
  { label: 'G4 — Mid', value: 'G4' },
  { label: 'G5', value: 'G5' },
  { label: 'G6 — Senior', value: 'G6' },
  { label: 'G7 — Lead', value: 'G7' },
  { label: 'G8 — Manager', value: 'G8' }
];

export const EMPLOYMENT_TYPE_OPTIONS: { label: string; value: EmploymentType }[] = [
  { label: 'Full-time', value: 'Full-time' },
  { label: 'Part-time', value: 'Part-time' },
  { label: 'Contract', value: 'Contract' },
  { label: 'Temporary', value: 'Temporary' }
];

export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Prefer not to say' }
];

export const MARITAL_STATUS_OPTIONS: { label: string; value: MaritalStatus }[] = [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
  { label: 'Widowed', value: 'Widowed' }
];

export const GOVERNMENT_ID_TYPE_OPTIONS: { label: string; value: GovernmentIdType }[] = [
  { label: 'National ID / Emirates ID', value: 'national_id' },
  { label: 'Passport', value: 'passport' },
  { label: 'Social Security / Tax ID', value: 'social_security' }
];

export const CURRENCY_OPTIONS = [
  { label: 'AED', value: 'AED' },
  { label: 'USD', value: 'USD' },
  { label: 'SAR', value: 'SAR' }
];

export const EMPLOYEE_PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const EMPLOYEE_PROJECT_FORM_OPTIONS = EMPLOYEE_PROJECT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export interface SiteOption {
  label: string;
  value: string;
  projectId: string;
}

export function allSiteOptions(): SiteOption[] {
  return DEMO_PROJECTS.flatMap((p) =>
    p.sites.map((s) => ({
      label: `${s.name} — ${p.name}`,
      value: s.id,
      projectId: p.id
    }))
  );
}

export function projectNameForId(projectId: string | null): string {
  if (!projectId) return '—';
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function siteNameForId(siteId: string | null): string {
  if (!siteId) return '—';
  for (const p of DEMO_PROJECTS) {
    const site = p.sites.find((s) => s.id === siteId);
    if (site) return site.name;
  }
  return siteId;
}

export function employeeFullName(e: Pick<EmployeeRecord, 'firstName' | 'middleName' | 'lastName'>): string {
  return [e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ');
}

export function governmentIdTypeLabel(type: GovernmentIdType): string {
  return GOVERNMENT_ID_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function newEmployeeId(): string {
  return `emp-${Date.now().toString(36).slice(-6)}`;
}

export function newEducationId(): string {
  return `edu-${Date.now().toString(36).slice(-6)}`;
}

export function newWorkHistoryId(): string {
  return `wh-${Date.now().toString(36).slice(-6)}`;
}

export function newAttachmentId(): string {
  return `att-${Date.now().toString(36).slice(-6)}`;
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

export function employeeStatusSeverity(
  status: EmployeeStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Probation':
      return 'info';
    case 'On Leave':
      return 'warn';
    case 'Terminated':
      return 'danger';
  }
}

export function approvalStatusSeverity(
  status: EmployeeApprovalStatus
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

export function approvalStatusLabel(status: EmployeeApprovalStatus): string {
  const labels: Record<EmployeeApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function canSubmitForApproval(e: EmployeeRecord): boolean {
  return e.approvalStatus === 'draft' || e.approvalStatus === 'rejected';
}

export function canApproveOrReject(e: EmployeeRecord): boolean {
  return e.approvalStatus === 'pending_approval';
}

export function formatSalary(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function splitName(fullName: string): { firstName: string; middleName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
}

function seedFromSiteEmployee(
  siteEmp: (typeof SITE_EMPLOYEES)[number],
  extra: Partial<EmployeeRecord>
): EmployeeRecord {
  const names = splitName(siteEmp.fullName);
  return {
    id: siteEmp.id,
    employeeCode: siteEmp.employeeCode,
    firstName: names.firstName,
    middleName: names.middleName,
    lastName: names.lastName,
    dateOfBirth: '1990-01-15',
    gender: 'Male',
    nationality: 'UAE',
    maritalStatus: 'Married',
    personalEmail: `${names.firstName.toLowerCase()}@personal.example`,
    personalPhone: '+971 50 000 0000',
    emergencyContactName: 'Emergency contact',
    emergencyContactPhone: '+971 50 111 1111',
    emergencyContactRelation: 'Spouse',
    governmentIdType: 'national_id',
    governmentIdNumber: '784-1990-0000000-0',
    workEmail: `${names.firstName.toLowerCase()}@constructpro.example`,
    workPhone: '+971 4 000 0000',
    designation: siteEmp.designation,
    department: siteEmp.designation === 'Driver' || siteEmp.designation === 'Operator' ? 'Fleet' : 'Operations',
    grade: 'G4',
    employmentType: 'Full-time',
    joinDate: '2024-03-01',
    confirmationDate: '2024-09-01',
    terminationDate: '',
    reportingManager: 'Site superintendent',
    status: siteEmp.active ? 'Active' : 'Terminated',
    projectId: siteEmp.projectId ?? null,
    siteId: null,
    basicSalary: 8500,
    currency: 'AED',
    bankName: 'Emirates NBD',
    bankAccountNumber: '****4521',
    iban: 'AE070331234567890123456',
    presentAddress: 'Dubai, UAE',
    permanentAddress: 'Dubai, UAE',
    city: 'Dubai',
    country: 'United Arab Emirates',
    approvalStatus: 'approved',
    audit: [{ at: auditTimestamp(), action: 'Employee record loaded from HR master', by: 'System' }],
    attachments: [],
    education: [],
    workHistory: [],
    ...extra
  };
}

export function initialEmployeeRecords(): EmployeeRecord[] {
  const enriched: Record<string, Partial<EmployeeRecord>> = {
    'emp-101': {
      governmentIdType: 'national_id',
      governmentIdNumber: '784-1988-7123456-1',
      grade: 'G3',
      siteId: 'S-002',
      education: [
        {
          id: 'edu-101-1',
          institution: 'Emirates Driving Institute',
          qualification: 'Heavy vehicle licence',
          fieldOfStudy: 'Transport operations',
          startYear: 2018,
          endYear: 2018,
          gradeOrGpa: 'Pass',
          verified: true
        }
      ],
      workHistory: [
        {
          id: 'wh-101-1',
          employer: 'Gulf Logistics',
          jobTitle: 'Heavy truck driver',
          startDate: '2019-01-01',
          endDate: '2023-12-31',
          location: 'Dubai',
          reasonForLeaving: 'Career progression',
          notes: '5 years accident-free record'
        }
      ],
      attachments: [
        { id: 'att-101-1', name: 'Emirates ID copy.pdf', type: 'PDF', uploadedAt: '2024-02-15' },
        { id: 'att-101-2', name: 'Driving licence.pdf', type: 'PDF', uploadedAt: '2024-02-15' }
      ]
    },
    'emp-102': {
      governmentIdType: 'passport',
      governmentIdNumber: 'P12345678',
      nationality: 'British',
      department: 'Fleet',
      grade: 'G5',
      projectId: 'P-001',
      siteId: 'S-001',
      education: [
        {
          id: 'edu-102-1',
          institution: 'City & Guilds',
          qualification: 'NVQ Level 3',
          fieldOfStudy: 'Plant operations',
          startYear: 2015,
          endYear: 2016,
          gradeOrGpa: 'Merit',
          verified: true
        }
      ],
      workHistory: [
        {
          id: 'wh-102-1',
          employer: 'Balfour Beatty',
          jobTitle: 'Site plant operator',
          startDate: '2017-06-01',
          endDate: '2024-02-28',
          location: 'Abu Dhabi',
          reasonForLeaving: 'Relocation',
          notes: ''
        }
      ]
    },
    'emp-107': {
      governmentIdType: 'social_security',
      governmentIdNumber: 'SSN-884-22-1093',
      nationality: 'Egyptian',
      designation: 'Operator',
      department: 'Operations',
      grade: 'G6',
      projectId: 'P-001',
      siteId: 'S-002',
      approvalStatus: 'pending_approval',
      education: [
        {
          id: 'edu-107-1',
          institution: 'Cairo University',
          qualification: 'B.Sc. Civil Engineering',
          fieldOfStudy: 'Structural engineering',
          startYear: 2008,
          endYear: 2012,
          gradeOrGpa: '3.4 GPA',
          verified: true
        },
        {
          id: 'edu-107-2',
          institution: 'PMI',
          qualification: 'CAPM',
          fieldOfStudy: 'Project management',
          startYear: 2020,
          endYear: 2020,
          gradeOrGpa: 'Certified',
          verified: false
        }
      ],
      workHistory: [
        {
          id: 'wh-107-1',
          employer: 'Orascom Construction',
          jobTitle: 'Site engineer',
          startDate: '2013-03-01',
          endDate: '2019-08-31',
          location: 'Cairo',
          reasonForLeaving: 'International assignment',
          notes: 'High-rise experience'
        },
        {
          id: 'wh-107-2',
          employer: 'ConstructPro',
          jobTitle: 'Senior operator',
          startDate: '2019-09-01',
          endDate: null,
          location: 'Dubai',
          reasonForLeaving: '',
          notes: 'Current employer'
        }
      ],
      attachments: [{ id: 'att-107-1', name: 'Degree certificate.pdf', type: 'PDF', uploadedAt: '2024-01-10' }]
    }
  };

  return SITE_EMPLOYEES.filter((e) => e.fullName !== 'Fleet pool (unassigned)' && e.fullName !== 'Maintenance pool')
    .slice(0, 10)
    .map((e) => seedFromSiteEmployee(e, enriched[e.id] ?? {}));
}
