export type BidPlanStatus =
  | 'identified'
  | 'qualifying'
  | 'go'
  | 'no_go'
  | 'planned'
  | 'converted';
export type BidPlanApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface BidPlanAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface BidPlanAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface BidPlanRecord {
  id: string;
  planCode: string;
  opportunityName: string;
  clientName: string;
  sector: string;
  estimatedValue: number;
  currency: string;
  location: string;
  rfpReceivedDate: string;
  bidDueDate: string;
  status: BidPlanStatus;
  winProbabilityPct: number;
  bidManager: string;
  estimator: string;
  goNoGoDate: string;
  scopeSummary: string;
  risks: string;
  linkedInwardBidId: string | null;
  approvalStatus: BidPlanApprovalStatus;
  audit: BidPlanAuditEntry[];
  attachments: BidPlanAttachment[];
}

export type BidPlanFormValue = Pick<
  BidPlanRecord,
  | 'planCode'
  | 'opportunityName'
  | 'clientName'
  | 'sector'
  | 'estimatedValue'
  | 'currency'
  | 'location'
  | 'rfpReceivedDate'
  | 'bidDueDate'
  | 'status'
  | 'winProbabilityPct'
  | 'bidManager'
  | 'estimator'
  | 'goNoGoDate'
  | 'scopeSummary'
  | 'risks'
>;

export const BID_PLAN_STATUS_OPTIONS: { label: string; value: BidPlanStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Identified', value: 'identified' },
  { label: 'Qualifying', value: 'qualifying' },
  { label: 'Go — planned to bid', value: 'go' },
  { label: 'Planned', value: 'planned' },
  { label: 'Converted to bid', value: 'converted' },
  { label: 'No-go', value: 'no_go' }
];

