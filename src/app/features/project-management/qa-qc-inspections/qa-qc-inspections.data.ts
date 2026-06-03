import { BOQ_PROJECTS, BoqProjectOption } from '../../boq-billing/boq-creation/boq-creation.data';

export type InspectionStatus =
  | 'draft'
  | 'task-assigned'
  | 'work-completed'
  | 'inspection-requested'
  | 'under-inspection'
  | 'approved'
  | 'rework-required'
  | 'corrective-action-done'
  | 're-inspection-requested'
  | 'under-re-inspection'
  | 'rejected';

export interface InspectionAuditEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  note?: string;
}

export interface QaQcInspection {
  id: string;
  refNo: string;
  projectId: string;
  siteName: string;
  wbsTask: string;
  workPackage: string;
  description: string;
  status: InspectionStatus;
  siteTeamAssignee: string | null;
  qaEngineer: string | null;
  requestedAt: string | null;
  inspectedAt: string | null;
  approvedAt: string | null;
  reworkCount: number;
  correctiveActionNote: string | null;
  history: InspectionAuditEntry[];
}

export { BOQ_PROJECTS };
export type { BoqProjectOption };

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  draft: 'Draft',
  'task-assigned': 'Task assigned',
  'work-completed': 'Work completed',
  'inspection-requested': 'Inspection requested',
  'under-inspection': 'Under inspection',
  approved: 'Approved',
  'rework-required': 'Rework required',
  'corrective-action-done': 'Corrective action done',
  're-inspection-requested': 'Re-inspection requested',
  'under-re-inspection': 'Under re-inspection',
  rejected: 'Rejected'
};

export const SITE_TEAM_OPTIONS = [
  { label: 'R. Hassan — Site Engineer', value: 'R. Hassan — Site Engineer' },
  { label: 'K. Ahmed — Foreman (Civil)', value: 'K. Ahmed — Foreman (Civil)' },
  { label: 'Subcontractor: Al Noor Concrete', value: 'Subcontractor: Al Noor Concrete' },
  { label: 'MEP Crew Lead — Floor 3', value: 'MEP Crew Lead — Floor 3' }
];

export const QA_ENGINEER_OPTIONS = [
  { label: 'N. Siddiqui — QA/QC Engineer', value: 'N. Siddiqui — QA/QC Engineer' },
  { label: 'F. Qureshi — Senior QC Inspector', value: 'F. Qureshi — Senior QC Inspector' },
  { label: 'External: Bureau Veritas', value: 'External: Bureau Veritas' }
];

export const WBS_TASK_OPTIONS = [
  { label: 'Foundation — Raft PCC', value: 'Foundation — Raft PCC' },
  { label: 'Structure — Column C12–C18', value: 'Structure — Column C12–C18' },
  { label: 'MEP — DB Room Earthing', value: 'MEP — DB Room Earthing' },
  { label: 'Envelope — Curtain wall bracket', value: 'Envelope — Curtain wall bracket' }
];

