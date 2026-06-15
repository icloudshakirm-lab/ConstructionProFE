import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type BidDirection = 'inward' | 'outward';
export type InwardBidType = 'lump_sum' | 'unit_rate' | 'cost_plus' | 'design_build';
export type InwardBidStatus = 'draft' | 'in_progress' | 'submitted' | 'won' | 'lost' | 'withdrawn';
export type OutwardBidStatus = 'draft' | 'invited' | 'evaluating' | 'awarded' | 'cancelled';
export type BidApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface BidAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface BidAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface OutwardQuotation {
  id: string;
  partnerName: string;
  partnerType: 'contractor' | 'subcontractor' | 'vendor';
  quotedValue: number;
  currency: string;
  validityDays: number;
  receivedDate: string;
  compliant: boolean;
  rank: number | null;
  notes: string;
}

export interface BidRegisterRecord {
  id: string;
  bidNumber: string;
  bidDirection: BidDirection;
  currency: string;
  bidManager: string;
  scopeSummary: string;
  approvalStatus: BidApprovalStatus;
  audit: BidAuditEntry[];
  attachments: BidAttachment[];
  /** Inward — bidding to win project from client */
  projectName?: string;
  clientName?: string;
  tenderReference?: string;
  bidType?: InwardBidType;
  submissionDeadline?: string;
  submittedDate?: string;
  bidValue?: number;
  marginPct?: number;
  bondRequired?: boolean;
  bondAmount?: number;
  competitors?: string;
  bidPlanId?: string | null;
  inwardStatus?: InwardBidStatus;
  /** Outward — subletting package to contractors */
  packageName?: string;
  projectId?: string;
  siteId?: string;
  tradePackage?: string;
  invitationDate?: string;
  closingDate?: string;
  targetBudget?: number;
  invitedPartners?: string[];
  awardedPartnerId?: string | null;
  awardedValue?: number;
  outwardStatus?: OutwardBidStatus;
  quotations?: OutwardQuotation[];
}

export const PAGE_BID_DIRECTION: Record<string, BidDirection> = {
  'inward-bids': 'inward',
  'outward-bids': 'outward'
};

export const PAGE_TITLES: Record<string, string> = {
  'inward-bids': 'Inward Bids',
  'outward-bids': 'Outward Bids'
};

export const PAGE_SUBTITLES: Record<string, string> = {
  'inward-bids':
    'Tenders submitted to clients to win projects — linked to bid planning, BOQ estimates, bonds, and commercial approval.',
  'outward-bids':
    'Packages sublet to contractors and sub-contractors — invitation, quotation comparison, evaluation, and award.'
};

export const INWARD_STATUS_OPTIONS: { label: string; value: InwardBidStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Withdrawn', value: 'withdrawn' }
];

export const OUTWARD_STATUS_OPTIONS: { label: string; value: OutwardBidStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Invited', value: 'invited' },
  { label: 'Evaluating', value: 'evaluating' },
  { label: 'Awarded', value: 'awarded' },
  { label: 'Cancelled', value: 'cancelled' }
];

