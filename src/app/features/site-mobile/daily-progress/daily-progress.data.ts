import { DEMO_BOQ_SECTIONS } from '../../boq-billing/boq-creation/boq-creation.data';
import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type DsrApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type WeatherCondition = 'Clear' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Sandstorm' | 'High Wind';

export interface DsrAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface DsrAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface ProgressQuantityLine {
  id: string;
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  plannedQty: number;
  reportedQty: number;
  cumulativeQty: number;
  remarks: string;
}

export interface ProgressPhoto {
  id: string;
  caption: string;
  album: string;
  capturedAt: string;
  gpsTag: string;
}

export interface DailyProgressRecord {
  id: string;
  dsrNumber: string;
  reportDate: string;
  projectId: string;
  siteId: string;
  submittedBy: string;
  supervisorName: string;
  weather: WeatherCondition;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  manpowerCount: number;
  equipmentCount: number;
  workSummary: string;
  safetyNotes: string;
  incidents: string;
  quantities: ProgressQuantityLine[];
  photos: ProgressPhoto[];
  supervisorSignOff: boolean;
  signOffAt: string;
  signOffBy: string;
  approvalStatus: DsrApprovalStatus;
  audit: DsrAuditEntry[];
  attachments: DsrAttachment[];
}

export type DailyProgressFormValue = Pick<
  DailyProgressRecord,
  | 'dsrNumber'
  | 'reportDate'
  | 'projectId'
  | 'siteId'
  | 'submittedBy'
  | 'supervisorName'
  | 'weather'
  | 'temperatureC'
  | 'humidityPct'
  | 'windSpeedKmh'
  | 'manpowerCount'
  | 'equipmentCount'
  | 'workSummary'
  | 'safetyNotes'
  | 'incidents'
>;

export const WEATHER_OPTIONS: { label: string; value: WeatherCondition }[] = [
  { label: 'Clear', value: 'Clear' },
  { label: 'Partly Cloudy', value: 'Partly Cloudy' },
  { label: 'Cloudy', value: 'Cloudy' },
  { label: 'Rain', value: 'Rain' },
  { label: 'Sandstorm', value: 'Sandstorm' },
  { label: 'High Wind', value: 'High Wind' }
];

export const DSR_APPROVAL_FILTER_OPTIONS: { label: string; value: DsrApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const SIGNOFF_FILTER_OPTIONS: { label: string; value: 'all' | 'signed' | 'pending' }[] = [
  { label: 'All sign-offs', value: 'all' },
  { label: 'Supervisor signed', value: 'signed' },
  { label: 'Awaiting sign-off', value: 'pending' }
];

export const PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const PROJECT_FORM_OPTIONS = PROJECT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export interface SiteFormOption {
  label: string;
  value: string;
  projectId: string;
}

export function allSiteFormOptions(): SiteFormOption[] {
  return DEMO_PROJECTS.flatMap((p) =>
    p.sites.map((s) => ({
      label: `${s.name} — ${p.name}`,
      value: s.id,
      projectId: p.id
    }))
  );
}

export function projectLabel(projectId: string | null): string {
  if (!projectId) return '—';
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function siteLabel(siteId: string | null): string {
  if (!siteId) return '—';
  for (const p of DEMO_PROJECTS) {
    const site = p.sites.find((s) => s.id === siteId);
    if (site) return site.name;
  }
  return siteId;
}

export interface BoqLineOption {
  label: string;
  value: string;
  itemCode: string;
  description: string;
  unit: string;
  plannedQty: number;
}

export function boqLineOptions(): BoqLineOption[] {
  return DEMO_BOQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      label: `${item.itemCode} — ${item.description}`,
      value: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      plannedQty: item.qty
    }))
  );
}

export function newDsrId(): string {
  return `dsr-${Date.now().toString(36).slice(-6)}`;
}

export function newQuantityId(): string {
  return `qty-${Date.now().toString(36).slice(-6)}`;
}

