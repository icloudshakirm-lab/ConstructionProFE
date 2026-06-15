import { DEMO_BOQ_SECTIONS } from '../../boq-billing/boq-creation/boq-creation.data';
import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import {
  initialMaterialIssuances,
  lineAmount,
  type MaterialIssueLine,
  type MaterialIssuanceRecord
} from '../material-issuance/material-issuance.data';

export type ConsumptionStatus = 'on_track' | 'warning' | 'over_budget';
export type ConsumptionApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface ConsumptionAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface ConsumptionAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface ConsumptionIssuanceRef {
  id: string;
  issueNumber: string;
  issueDate: string;
  siteId: string;
  materialCode: string;
  materialName: string;
  qty: number;
  unit: string;
  amount: number;
}

export interface MaterialConsumptionRecord {
  id: string;
  projectId: string;
  siteId: string | null;
  costCode: string;
  boqItemId: string;
  boqItemCode: string;
  boqDescription: string;
  boqSection: string;
  unit: string;
  budgetQty: number;
  budgetAmount: number;
  boqRate: number;
  consumedQty: number;
  consumedAmount: number;
  remainingQty: number;
  remainingAmount: number;
  varianceQtyPct: number;
  varianceAmountPct: number;
  status: ConsumptionStatus;
  approvalStatus: ConsumptionApprovalStatus;
  lastUpdated: string;
  notes: string;
  issuanceRefs: ConsumptionIssuanceRef[];
  audit: ConsumptionAuditEntry[];
  attachments: ConsumptionAttachment[];
}

export type ConsumptionAdjustmentFormValue = Pick<
  MaterialConsumptionRecord,
  'consumedQty' | 'consumedAmount' | 'notes'
>;

export const CONSUMPTION_STATUS_OPTIONS: { label: string; value: ConsumptionStatus | 'all' }[] = [
  { label: 'All variance states', value: 'all' },
  { label: 'On track', value: 'on_track' },
  { label: 'Warning (>80%)', value: 'warning' },
  { label: 'Over budget', value: 'over_budget' }
];

