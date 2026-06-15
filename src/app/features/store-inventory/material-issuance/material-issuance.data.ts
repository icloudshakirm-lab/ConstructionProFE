import { DEMO_BOQ_SECTIONS } from '../../boq-billing/boq-creation/boq-creation.data';
import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type IssuanceStatus = 'draft' | 'pending_approval' | 'issued' | 'cancelled';
export type IssuanceApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface IssuanceAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface IssuanceAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

/** Each line is tagged to a BOQ item for budget and consumption tracking. */
export interface MaterialIssueLine {
  id: string;
  boqItemId: string;
  boqItemCode: string;
  boqDescription: string;
  boqSection: string;
  materialCode: string;
  materialName: string;
  unit: string;
  issuedQty: number;
  unitRate: number;
  /** BOQ line budget qty (from contract BOQ). */
  boqBudgetQty: number;
  /** BOQ line budget amount (qty × BOQ rate). */
  boqBudgetAmount: number;
}

export interface MaterialIssuanceRecord {
  id: string;
  issueNumber: string;
  issueDate: string;
  projectId: string;
  siteId: string;
  warehouse: string;
  costCode: string;
  requisitionRef: string;
  requestedBy: string;
  issuedBy: string;
  status: IssuanceStatus;
  approvalStatus: IssuanceApprovalStatus;
  remarks: string;
  lines: MaterialIssueLine[];
  audit: IssuanceAuditEntry[];
  attachments: IssuanceAttachment[];
}

export type IssuanceFormValue = Pick<
  MaterialIssuanceRecord,
  | 'issueNumber'
  | 'issueDate'
  | 'projectId'
  | 'siteId'
  | 'warehouse'
  | 'costCode'
  | 'requisitionRef'
  | 'requestedBy'
  | 'remarks'
>;

export const ISSUANCE_STATUS_OPTIONS: { label: string; value: IssuanceStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Issued', value: 'issued' },
  { label: 'Cancelled', value: 'cancelled' }
];

export const ISSUANCE_FORM_STATUS_OPTIONS = ISSUANCE_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const ISSUANCE_APPROVAL_FILTER_OPTIONS: { label: string; value: IssuanceApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const WAREHOUSE_OPTIONS = [
  { label: 'Central store — HO', value: 'Central store — HO' },
  { label: 'Site store — Basement Works', value: 'Site store — Basement Works' },
  { label: 'Site store — Superstructure', value: 'Site store — Superstructure' },
  { label: 'Site store — Warehouse Bay 2', value: 'Site store — Warehouse Bay 2' }
];

export const COST_CODE_OPTIONS = [
  { label: 'CIV-01 — Substructure', value: 'CIV-01' },
  { label: 'CIV-02 — Superstructure', value: 'CIV-02' },
  { label: 'STR-01 — Reinforcement', value: 'STR-01' },
  { label: 'MEP-01 — Electrical', value: 'MEP-01' },
  { label: 'MEP-02 — Mechanical', value: 'MEP-02' },
  { label: 'FIN-01 — Finishes', value: 'FIN-01' }
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

export interface BoqLineOption {
  label: string;
  value: string;
  itemCode: string;
  description: string;
  section: string;
  unit: string;
  budgetQty: number;
  budgetAmount: number;
  boqRate: number;
}

export function boqLineOptions(): BoqLineOption[] {
  return DEMO_BOQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      label: `${item.itemCode} — ${item.description}`,
      value: item.id,
      itemCode: item.itemCode,
      description: item.description,
      section: section.title,
      unit: item.unit,
      budgetQty: item.qty,
      budgetAmount: item.qty * item.rate,
      boqRate: item.rate
    }))
  );
}