export const INWARD_FORM_STATUS_OPTIONS = INWARD_STATUS_OPTIONS.filter((o) => o.value !== 'all');
export const OUTWARD_FORM_STATUS_OPTIONS = OUTWARD_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const BID_APPROVAL_FILTER_OPTIONS: { label: string; value: BidApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const INWARD_BID_TYPE_OPTIONS: { label: string; value: InwardBidType }[] = [
  { label: 'Lump sum', value: 'lump_sum' },
  { label: 'Unit rate', value: 'unit_rate' },
  { label: 'Cost plus', value: 'cost_plus' },
  { label: 'Design & build', value: 'design_build' }
];

export const TRADE_PACKAGE_OPTIONS = [
  { label: 'Structural steel', value: 'Structural steel' },
  { label: 'Concrete works', value: 'Concrete works' },
  { label: 'MEP — mechanical', value: 'MEP — mechanical' },
  { label: 'MEP — electrical', value: 'MEP — electrical' },
  { label: 'MEP — plumbing', value: 'MEP — plumbing' },
  { label: 'Facade & cladding', value: 'Facade & cladding' },
  { label: 'Piling & foundations', value: 'Piling & foundations' },
  { label: 'Waterproofing', value: 'Waterproofing' }
];

export const CURRENCY_OPTIONS = [
  { label: 'AED', value: 'AED' },
  { label: 'USD', value: 'USD' },
  { label: 'SAR', value: 'SAR' }
];

export const PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const PROJECT_FORM_OPTIONS = PROJECT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export const PARTNER_INVITE_OPTIONS = [
  { label: 'SteelFrame Contractors', value: 'ptr-mc-01' },
  { label: 'Al Noor Concrete', value: 'ptr-sub-01' },
  { label: 'Gulf Spark Electric', value: 'ptr-sub-02' },
  { label: 'Precision Survey', value: 'ptr-vnd-01' },
  { label: 'GMT Lab', value: 'ptr-vnd-02' }
];

export function projectLabel(projectId: string | null | undefined): string {
  if (!projectId) return '—';
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function siteLabel(siteId: string | null | undefined): string {
  if (!siteId) return '—';
  for (const p of DEMO_PROJECTS) {
    const site = p.sites.find((s) => s.id === siteId);
    if (site) return site.name;
  }
  return siteId;
}

export function partnerName(partnerId: string | null | undefined): string {
  if (!partnerId) return '—';
  return PARTNER_INVITE_OPTIONS.find((o) => o.value === partnerId)?.label ?? partnerId;
}

export function inwardBidTypeLabel(type: InwardBidType): string {
  return INWARD_BID_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function recordStatus(r: BidRegisterRecord): string {
  return r.bidDirection === 'inward' ? (r.inwardStatus ?? 'draft') : (r.outwardStatus ?? 'draft');
}

export function recordDisplayName(r: BidRegisterRecord): string {
  return r.bidDirection === 'inward' ? (r.projectName ?? r.bidNumber) : (r.packageName ?? r.bidNumber);
}

export function newBidId(): string {
  return `bid-${Date.now().toString(36).slice(-6)}`;
}

export function newQuotationId(): string {
  return `qt-${Date.now().toString(36).slice(-6)}`;
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

export function inwardStatusSeverity(
  status: InwardBidStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'won':
      return 'success';
    case 'submitted':
    case 'in_progress':
      return 'info';
    case 'draft':
      return 'secondary';
    case 'lost':
      return 'danger';
    case 'withdrawn':
      return 'warn';
  }
}

export function outwardStatusSeverity(
  status: OutwardBidStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'awarded':
      return 'success';
    case 'evaluating':
      return 'info';
    case 'invited':
      return 'warn';
    case 'draft':
      return 'secondary';
    case 'cancelled':
      return 'danger';
  }
}

export function statusSeverityForRecord(r: BidRegisterRecord) {
  return r.bidDirection === 'inward'
    ? inwardStatusSeverity(r.inwardStatus ?? 'draft')
    : outwardStatusSeverity(r.outwardStatus ?? 'draft');
}

export function approvalStatusLabel(status: BidApprovalStatus): string {
  const labels: Record<BidApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: BidApprovalStatus
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

export function canSubmitForApproval(r: BidRegisterRecord): boolean {
  return r.approvalStatus === 'draft' || r.approvalStatus === 'rejected';
}

export function canApproveOrReject(r: BidRegisterRecord): boolean {
  return r.approvalStatus === 'pending_approval';
}

export function allSiteFormOptions() {
  return DEMO_PROJECTS.flatMap((p) =>
    p.sites.map((s) => ({
      label: `${s.name} — ${p.name}`,
      value: s.id,
      projectId: p.id
    }))
  );
}

export function initialBidRegisters(): BidRegisterRecord[] {
  const p1 = DEMO_PROJECTS[0]?.id ?? 'P-001';
  const s1 = DEMO_PROJECTS[0]?.sites[0]?.id ?? 'S-001';
  const s2 = DEMO_PROJECTS[0]?.sites[1]?.id ?? 'S-002';

  return [
    {
      id: 'ibd-001',
      bidNumber: 'IB-2026-001',
      bidDirection: 'inward',
      projectName: 'Tower Block A — Main Contract',
      clientName: 'Al Noor Developments',
      tenderReference: 'TND-ALN-2026-041',
      bidType: 'lump_sum',
      submissionDeadline: '2026-06-30',
      submittedDate: '2026-06-28',
      bidValue: 142_500_000,
      currency: 'AED',
      marginPct: 9.5,
      bondRequired: true,
      bondAmount: 7_125_000,
      competitors: 'Competitor A, Competitor B, Regional JV',
      bidPlanId: null,
      inwardStatus: 'submitted',
      bidManager: 'Omar Al Rashid',
      scopeSummary: 'Main contract — substructure through superstructure, MEP coordination.',
      approvalStatus: 'approved',
      audit: [
        { at: '2026-06-28 17:00', action: 'Tender submitted to client', by: 'Omar Al Rashid' },
        { at: '2026-06-25 10:00', action: 'Commercial approval for submission', by: 'Commercial director' }
      ],
      attachments: [{ id: 'att-i1', name: 'Tender-Submission-IB-001.pdf', type: 'PDF', uploadedAt: '2026-06-28' }]
    },
    {
      id: 'ibd-002',
      bidNumber: 'IB-2026-002',
      bidDirection: 'inward',
      projectName: 'Warehouse Expansion — Design & Build',
      clientName: 'Gulf Logistics FZE',
      tenderReference: 'GLF-RFP-2026-08',
      bidType: 'design_build',
      submissionDeadline: '2026-06-25',
      submittedDate: '',
      bidValue: 38_200_000,
      currency: 'AED',
      marginPct: 11,
      bondRequired: true,
      bondAmount: 1_910_000,
      competitors: 'Design-build specialist, Local GC',
      bidPlanId: 'bpl-002',
      inwardStatus: 'in_progress',
      bidManager: 'James Okonkwo',
      scopeSummary: 'Design-and-build warehouse with cold storage and office annex.',
      approvalStatus: 'pending_approval',
      audit: [{ at: '2026-06-10 09:00', action: 'Estimate in progress — linked to bid plan BPL-2026-018', by: 'James Okonkwo' }],
      attachments: []
    },
    {
      id: 'ibd-003',
      bidNumber: 'IB-2026-003',
      bidDirection: 'inward',
      projectName: 'Hospital Fit-out — Block C',
      clientName: 'Emirates Health Authority',
      tenderReference: 'EHA-FT-2026-12',
      bidType: 'unit_rate',
      submissionDeadline: '2026-05-30',
      submittedDate: '2026-05-29',
      bidValue: 26_800_000,
      currency: 'AED',
      marginPct: 8.2,
      bondRequired: false,
      bondAmount: 0,
      competitors: 'MEP specialist, Fit-out contractor',
      bidPlanId: 'bpl-003',
      inwardStatus: 'won',
      bidManager: 'Fatima Al Zaabi',
      scopeSummary: 'Medical gas, HVAC, and specialist interiors.',
      approvalStatus: 'approved',
      audit: [
        { at: '2026-06-08 11:00', action: 'Award notification received — LOI expected', by: 'Fatima Al Zaabi' },
        { at: '2026-05-29 16:00', action: 'Tender submitted', by: 'Fatima Al Zaabi' }
      ],
      attachments: []
    },
    {
      id: 'obd-001',
      bidNumber: 'OB-2026-014',
      bidDirection: 'outward',
      packageName: 'Basement Concrete Package',
      projectId: p1,
      siteId: s1,
      tradePackage: 'Concrete works',
      invitationDate: '2026-05-20',
      closingDate: '2026-06-05',
      targetBudget: 4_200_000,
      currency: 'AED',
      invitedPartners: ['ptr-sub-01', 'ptr-mc-01'],
      awardedPartnerId: 'ptr-sub-01',
      awardedValue: 3_950_000,
      outwardStatus: 'awarded',
      bidManager: 'Ahmed Al Mansoori',
      scopeSummary: 'Substructure and basement slab concrete — approx. 2,800 m³.',
      quotations: [
        {
          id: 'qt-01',
          partnerName: 'Al Noor Concrete',
          partnerType: 'subcontractor',
          quotedValue: 3_950_000,
          currency: 'AED',
          validityDays: 30,
          receivedDate: '2026-06-03',
          compliant: true,
          rank: 1,
          notes: 'Lowest compliant bid'
        },
        {
          id: 'qt-02',
          partnerName: 'SteelFrame Contractors',
          partnerType: 'contractor',
          quotedValue: 4_180_000,
          currency: 'AED',
          validityDays: 30,
          receivedDate: '2026-06-04',
          compliant: true,
          rank: 2,
          notes: 'Includes early mobilization'
        }
      ],
      approvalStatus: 'approved',
      audit: [
        { at: '2026-06-06 10:00', action: 'Awarded to Al Noor Concrete', by: 'Ahmed Al Mansoori' },
        { at: '2026-05-20 09:00', action: 'Invitations issued to 2 sub-contractors', by: 'Procurement' }
      ],
      attachments: []
    },
    {
      id: 'obd-002',
      bidNumber: 'OB-2026-022',
      bidDirection: 'outward',
      packageName: 'MEP Electrical — Level 3–8',
      projectId: p1,
      siteId: s2,
      tradePackage: 'MEP — electrical',
      invitationDate: '2026-06-01',
      closingDate: '2026-06-20',
      targetBudget: 2_800_000,
      currency: 'AED',
      invitedPartners: ['ptr-sub-02'],
      awardedPartnerId: null,
      awardedValue: 0,
      outwardStatus: 'evaluating',
      bidManager: 'Sara Menon',
      scopeSummary: 'LV/MV cabling, DB installation, and testing for levels 3–8.',
      quotations: [
        {
          id: 'qt-03',
          partnerName: 'Gulf Spark Electric',
          partnerType: 'subcontractor',
          quotedValue: 2_650_000,
          currency: 'AED',
          validityDays: 45,
          receivedDate: '2026-06-15',
          compliant: true,
          rank: 1,
          notes: 'Awaiting technical compliance review'
        }
      ],
      approvalStatus: 'pending_approval',
      audit: [{ at: '2026-06-15 14:00', action: 'Quotation received — evaluation started', by: 'Sara Menon' }],
      attachments: []
    },
    {
      id: 'obd-003',
      bidNumber: 'OB-2026-028',
      bidDirection: 'outward',
      packageName: 'Facade Cladding — East Elevation',
      projectId: p1,
      siteId: s2,
      tradePackage: 'Facade & cladding',
      invitationDate: '2026-06-08',
      closingDate: '2026-07-05',
      targetBudget: 6_500_000,
      currency: 'AED',
      invitedPartners: ['ptr-mc-01', 'ptr-sub-02'],
      awardedPartnerId: null,
      awardedValue: 0,
      outwardStatus: 'invited',
      bidManager: 'Omar Al Rashid',
      scopeSummary: 'Unitized curtain wall and aluminium cladding — east elevation.',
      quotations: [],
      approvalStatus: 'draft',
      audit: [{ at: '2026-06-08 11:00', action: 'Outward bid package created — invitations pending', by: 'Omar Al Rashid' }],
      attachments: []
    }
  ];
}