export const CONSUMPTION_APPROVAL_FILTER_OPTIONS: { label: string; value: ConsumptionApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const COST_CODE_FILTER_OPTIONS = [
  { label: 'All cost codes', value: 'all' },
  { label: 'CIV-01 — Substructure', value: 'CIV-01' },
  { label: 'CIV-02 — Superstructure', value: 'CIV-02' },
  { label: 'STR-01 — Reinforcement', value: 'STR-01' },
  { label: 'MEP-01 — Electrical', value: 'MEP-01' },
  { label: 'MEP-02 — Mechanical', value: 'MEP-02' }
];

export const BOQ_SECTION_FILTER_OPTIONS = [
  { label: 'All BOQ sections', value: 'all' },
  ...[...new Set(DEMO_BOQ_SECTIONS.map((s) => s.title))].map((t) => ({ label: t, value: t }))
];

export function projectLabel(projectId: string | null): string {
  if (!projectId) return '—';
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function siteLabel(siteId: string | null): string {
  if (!siteId) return 'All sites';
  for (const p of DEMO_PROJECTS) {
    const site = p.sites.find((s) => s.id === siteId);
    if (site) return site.name;
  }
  return siteId;
}

export function consumptionStatusLabel(status: ConsumptionStatus): string {
  const labels: Record<ConsumptionStatus, string> = {
    on_track: 'On track',
    warning: 'Warning',
    over_budget: 'Over budget'
  };
  return labels[status];
}

export function consumptionStatusSeverity(
  status: ConsumptionStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'on_track':
      return 'success';
    case 'warning':
      return 'warn';
    case 'over_budget':
      return 'danger';
  }
}

export function approvalStatusLabel(status: ConsumptionApprovalStatus): string {
  const labels: Record<ConsumptionApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: ConsumptionApprovalStatus
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

export function canSubmitForApproval(r: MaterialConsumptionRecord): boolean {
  return r.approvalStatus === 'draft' || r.approvalStatus === 'rejected';
}

export function canApproveOrReject(r: MaterialConsumptionRecord): boolean {
  return r.approvalStatus === 'pending_approval';
}

function deriveStatus(amountPct: number): ConsumptionStatus {
  if (amountPct > 100) return 'over_budget';
  if (amountPct > 80) return 'warning';
  return 'on_track';
}

function aggregateKey(projectId: string, boqItemId: string, costCode: string): string {
  return `${projectId}|${boqItemId}|${costCode}`;
}

function buildFromIssuances(issuances: MaterialIssuanceRecord[]): MaterialConsumptionRecord[] {
  type Acc = {
    projectId: string;
    siteId: string | null;
    costCode: string;
    line: MaterialIssueLine;
    consumedQty: number;
    consumedAmount: number;
    refs: ConsumptionIssuanceRef[];
    lastDate: string;
  };

  const map = new Map<string, Acc>();

  for (const iss of issuances) {
    if (iss.status !== 'issued') continue;
    for (const line of iss.lines) {
      const key = aggregateKey(iss.projectId, line.boqItemId, iss.costCode);
      const amt = lineAmount(line);
      const ref: ConsumptionIssuanceRef = {
        id: `${iss.id}-${line.id}`,
        issueNumber: iss.issueNumber,
        issueDate: iss.issueDate,
        siteId: iss.siteId,
        materialCode: line.materialCode,
        materialName: line.materialName,
        qty: line.issuedQty,
        unit: line.unit,
        amount: amt
      };
      const existing = map.get(key);
      if (existing) {
        existing.consumedQty += line.issuedQty;
        existing.consumedAmount += amt;
        existing.refs.push(ref);
        if (iss.issueDate > (existing.lastDate ?? '')) existing.lastDate = iss.issueDate;
      } else {
        map.set(key, {
          projectId: iss.projectId,
          siteId: iss.siteId,
          costCode: iss.costCode,
          line,
          consumedQty: line.issuedQty,
          consumedAmount: amt,
          refs: [ref],
          lastDate: iss.issueDate
        });
      }
    }
  }

  return [...map.values()].map((acc, idx) => {
    const budgetQty = acc.line.boqBudgetQty;
    const budgetAmount = acc.line.boqBudgetAmount;
    const boqRate = budgetQty > 0 ? budgetAmount / budgetQty : acc.line.unitRate;
    const remainingQty = budgetQty - acc.consumedQty;
    const remainingAmount = budgetAmount - acc.consumedAmount;
    const varianceQtyPct = budgetQty > 0 ? Math.round((acc.consumedQty / budgetQty) * 1000) / 10 : 0;
    const varianceAmountPct = budgetAmount > 0 ? Math.round((acc.consumedAmount / budgetAmount) * 1000) / 10 : 0;

    return {
      id: `mcs-${idx + 1}`,
      projectId: acc.projectId,
      siteId: acc.siteId,
      costCode: acc.costCode,
      boqItemId: acc.line.boqItemId,
      boqItemCode: acc.line.boqItemCode,
      boqDescription: acc.line.boqDescription,
      boqSection: acc.line.boqSection,
      unit: acc.line.unit,
      budgetQty,
      budgetAmount,
      boqRate,
      consumedQty: Math.round(acc.consumedQty * 100) / 100,
      consumedAmount: Math.round(acc.consumedAmount * 100) / 100,
      remainingQty: Math.round(remainingQty * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      varianceQtyPct,
      varianceAmountPct,
      status: deriveStatus(varianceAmountPct),
      approvalStatus: 'approved',
      lastUpdated: acc.lastDate,
      notes: 'Auto-synced from material issuances tagged to BOQ.',
      issuanceRefs: acc.refs,
      audit: [
        { at: acc.lastDate, action: 'Consumption rolled up from issued material notes', by: 'System' }
      ],
      attachments: []
    };
  });
}

function extraSeedRecords(): MaterialConsumptionRecord[] {
  const p2 = DEMO_PROJECTS[1]?.id ?? 'P-002';
  const s3 = DEMO_PROJECTS[1]?.sites[0]?.id ?? 'S-003';

  return [
    {
      id: 'mcs-wh-01',
      projectId: p2,
      siteId: s3,
      costCode: 'CIV-02',
      boqItemId: 'li-b2',
      boqItemCode: 'B2',
      boqDescription: 'RCC M25',
      boqSection: 'Concrete Work',
      unit: 'm³',
      budgetQty: 100,
      budgetAmount: 2_800_000,
      boqRate: 28000,
      consumedQty: 42,
      consumedAmount: 1_176_000,
      remainingQty: 58,
      remainingAmount: 1_624_000,
      varianceQtyPct: 42,
      varianceAmountPct: 42,
      status: 'on_track',
      approvalStatus: 'approved',
      lastUpdated: '2026-06-04',
      notes: 'Warehouse bay 2 — concrete package consumption.',
      issuanceRefs: [],
      audit: [{ at: '2026-06-04 10:00', action: 'Manual consumption baseline imported', by: 'Cost controller' }],
      attachments: []
    },
    {
      id: 'mcs-wh-02',
      projectId: p2,
      siteId: s3,
      costCode: 'STR-01',
      boqItemId: 'li-stl',
      boqItemCode: 'STL-001',
      boqDescription: 'Reinforcement Steel',
      boqSection: 'Reinforcement',
      unit: 'Kg',
      budgetQty: 12000,
      budgetAmount: 3_360_000,
      boqRate: 280,
      consumedQty: 10500,
      consumedAmount: 2_940_000,
      remainingQty: 1500,
      remainingAmount: 420_000,
      varianceQtyPct: 87.5,
      varianceAmountPct: 87.5,
      status: 'warning',
      approvalStatus: 'pending_approval',
      lastUpdated: '2026-06-05',
      notes: 'Pending QS verification — high consumption rate on steel.',
      issuanceRefs: [],
      audit: [
        { at: '2026-06-05 14:00', action: 'Submitted for QS approval', by: 'Cost controller' },
        { at: '2026-06-05 09:00', action: 'Consumption adjusted after site survey', by: 'Eng. James Okonkwo' }
      ],
      attachments: [
        { id: 'att-c1', name: 'Steel-consumption-survey.pdf', type: 'PDF', uploadedAt: '2026-06-05' }
      ]
    }
  ];
}

export function initialConsumptionRecords(): MaterialConsumptionRecord[] {
  const fromIssuances = buildFromIssuances(initialMaterialIssuances());
  const extras = extraSeedRecords();
  const keys = new Set(fromIssuances.map((r) => aggregateKey(r.projectId, r.boqItemId, r.costCode)));
  const merged = [...fromIssuances, ...extras.filter((e) => !keys.has(aggregateKey(e.projectId, e.boqItemId, e.costCode)))];
  return merged.sort((a, b) => b.varianceAmountPct - a.varianceAmountPct);
}

export function projectConsumptionSummary(records: MaterialConsumptionRecord[], projectId: string | 'all') {
  const filtered = projectId === 'all' ? records : records.filter((r) => r.projectId === projectId);
  const budget = filtered.reduce((s, r) => s + r.budgetAmount, 0);
  const consumed = filtered.reduce((s, r) => s + r.consumedAmount, 0);
  const remaining = budget - consumed;
  const variancePct = budget > 0 ? Math.round((consumed / budget) * 1000) / 10 : 0;
  const overBudgetLines = filtered.filter((r) => r.status === 'over_budget').length;
  return { budget, consumed, remaining, variancePct, lineCount: filtered.length, overBudgetLines };
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