export const MATERIAL_CATALOG: { code: string; name: string; unit: string; typicalRate: number; boqItemId: string }[] = [
  { code: 'MAT-CEM-50', name: 'OPC Cement 50kg', unit: 'Bag', typicalRate: 18, boqItemId: 'li-b1' },
  { code: 'MAT-STL-12', name: 'Rebar 12mm', unit: 'Kg', typicalRate: 2.85, boqItemId: 'li-stl' },
  { code: 'MAT-STL-16', name: 'Rebar 16mm', unit: 'Kg', typicalRate: 2.9, boqItemId: 'li-stl' },
  { code: 'MAT-AGG-20', name: '20mm Aggregate', unit: 'm³', typicalRate: 95, boqItemId: 'li-b2' },
  { code: 'MAT-SAND', name: 'Washed Sand', unit: 'm³', typicalRate: 75, boqItemId: 'li-b1' },
  { code: 'MAT-FORM', name: 'Plywood Formwork', unit: 'm²', typicalRate: 42, boqItemId: 'li-rcc' },
  { code: 'MAT-CBL-4C', name: '4C Power Cable', unit: 'Rm', typicalRate: 28, boqItemId: 'li-a2' },
  { code: 'MAT-DB-400', name: 'Distribution Board 400A', unit: 'Nos', typicalRate: 3200, boqItemId: 'li-1' }
];

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

export function expectedBoqForMaterial(materialCode: string): BoqLineOption | undefined {
  const mat = MATERIAL_CATALOG.find((m) => m.code === materialCode);
  if (!mat) return undefined;
  return boqLineOptions().find((o) => o.value === mat.boqItemId);
}

export function materialMatchesBoqItem(materialCode: string, boqItemId: string): boolean {
  const mat = MATERIAL_CATALOG.find((m) => m.code === materialCode);
  return !!mat && mat.boqItemId === boqItemId;
}

export function materialBoqMismatchDetail(materialCode: string, boqItemId: string): string | null {
  if (!materialCode || !boqItemId) return null;
  if (materialMatchesBoqItem(materialCode, boqItemId)) return null;
  const expected = expectedBoqForMaterial(materialCode);
  const selected = boqLineOptions().find((o) => o.value === boqItemId);
  if (!expected || !selected) return null;
  return `Material item code (${materialCode}) must match BOQ item code ${expected.itemCode}. You selected ${selected.itemCode}.`;
}

export function lineAmount(line: MaterialIssueLine): number {
  return Math.round(line.issuedQty * line.unitRate * 100) / 100;
}

export function totalIssuanceAmount(record: MaterialIssuanceRecord): number {
  return record.lines.reduce((sum, l) => sum + lineAmount(l), 0);
}

export interface BoqConsumptionSummary {
  boqItemId: string;
  boqItemCode: string;
  boqDescription: string;
  budgetAmount: number;
  consumedAmount: number;
  thisIssuanceAmount: number;
  remainingAmount: number;
  variancePct: number;
}

export function boqConsumptionForRecord(
  record: MaterialIssuanceRecord,
  allRecords: MaterialIssuanceRecord[]
): BoqConsumptionSummary[] {
  const consumedByBoq = new Map<string, number>();

  for (const r of allRecords) {
    if (r.id === record.id) continue;
    if (r.status !== 'issued' && r.approvalStatus !== 'approved') continue;
    for (const line of r.lines) {
      consumedByBoq.set(line.boqItemId, (consumedByBoq.get(line.boqItemId) ?? 0) + lineAmount(line));
    }
  }

  const byBoq = new Map<string, BoqConsumptionSummary>();

  for (const line of record.lines) {
    const prev = consumedByBoq.get(line.boqItemId) ?? 0;
    const thisAmt = lineAmount(line);
    const existing = byBoq.get(line.boqItemId);
    if (existing) {
      existing.thisIssuanceAmount += thisAmt;
    } else {
      const consumed = prev;
      const totalAfter = consumed + thisAmt;
      const remaining = line.boqBudgetAmount - totalAfter;
      const variancePct =
        line.boqBudgetAmount > 0 ? Math.round(((totalAfter - line.boqBudgetAmount) / line.boqBudgetAmount) * 1000) / 10 : 0;
      byBoq.set(line.boqItemId, {
        boqItemId: line.boqItemId,
        boqItemCode: line.boqItemCode,
        boqDescription: line.boqDescription,
        budgetAmount: line.boqBudgetAmount,
        consumedAmount: consumed,
        thisIssuanceAmount: thisAmt,
        remainingAmount: remaining,
        variancePct
      });
    }
  }

  return [...byBoq.values()].map((s) => {
    const totalAfter = s.consumedAmount + s.thisIssuanceAmount;
    return {
      ...s,
      remainingAmount: s.budgetAmount - totalAfter,
      variancePct:
        s.budgetAmount > 0 ? Math.round(((totalAfter - s.budgetAmount) / s.budgetAmount) * 1000) / 10 : 0
    };
  });
}