export const BID_PLAN_FORM_STATUS_OPTIONS = BID_PLAN_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const BID_PLAN_APPROVAL_FILTER_OPTIONS: { label: string; value: BidPlanApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const SECTOR_OPTIONS = [
  { label: 'Commercial high-rise', value: 'Commercial high-rise' },
  { label: 'Residential', value: 'Residential' },
  { label: 'Industrial / warehouse', value: 'Industrial / warehouse' },
  { label: 'Infrastructure / roads', value: 'Infrastructure / roads' },
  { label: 'MEP / fit-out', value: 'MEP / fit-out' },
  { label: 'Oil & gas', value: 'Oil & gas' }
];

export const CURRENCY_OPTIONS = [
  { label: 'AED', value: 'AED' },
  { label: 'USD', value: 'USD' },
  { label: 'SAR', value: 'SAR' }
];

export function newBidPlanId(): string {
  return `bpl-${Date.now().toString(36).slice(-6)}`;
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

export function planStatusSeverity(
  status: BidPlanStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'go':
    case 'planned':
    case 'converted':
      return 'success';
    case 'qualifying':
      return 'info';
    case 'identified':
      return 'secondary';
    case 'no_go':
      return 'danger';
  }
}

export function planStatusLabel(status: BidPlanStatus): string {
  const labels: Record<BidPlanStatus, string> = {
    identified: 'Identified',
    qualifying: 'Qualifying',
    go: 'Go — plan to bid',
    no_go: 'No-go',
    planned: 'Planned',
    converted: 'Converted to bid'
  };
  return labels[status];
}

export function approvalStatusLabel(status: BidPlanApprovalStatus): string {
  const labels: Record<BidPlanApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: BidPlanApprovalStatus
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

export function canSubmitForApproval(p: BidPlanRecord): boolean {
  return p.approvalStatus === 'draft' || p.approvalStatus === 'rejected';
}

export function canApproveOrReject(p: BidPlanRecord): boolean {
  return p.approvalStatus === 'pending_approval';
}

export function canConvertToBid(p: BidPlanRecord): boolean {
  return (
    (p.status === 'go' || p.status === 'planned') &&
    p.approvalStatus === 'approved' &&
    !p.linkedInwardBidId
  );
}

export function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export function initialBidPlans(): BidPlanRecord[] {
  return [
    {
      id: 'bpl-001',
      planCode: 'BPL-2026-014',
      opportunityName: 'Marina Tower — Phase 2 Main Contract',
      clientName: 'Al Noor Developments',
      sector: 'Commercial high-rise',
      estimatedValue: 185_000_000,
      currency: 'AED',
      location: 'Dubai Marina',
      rfpReceivedDate: '2026-05-15',
      bidDueDate: '2026-07-10',
      status: 'planned',
      winProbabilityPct: 35,
      bidManager: 'Omar Al Rashid',
      estimator: 'Sara Menon',
      goNoGoDate: '2026-05-28',
      scopeSummary: '42-storey tower — structure, MEP, facade. Design-and-build elements in podium.',
      risks: 'Aggressive programme; specialist facade subcontractor availability.',
      linkedInwardBidId: null,
      approvalStatus: 'approved',
      audit: [
        { at: '2026-05-28 11:00', action: 'Go decision approved — bid team mobilized', by: 'Commercial director' },
        { at: '2026-05-20 09:00', action: 'Opportunity qualified', by: 'Omar Al Rashid' }
      ],
      attachments: [
        { id: 'att-01', name: 'RFP-Marina-Tower-P2.pdf', type: 'PDF', uploadedAt: '2026-05-15' }
      ]
    },
    {
      id: 'bpl-002',
      planCode: 'BPL-2026-018',
      opportunityName: 'Warehouse Expansion — Design & Build',
      clientName: 'Gulf Logistics FZE',
      sector: 'Industrial / warehouse',
      estimatedValue: 42_000_000,
      currency: 'AED',
      location: 'Jebel Ali',
      rfpReceivedDate: '2026-06-01',
      bidDueDate: '2026-06-25',
      status: 'go',
      winProbabilityPct: 55,
      bidManager: 'James Okonkwo',
      estimator: 'Ravi Menon',
      goNoGoDate: '2026-06-05',
      scopeSummary: '15,000 m² warehouse with cold storage zone and office annex.',
      risks: 'Client budget ceiling communicated at pre-bid meeting.',
      linkedInwardBidId: null,
      approvalStatus: 'pending_approval',
      audit: [{ at: '2026-06-05 14:30', action: 'Submitted for go/no-go approval', by: 'James Okonkwo' }],
      attachments: []
    },
    {
      id: 'bpl-003',
      planCode: 'BPL-2026-009',
      opportunityName: 'Hospital Fit-out — Block C',
      clientName: 'Emirates Health Authority',
      sector: 'MEP / fit-out',
      estimatedValue: 28_000_000,
      currency: 'AED',
      location: 'Abu Dhabi',
      rfpReceivedDate: '2026-04-20',
      bidDueDate: '2026-05-30',
      status: 'converted',
      winProbabilityPct: 40,
      bidManager: 'Fatima Al Zaabi',
      estimator: 'Dr. Amira Farouk',
      goNoGoDate: '2026-04-28',
      scopeSummary: 'Medical gas, HVAC, and specialist interiors for 120-bed wing.',
      risks: '',
      linkedInwardBidId: 'ibd-003',
      approvalStatus: 'approved',
      audit: [
        { at: '2026-05-02 10:00', action: 'Converted to inward bid IB-2026-003', by: 'Fatima Al Zaabi' },
        { at: '2026-04-28 09:00', action: 'Go decision approved', by: 'Commercial director' }
      ],
      attachments: []
    },
    {
      id: 'bpl-004',
      planCode: 'BPL-2026-022',
      opportunityName: 'Coastal Road Section 4',
      clientName: 'RTA',
      sector: 'Infrastructure / roads',
      estimatedValue: 320_000_000,
      currency: 'AED',
      location: 'Dubai',
      rfpReceivedDate: '2026-06-03',
      bidDueDate: '2026-08-15',
      status: 'qualifying',
      winProbabilityPct: 20,
      bidManager: 'Omar Al Rashid',
      estimator: 'Sara Menon',
      goNoGoDate: '',
      scopeSummary: '8 km dual carriageway with bridges and interchanges.',
      risks: 'Joint venture may be required; heavy competition expected.',
      linkedInwardBidId: null,
      approvalStatus: 'draft',
      audit: [{ at: '2026-06-03 08:00', action: 'Opportunity identified from market intel', by: 'BD team' }],
      attachments: []
    },
    {
      id: 'bpl-005',
      planCode: 'BPL-2026-011',
      opportunityName: 'Luxury Villas — Palm Cluster',
      clientName: 'Private developer',
      sector: 'Residential',
      estimatedValue: 95_000_000,
      currency: 'AED',
      location: 'Palm Jumeirah',
      rfpReceivedDate: '2026-05-01',
      bidDueDate: '2026-06-10',
      status: 'no_go',
      winProbabilityPct: 15,
      bidManager: 'James Okonkwo',
      estimator: 'Ravi Menon',
      goNoGoDate: '2026-05-12',
      scopeSummary: '12 luxury villas with basement parking.',
      risks: 'Margin below threshold; client payment terms unacceptable.',
      linkedInwardBidId: null,
      approvalStatus: 'approved',
      audit: [
        { at: '2026-05-12 16:00', action: 'No-go decision — margin below 8% threshold', by: 'Commercial director' }
      ],
      attachments: []
    }
  ];
}