export const DEMO_QA_QC_INSPECTIONS: QaQcInspection[] = [
  {
    id: 'insp-1',
    refNo: 'IR-2026-0142',
    projectId: 'tower-a',
    siteName: 'Tower Block A — Zone 2',
    wbsTask: 'Foundation — Raft PCC',
    workPackage: 'Hold Point HP-04 — Raft concrete before pour',
    description: 'Verify rebar cover, formwork cleanliness, and pre-pour checklist.',
    status: 'under-inspection',
    siteTeamAssignee: 'K. Ahmed — Foreman (Civil)',
    qaEngineer: 'N. Siddiqui — QA/QC Engineer',
    requestedAt: '2026-06-02T09:00:00',
    inspectedAt: '2026-06-03T10:30:00',
    approvedAt: null,
    reworkCount: 0,
    correctiveActionNote: null,
    history: [
      { id: 'l1', at: '2026-05-28T08:00:00', by: 'System', action: 'Inspection created (draft)' },
      { id: 'l2', at: '2026-05-28T09:15:00', by: 'R. Hassan', action: 'Task assigned to site team' },
      { id: 'l3', at: '2026-06-01T16:00:00', by: 'K. Ahmed', action: 'Work marked completed' },
      { id: 'l4', at: '2026-06-02T09:00:00', by: 'R. Hassan', action: 'Inspection request raised' },
      { id: 'l5', at: '2026-06-02T11:00:00', by: 'N. Siddiqui', action: 'QA/QC engineer assigned' },
      { id: 'l6', at: '2026-06-03T10:30:00', by: 'N. Siddiqui', action: 'Site inspection started' }
    ]
  },
  {
    id: 'insp-2',
    refNo: 'IR-2026-0138',
    projectId: 'tower-a',
    siteName: 'Tower Block A — Level 3',
    wbsTask: 'MEP — DB Room Earthing',
    workPackage: 'Earthing grid & bonding inspection',
    description: 'Continuity test records and electrode installation per spec.',
    status: 'rework-required',
    siteTeamAssignee: 'MEP Crew Lead — Floor 3',
    qaEngineer: 'F. Qureshi — Senior QC Inspector',
    requestedAt: '2026-05-25T14:00:00',
    inspectedAt: '2026-05-26T11:00:00',
    approvedAt: null,
    reworkCount: 1,
    correctiveActionNote: null,
    history: [
      { id: 'l7', at: '2026-05-20T10:00:00', by: 'System', action: 'Inspection created' },
      { id: 'l8', at: '2026-05-26T11:45:00', by: 'F. Qureshi', action: 'Inspection failed — bonding clamp torque below spec' }
    ]
  },
  {
    id: 'insp-3',
    refNo: 'IR-2026-0150',
    projectId: 'tower-a',
    siteName: 'Tower Block A — Level 5',
    wbsTask: 'Structure — Column C12–C18',
    workPackage: 'Column formwork & verticality',
    description: 'Re-inspection after rework on formwork alignment.',
    status: 'under-re-inspection',
    siteTeamAssignee: 'Subcontractor: Al Noor Concrete',
    qaEngineer: 'N. Siddiqui — QA/QC Engineer',
    requestedAt: '2026-06-01T08:00:00',
    inspectedAt: '2026-06-03T14:00:00',
    approvedAt: null,
    reworkCount: 1,
    correctiveActionNote: 'Formwork re-aligned; verticality within 3mm on all columns.',
    history: [
      { id: 'l9', at: '2026-05-15T08:00:00', by: 'System', action: 'First inspection failed' },
      { id: 'l10', at: '2026-06-02T17:00:00', by: 'Al Noor Concrete', action: 'Corrective action completed' },
      { id: 'l11', at: '2026-06-03T08:00:00', by: 'R. Hassan', action: 'Re-inspection requested' },
      { id: 'l12', at: '2026-06-03T14:00:00', by: 'N. Siddiqui', action: 'Re-inspection in progress' }
    ]
  },
  {
    id: 'insp-4',
    refNo: 'IR-2026-0099',
    projectId: 'warehouse-p2',
    siteName: 'Warehouse — Steel frame grid A',
    wbsTask: 'Envelope — Curtain wall bracket',
    workPackage: 'Bracket welding visual & MPI',
    description: 'Approved hold-point release for cladding sequence.',
    status: 'approved',
    siteTeamAssignee: 'Subcontractor: Al Noor Concrete',
    qaEngineer: 'F. Qureshi — Senior QC Inspector',
    requestedAt: '2026-04-10T09:00:00',
    inspectedAt: '2026-04-12T15:00:00',
    approvedAt: '2026-04-12T15:30:00',
    reworkCount: 0,
    correctiveActionNote: null,
    history: [
      { id: 'l13', at: '2026-04-12T15:30:00', by: 'F. Qureshi', action: 'Inspection passed — approved' }
    ]
  },
  {
    id: 'insp-5',
    refNo: 'IR-2026-0155',
    projectId: 'tower-a',
    siteName: 'Tower Block A — Basement',
    wbsTask: 'Foundation — Raft PCC',
    workPackage: 'Waterproofing membrane lap joints',
    description: 'New inspection — task assigned, work in progress.',
    status: 'task-assigned',
    siteTeamAssignee: 'K. Ahmed — Foreman (Civil)',
    qaEngineer: null,
    requestedAt: null,
    inspectedAt: null,
    approvedAt: null,
    reworkCount: 0,
    correctiveActionNote: null,
    history: [
      { id: 'l14', at: '2026-06-03T07:00:00', by: 'R. Hassan', action: 'Task assigned to site team' }
    ]
  }
];