export function newIssuanceId(): string {
  return `mis-${Date.now().toString(36).slice(-6)}`;
}

export function newLineId(): string {
  return `mln-${Date.now().toString(36).slice(-6)}`;
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

export function issuanceStatusSeverity(
  status: IssuanceStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'issued':
      return 'success';
    case 'pending_approval':
      return 'warn';
    case 'draft':
      return 'secondary';
    case 'cancelled':
      return 'danger';
  }
}

export function approvalStatusLabel(status: IssuanceApprovalStatus): string {
  const labels: Record<IssuanceApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function approvalStatusSeverity(
  status: IssuanceApprovalStatus
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

export function canSubmitForApproval(r: MaterialIssuanceRecord): boolean {
  return (r.approvalStatus === 'draft' || r.approvalStatus === 'rejected') && r.lines.length > 0;
}

export function canApproveOrReject(r: MaterialIssuanceRecord): boolean {
  return r.approvalStatus === 'pending_approval';
}

export function canIssue(r: MaterialIssuanceRecord): boolean {
  return r.approvalStatus === 'approved' && r.status !== 'issued' && r.status !== 'cancelled';
}

export function varianceSeverity(pct: number): 'success' | 'warn' | 'danger' {
  if (pct <= 0) return 'success';
  if (pct <= 10) return 'warn';
  return 'danger';
}

function seedIssuance(
  partial: Omit<MaterialIssuanceRecord, 'audit' | 'attachments'> & {
    audit?: IssuanceAuditEntry[];
    attachments?: IssuanceAttachment[];
  }
): MaterialIssuanceRecord {
  return {
    audit: [{ at: '2026-06-01 08:00', action: 'Issuance note created', by: partial.requestedBy }],
    attachments: [],
    ...partial
  };
}

export function initialMaterialIssuances(): MaterialIssuanceRecord[] {
  const p1 = DEMO_PROJECTS[0]?.id ?? 'P-001';
  const s1 = DEMO_PROJECTS[0]?.sites[0]?.id ?? 'S-001';
  const s2 = DEMO_PROJECTS[0]?.sites[1]?.id ?? 'S-002';

  return [
    seedIssuance({
      id: 'mis-001',
      issueNumber: 'MIN-2026-0142',
      issueDate: '2026-06-01',
      projectId: p1,
      siteId: s1,
      warehouse: 'Site store — Basement Works',
      costCode: 'STR-01',
      requisitionRef: 'SR-2026-089',
      requestedBy: 'Eng. Ravi Menon',
      issuedBy: 'Store keeper — Khalid',
      status: 'issued',
      approvalStatus: 'approved',
      remarks: 'Basement slab rebar issue — Zone B',
      lines: [
        {
          id: 'mln-01',
          boqItemId: 'li-stl',
          boqItemCode: 'STL-001',
          boqDescription: 'Reinforcement Steel',
          boqSection: 'Reinforcement',
          materialCode: 'MAT-STL-16',
          materialName: 'Rebar 16mm',
          unit: 'Kg',
          issuedQty: 4200,
          unitRate: 2.9,
          boqBudgetQty: 12000,
          boqBudgetAmount: 3_360_000
        },
        {
          id: 'mln-02',
          boqItemId: 'li-stl',
          boqItemCode: 'STL-001',
          boqDescription: 'Reinforcement Steel',
          boqSection: 'Reinforcement',
          materialCode: 'MAT-STL-12',
          materialName: 'Rebar 12mm',
          unit: 'Kg',
          issuedQty: 1800,
          unitRate: 2.85,
          boqBudgetQty: 12000,
          boqBudgetAmount: 3_360_000
        }
      ],
      audit: [
        { at: '2026-06-01 14:30', action: 'Materials issued to site — BOQ STR-01 tagged', by: 'Store keeper — Khalid' },
        { at: '2026-06-01 11:00', action: 'Issuance approved by site superintendent', by: 'Ahmed Al Mansoori' },
        { at: '2026-06-01 08:00', action: 'Issuance note created', by: 'Eng. Ravi Menon' }
      ],
      attachments: [{ id: 'att-01', name: 'Delivery-challan-MIN-0142.pdf', type: 'PDF', uploadedAt: '2026-06-01' }]
    }),
    seedIssuance({
      id: 'mis-002',
      issueNumber: 'MIN-2026-0156',
      issueDate: '2026-06-03',
      projectId: p1,
      siteId: s1,
      warehouse: 'Central store — HO',
      costCode: 'CIV-01',
      requisitionRef: 'SR-2026-102',
      requestedBy: 'Eng. Sara Khan',
      issuedBy: '',
      status: 'pending_approval',
      approvalStatus: 'pending_approval',
      remarks: 'Concrete works — basement pour batch 4',
      lines: [
        {
          id: 'mln-03',
          boqItemId: 'li-b1',
          boqItemCode: 'B1',
          boqDescription: 'PCC 1:4:8',
          boqSection: 'Concrete Work',
          materialCode: 'MAT-CEM-50',
          materialName: 'OPC Cement 50kg',
          unit: 'Bag',
          issuedQty: 480,
          unitRate: 18,
          boqBudgetQty: 50,
          boqBudgetAmount: 750_000
        },
        {
          id: 'mln-04',
          boqItemId: 'li-b1',
          boqItemCode: 'B1',
          boqDescription: 'PCC 1:4:8',
          boqSection: 'Concrete Work',
          materialCode: 'MAT-SAND',
          materialName: 'Washed Sand',
          unit: 'm³',
          issuedQty: 22,
          unitRate: 75,
          boqBudgetQty: 50,
          boqBudgetAmount: 750_000
        }
      ],
      audit: [
        { at: '2026-06-03 09:15', action: 'Submitted for store approval — BOQ CIV-01 / B1 tagged', by: 'Eng. Sara Khan' }
      ]
    }),
    seedIssuance({
      id: 'mis-003',
      issueNumber: 'MIN-2026-0161',
      issueDate: '2026-06-05',
      projectId: p1,
      siteId: s2,
      warehouse: 'Site store — Superstructure',
      costCode: 'MEP-01',
      requisitionRef: 'SR-2026-118',
      requestedBy: 'Eng. James Okonkwo',
      issuedBy: '',
      status: 'draft',
      approvalStatus: 'draft',
      remarks: 'Electrical rough-in L3–L5',
      lines: [
        {
          id: 'mln-05',
          boqItemId: 'li-a2',
          boqItemCode: 'A2',
          boqDescription: 'Excavation',
          boqSection: 'Earth Work',
          materialCode: 'MAT-CBL-4C',
          materialName: '4C Power Cable',
          unit: 'Rm',
          issuedQty: 850,
          unitRate: 28,
          boqBudgetQty: 500,
          boqBudgetAmount: 225_000
        }
      ]
    }),
    seedIssuance({
      id: 'mis-004',
      issueNumber: 'MIN-2026-0128',
      issueDate: '2026-05-28',
      projectId: p1,
      siteId: s1,
      warehouse: 'Site store — Basement Works',
      costCode: 'CIV-02',
      requisitionRef: 'SR-2026-075',
      requestedBy: 'Eng. Ravi Menon',
      issuedBy: 'Store keeper — Khalid',
      status: 'issued',
      approvalStatus: 'approved',
      remarks: 'Formwork for column stubs P1',
      lines: [
        {
          id: 'mln-06',
          boqItemId: 'li-rcc',
          boqItemCode: 'RCC-001',
          boqDescription: 'Reinforced Concrete',
          boqSection: 'Columns',
          materialCode: 'MAT-FORM',
          materialName: 'Plywood Formwork',
          unit: 'm²',
          issuedQty: 320,
          unitRate: 42,
          boqBudgetQty: 80,
          boqBudgetAmount: 2_240_000
        }
      ],
      audit: [
        { at: '2026-05-28 15:00', action: 'Materials issued', by: 'Store keeper — Khalid' },
        { at: '2026-05-28 10:00', action: 'Approved', by: 'Ahmed Al Mansoori' }
      ]
    })
  ];
}