export function newPhotoId(): string {
  return `ph-${Date.now().toString(36).slice(-6)}`;
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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function approvalStatusLabel(status: DsrApprovalStatus): string {
  const labels: Record<DsrApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: DsrApprovalStatus
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

export function weatherSeverity(
  weather: WeatherCondition
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (weather) {
    case 'Clear':
    case 'Partly Cloudy':
      return 'success';
    case 'Cloudy':
      return 'info';
    case 'Rain':
    case 'High Wind':
      return 'warn';
    case 'Sandstorm':
      return 'danger';
  }
}

export function canSubmitForApproval(r: DailyProgressRecord): boolean {
  return (r.approvalStatus === 'draft' || r.approvalStatus === 'rejected') && r.quantities.length > 0;
}

export function canSupervisorSignOff(r: DailyProgressRecord): boolean {
  return r.approvalStatus === 'pending_approval' && !r.supervisorSignOff;
}

export function canApproveOrReject(r: DailyProgressRecord): boolean {
  return r.approvalStatus === 'pending_approval' && r.supervisorSignOff;
}

export function totalReportedQty(r: DailyProgressRecord): number {
  return r.quantities.reduce((sum, q) => sum + q.reportedQty, 0);
}

function seedDsr(
  partial: Omit<DailyProgressRecord, 'audit' | 'attachments'> & {
    audit?: DsrAuditEntry[];
    attachments?: DsrAttachment[];
  }
): DailyProgressRecord {
  return {
    audit: [{ at: '2026-06-01 07:30', action: 'DSR created from mobile', by: partial.submittedBy }],
    attachments: [],
    ...partial
  };
}

export function initialDailyProgressRecords(): DailyProgressRecord[] {
  const p1 = DEMO_PROJECTS[0]?.id ?? 'P-001';
  const s1 = DEMO_PROJECTS[0]?.sites[0]?.id ?? 'S-001';
  const s2 = DEMO_PROJECTS[0]?.sites[1]?.id ?? 'S-002';
  const p2 = DEMO_PROJECTS[1]?.id ?? 'P-002';
  const s3 = DEMO_PROJECTS[1]?.sites[0]?.id ?? 'S-003';

  return [
    seedDsr({
      id: 'dsr-001',
      dsrNumber: 'DSR-2026-0601',
      reportDate: '2026-06-01',
      projectId: p1,
      siteId: s1,
      submittedBy: 'Eng. Ravi Menon',
      supervisorName: 'Ahmed Al Mansoori',
      weather: 'Clear',
      temperatureC: 38,
      humidityPct: 42,
      windSpeedKmh: 12,
      manpowerCount: 48,
      equipmentCount: 6,
      workSummary:
        'Basement slab reinforcement completed Zone B. Concrete pour scheduled tomorrow. Formwork stripping Level P1 ongoing.',
      safetyNotes: 'Toolbox talk on heat stress. All crews hydrated. No incidents.',
      incidents: '',
      quantities: [
        {
          id: 'qty-01',
          boqItemId: 'li-2',
          itemCode: 'CON-001',
          description: 'Plain Cement Concrete',
          unit: 'm³',
          plannedQty: 120,
          reportedQty: 18,
          cumulativeQty: 72,
          remarks: 'Pour area Zone B — batch 3'
        },
        {
          id: 'qty-02',
          boqItemId: 'li-rcc',
          itemCode: 'RCC-001',
          description: 'Reinforced Concrete M25',
          unit: 'm³',
          plannedQty: 200,
          reportedQty: 12,
          cumulativeQty: 95,
          remarks: 'Column stubs P1'
        }
      ],
      photos: [
        {
          id: 'ph-01',
          caption: 'Basement slab rebar — Zone B',
          album: 'Structural',
          capturedAt: '2026-06-01T10:15:00',
          gpsTag: '25.2048° N, 55.2708° E'
        },
        {
          id: 'ph-02',
          caption: 'Formwork stripping P1',
          album: 'Progress',
          capturedAt: '2026-06-01T14:40:00',
          gpsTag: '25.2049° N, 55.2710° E'
        }
      ],
      supervisorSignOff: true,
      signOffAt: '2026-06-01 16:20',
      signOffBy: 'Ahmed Al Mansoori',
      approvalStatus: 'approved',
      attachments: [
        { id: 'att-01', name: 'DSR-2026-0601-signed.pdf', type: 'PDF', uploadedAt: '2026-06-01' }
      ]
    }),
    seedDsr({
      id: 'dsr-002',
      dsrNumber: 'DSR-2026-0602',
      reportDate: '2026-06-02',
      projectId: p1,
      siteId: s2,
      submittedBy: 'Eng. Sara Khan',
      supervisorName: 'Ahmed Al Mansoori',
      weather: 'Partly Cloudy',
      temperatureC: 36,
      humidityPct: 48,
      windSpeedKmh: 18,
      manpowerCount: 32,
      equipmentCount: 4,
      workSummary: 'Superstructure blockwork Level 3 — east wing. MEP rough-in coordination with sub-contractor.',
      safetyNotes: 'Edge protection inspected. Hot work permit closed.',
      incidents: 'Minor near-miss — unsecured ladder corrected on spot.',
      quantities: [
        {
          id: 'qty-03',
          boqItemId: 'li-1',
          itemCode: 'EXC-001',
          description: 'Earth Excavation',
          unit: 'm³',
          plannedQty: 500,
          reportedQty: 45,
          cumulativeQty: 310,
          remarks: 'Trench extension east'
        }
      ],
      photos: [
        {
          id: 'ph-03',
          caption: 'Blockwork L3 east wing',
          album: 'Masonry',
          capturedAt: '2026-06-02T11:00:00',
          gpsTag: '25.2051° N, 55.2712° E'
        }
      ],
      supervisorSignOff: false,
      signOffAt: '',
      signOffBy: '',
      approvalStatus: 'pending_approval'
    }),
    seedDsr({
      id: 'dsr-003',
      dsrNumber: 'DSR-2026-0603',
      reportDate: todayIso(),
      projectId: p2,
      siteId: s3,
      submittedBy: 'Eng. James Okonkwo',
      supervisorName: 'Fatima Al Zaabi',
      weather: 'High Wind',
      temperatureC: 34,
      humidityPct: 35,
      windSpeedKmh: 42,
      manpowerCount: 22,
      equipmentCount: 3,
      workSummary: 'Warehouse steel erection bay 2 — crane operations suspended 11:00–14:00 due to wind.',
      safetyNotes: 'Crane wind lock protocol applied. Tag lines used when lifting resumed.',
      incidents: '',
      quantities: [],
      photos: [],
      supervisorSignOff: false,
      signOffAt: '',
      signOffBy: '',
      approvalStatus: 'draft'
    }),
    seedDsr({
      id: 'dsr-004',
      dsrNumber: 'DSR-2026-0530',
      reportDate: '2026-05-30',
      projectId: p1,
      siteId: s1,
      submittedBy: 'Eng. Ravi Menon',
      supervisorName: 'Ahmed Al Mansoori',
      weather: 'Rain',
      temperatureC: 29,
      humidityPct: 78,
      windSpeedKmh: 22,
      manpowerCount: 15,
      equipmentCount: 2,
      workSummary: 'Rain day — limited interior works only. Dewatering pumps active in excavation.',
      safetyNotes: 'Slip hazard briefing. Electrical equipment isolated in open areas.',
      incidents: '',
      quantities: [
        {
          id: 'qty-04',
          boqItemId: 'li-1',
          itemCode: 'EXC-001',
          description: 'Earth Excavation',
          unit: 'm³',
          plannedQty: 500,
          reportedQty: 0,
          cumulativeQty: 265,
          remarks: 'No excavation — weather stand-down'
        }
      ],
      photos: [],
      supervisorSignOff: true,
      signOffAt: '2026-05-30 15:00',
      signOffBy: 'Ahmed Al Mansoori',
      approvalStatus: 'rejected',
      audit: [
        { at: '2026-05-30 15:00', action: 'Supervisor sign-off recorded', by: 'Ahmed Al Mansoori' },
        { at: '2026-05-30 16:10', action: 'Rejected — attach dewatering log and pump hours', by: 'Project manager' },
        { at: '2026-05-30 07:30', action: 'DSR created from mobile', by: 'Eng. Ravi Menon' }
      ]
    })
  ];
}