/** Flowchart node ids used for highlighting active step. */
export type FlowNodeId =
  | 'task-assigned'
  | 'work-completed'
  | 'inspection-requested'
  | 'under-inspection'
  | 'approved'
  | 'rework-required'
  | 'corrective-action-done'
  | 're-inspection-requested'
  | 'under-re-inspection'
  | 'rejected';

export function statusToFlowNode(status: InspectionStatus): FlowNodeId {
  if (status === 'draft') return 'task-assigned';
  return status;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export interface InspectionAction {
  id: string;
  label: string;
  icon: string;
  severity?: 'success' | 'danger' | 'warn' | 'secondary';
}

export function availableActions(status: InspectionStatus): InspectionAction[] {
  switch (status) {
    case 'draft':
      return [{ id: 'assign-task', label: 'Assign to site team', icon: 'pi pi-user-plus' }];
    case 'task-assigned':
      return [{ id: 'work-completed', label: 'Mark work completed', icon: 'pi pi-check' }];
    case 'work-completed':
      return [{ id: 'request-inspection', label: 'Raise inspection request', icon: 'pi pi-send' }];
    case 'inspection-requested':
      return [{ id: 'start-inspection', label: 'Start site inspection', icon: 'pi pi-search' }];
    case 'under-inspection':
      return [
        { id: 'pass', label: 'Pass — Approve', icon: 'pi pi-check-circle', severity: 'success' },
        { id: 'fail', label: 'Fail — Rework required', icon: 'pi pi-replay', severity: 'warn' },
        { id: 'reject', label: 'Reject — Rework', icon: 'pi pi-times-circle', severity: 'danger' }
      ];
    case 'rework-required':
    case 'rejected':
      return [{ id: 'corrective-done', label: 'Corrective action done', icon: 'pi pi-wrench' }];
    case 'corrective-action-done':
      return [{ id: 'request-reinspection', label: 'Request re-inspection', icon: 'pi pi-refresh' }];
    case 're-inspection-requested':
      return [{ id: 'start-reinspection', label: 'Start re-inspection', icon: 'pi pi-search' }];
    case 'under-re-inspection':
      return [
        { id: 'pass', label: 'Approve', icon: 'pi pi-check-circle', severity: 'success' },
        { id: 'fail', label: 'Fail again', icon: 'pi pi-replay', severity: 'warn' }
      ];
    default:
      return [];
  }
}

export function nextStatus(
  current: InspectionStatus,
  actionId: string
): InspectionStatus | null {
  switch (current) {
    case 'draft':
      if (actionId === 'assign-task') return 'task-assigned';
      break;
    case 'task-assigned':
      if (actionId === 'work-completed') return 'work-completed';
      break;
    case 'work-completed':
      if (actionId === 'request-inspection') return 'inspection-requested';
      break;
    case 'inspection-requested':
      if (actionId === 'start-inspection') return 'under-inspection';
      break;
    case 'under-inspection':
      if (actionId === 'pass') return 'approved';
      if (actionId === 'fail') return 'rework-required';
      if (actionId === 'reject') return 'rejected';
      break;
    case 'rework-required':
    case 'rejected':
      if (actionId === 'corrective-done') return 'corrective-action-done';
      break;
    case 'corrective-action-done':
      if (actionId === 'request-reinspection') return 're-inspection-requested';
      break;
    case 're-inspection-requested':
      if (actionId === 'start-reinspection') return 'under-re-inspection';
      break;
    case 'under-re-inspection':
      if (actionId === 'pass') return 'approved';
      if (actionId === 'fail') return 'rework-required';
      break;
  }
  return null;
}

export function actionLabel(actionId: string): string {
  const map: Record<string, string> = {
    'assign-task': 'Task assigned to site team',
    'work-completed': 'Work completed by site team',
    'request-inspection': 'Inspection request raised',
    'start-inspection': 'Site inspection conducted (in progress)',
    pass: 'Inspection passed — approved',
    fail: 'Inspection failed — rework required',
    reject: 'Inspection rejected — rework required',
    'corrective-done': 'Corrective action completed by contractor',
    'request-reinspection': 'Re-inspection request raised',
    'start-reinspection': 'Re-inspection in progress'
  };
  return map[actionId] ?? actionId;
}
