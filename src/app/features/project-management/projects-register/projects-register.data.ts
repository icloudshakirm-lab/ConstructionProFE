import {
  DEMO_PROJECTS,
  type ProjectSummary
} from '../projects-sites-org-chart/projects-sites-org-chart.data';

export type ProjectLifecycleStatus = ProjectSummary['status'];
export type ProjectApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface ProjectAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface ProjectRegister {
  id: string;
  name: string;
  client: string;
  status: ProjectLifecycleStatus;
  approvalStatus: ProjectApprovalStatus;
  contractValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  projectManager: string;
  scopeSummary: string;
  linkedSiteCount: number;
  audit: ProjectAuditEntry[];
  attachments: ProjectAttachment[];
}

export type ProjectFormValue = Pick<
  ProjectRegister,
  | 'name'
  | 'client'
  | 'status'
  | 'contractValue'
  | 'currency'
  | 'startDate'
  | 'endDate'
  | 'projectManager'
  | 'scopeSummary'
>;

export const PROJECT_STATUS_OPTIONS: { label: string; value: ProjectLifecycleStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Planned', value: 'Planned' },
  { label: 'Completed', value: 'Completed' },
  { label: 'On Hold', value: 'On Hold' }
];

export const PROJECT_FORM_STATUS_OPTIONS = PROJECT_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const PROJECT_APPROVAL_FILTER_OPTIONS: { label: string; value: ProjectApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const PROJECT_CURRENCY_OPTIONS = [
  { label: 'AED', value: 'AED' },
  { label: 'USD', value: 'USD' },
  { label: 'SAR', value: 'SAR' }
];

const EXTRA_BY_ID: Record<
  string,
  Partial<
    Pick<
      ProjectRegister,
      | 'contractValue'
      | 'currency'
      | 'startDate'
      | 'endDate'
      | 'projectManager'
      | 'scopeSummary'
      | 'approvalStatus'
      | 'attachments'
    >
  >
> = {
  'P-001': {
    contractValue: 128_500_000,
    startDate: '2025-03-01',
    endDate: '2027-12-31',
    projectManager: 'Sarah Al Ketbi',
    scopeSummary: 'Design-and-build tower block with basement, superstructure, and MEP fit-out.',
    approvalStatus: 'approved',
    attachments: [
      { id: 'pa1', name: 'Main contract signed.pdf', type: 'PDF', uploadedAt: '2025-02-20' },
      { id: 'pa2', name: 'Project charter.docx', type: 'Document', uploadedAt: '2025-02-28' }
    ]
  },
  'P-002': {
    contractValue: 42_000_000,
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    projectManager: 'James Patel',
    scopeSummary: 'Warehouse expansion phase 2 — steel structure and MEP.',
    approvalStatus: 'pending_approval',
    attachments: [{ id: 'pa3', name: 'Tender BOQ summary.xlsx', type: 'Spreadsheet', uploadedAt: '2026-04-10' }]
  },
  'P-003': {
    contractValue: 67_800_000,
    startDate: '2025-11-01',
    endDate: '2026-11-30',
    projectManager: 'Omar Farouk',
    scopeSummary: 'Roadworks section C — earthworks, drainage, asphalt.',
    approvalStatus: 'approved',
    attachments: []
  },
  'P-004': {
    contractValue: 95_200_000,
    startDate: '2025-06-15',
    endDate: '2027-03-31',
    projectManager: 'Nadia Siddiqui',
    scopeSummary: 'Hospital wing B retrofit — demolition, medical MEP, ICU handover.',
    approvalStatus: 'approved',
    attachments: [{ id: 'pa4', name: 'Infection control plan.pdf', type: 'PDF', uploadedAt: '2025-05-01' }]
  },
  'P-005': {
    contractValue: 31_500_000,
    startDate: '2025-09-01',
    endDate: '2027-11-30',
    projectManager: 'Hassan Iqbal',
    scopeSummary: 'Marina promenade marine piling, boardwalk, landscape.',
    approvalStatus: 'rejected',
    attachments: []
  }
};

function seedFromDemo(p: ProjectSummary): ProjectRegister {
  const extra = EXTRA_BY_ID[p.id] ?? {};
  return {
    id: p.id,
    name: p.name,
    client: p.client,
    status: p.status,
    approvalStatus: extra.approvalStatus ?? 'draft',
    contractValue: extra.contractValue ?? 10_000_000,
    currency: extra.currency ?? 'AED',
    startDate: extra.startDate ?? '2026-01-01',
    endDate: extra.endDate ?? '2026-12-31',
    projectManager: extra.projectManager ?? 'TBD',
    scopeSummary: extra.scopeSummary ?? '',
    linkedSiteCount: p.sites.length,
    audit: [
      {
        at: auditTimestamp(),
        action: 'Project loaded from demo register',
        by: 'System'
      }
    ],
    attachments: extra.attachments ?? []
  };
}

export function initialProjectRegister(): ProjectRegister[] {
  return DEMO_PROJECTS.map(seedFromDemo);
}

export function newProjectId(): string {
  return `P-${Date.now().toString(36).slice(-6).toUpperCase()}`;
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

export function projectStatusSeverity(
  status: ProjectLifecycleStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Planned':
      return 'info';
    case 'Completed':
      return 'secondary';
    case 'On Hold':
      return 'warn';
  }
}

export function approvalStatusSeverity(
  status: ProjectApprovalStatus
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

export function approvalStatusLabel(status: ProjectApprovalStatus): string {
  const labels: Record<ProjectApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function formatContractValue(value: number, currency: string): string {
  if (value >= 1_000_000) {
    return `${currency} ${(value / 1_000_000).toFixed(2)}M`;
  }
  return `${currency} ${value.toLocaleString()}`;
}

export function canSubmitForApproval(p: ProjectRegister): boolean {
  return p.approvalStatus === 'draft' || p.approvalStatus === 'rejected';
}

export function canApproveOrReject(p: ProjectRegister): boolean {
  return p.approvalStatus === 'pending_approval';
}
