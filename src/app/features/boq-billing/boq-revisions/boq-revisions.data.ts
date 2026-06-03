import { BOQ_PROJECTS, BoqProjectOption, formatMoney, roundMoney } from '../boq-creation/boq-creation.data';

export type BoqRevisionStatus = 'draft' | 'pending' | 'approved' | 'superseded';

export interface BoqRevisionLineSnapshot {
  sectionCode: string;
  itemCode: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

function snapshotAmount(line: BoqRevisionLineSnapshot): number {
  return roundMoney(line.qty * line.rate);
}

export interface BoqRevision {
  id: string;
  projectId: string;
  revisionNo: string;
  title: string;
  status: BoqRevisionStatus;
  createdAt: string;
  createdBy: string;
  effectiveDate: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  changeSummary: string;
  lines: BoqRevisionLineSnapshot[];
}

export type BoqDiffChange = 'added' | 'removed' | 'modified' | 'unchanged';

export interface BoqLineDiffRow {
  key: string;
  sectionCode: string;
  itemCode: string;
  description: string;
  unit: string;
  change: BoqDiffChange;
  qtyFrom?: number;
  qtyTo?: number;
  rateFrom?: number;
  rateTo?: number;
  amountFrom?: number;
  amountTo?: number;
  amountDelta: number;
}

export { BOQ_PROJECTS, formatMoney };
export type { BoqProjectOption };

export const REVISION_STATUS_LABELS: Record<BoqRevisionStatus, string> = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved for billing',
  superseded: 'Superseded'
};

function snap(
  sectionCode: string,
  itemCode: string,
  description: string,
  unit: string,
  qty: number,
  rate: number
): BoqRevisionLineSnapshot {
  return { sectionCode, itemCode, description, unit, qty, rate };
}

function revisionTotal(lines: BoqRevisionLineSnapshot[]): number {
  return roundMoney(lines.reduce((sum, l) => sum + snapshotAmount(l), 0));
}

const REV_0_LINES: BoqRevisionLineSnapshot[] = [
  snap('A', 'A1', 'Site Clearance', 'm²', 1000, 50),
  snap('A', 'A2', 'Excavation', 'm³', 500, 450),
  snap('B', 'B1', 'PCC 1:4:8', 'm³', 50, 15000),
  snap('B', 'B2', 'RCC M25', 'm³', 100, 28000),
  snap('CIV-EXC', 'EXC-001', 'Earth Excavation', 'm³', 500, 450),
  snap('CIV-FND', 'CON-001', 'Plain Cement Concrete', 'm³', 120, 15000),
  snap('STR-COL', 'RCC-001', 'Reinforced Concrete', 'm³', 80, 28000),
  snap('STR-STL', 'STL-001', 'Reinforcement Steel', 'Kg', 12000, 280)
];

const REV_1_LINES: BoqRevisionLineSnapshot[] = [
  ...REV_0_LINES.filter((l) => l.itemCode !== 'A2' && l.itemCode !== 'B2'),
  snap('A', 'A2', 'Excavation', 'm³', 520, 450),
  snap('B', 'B2', 'RCC M25', 'm³', 95, 28000),
  snap('ELC', 'ELC-001', 'Electrical Wiring', 'Rm', 2400, 120)
];

const REV_2_LINES: BoqRevisionLineSnapshot[] = REV_1_LINES.map((l) => {
  if (l.itemCode === 'B1') return { ...l, rate: 15500 };
  if (l.itemCode === 'B2') return { ...l, rate: 29200 };
  if (l.itemCode === 'CON-001') return { ...l, rate: 15400 };
  return l;
});

export const DEMO_BOQ_REVISIONS: BoqRevision[] = [
  {
    id: 'rev-ta-0',
    projectId: 'tower-a',
    revisionNo: 'R0',
    title: 'Original Contract BOQ',
    status: 'superseded',
    createdAt: '2025-01-15T10:00:00',
    createdBy: 'A. Khan — Estimator',
    effectiveDate: '2025-02-01',
    approvedAt: '2025-01-28T14:30:00',
    approvedBy: 'S. Rahman — Commercial Manager',
    changeSummary: 'Baseline BOQ at contract award.',
    lines: REV_0_LINES
  },
  {
    id: 'rev-ta-1',
    projectId: 'tower-a',
    revisionNo: 'R1',
    title: 'VO-01 — Measured quantity adjustment',
    status: 'approved',
    createdAt: '2025-04-10T09:15:00',
    createdBy: 'A. Khan — Estimator',
    effectiveDate: '2025-04-20',
    approvedAt: '2025-04-18T11:00:00',
    approvedBy: 'S. Rahman — Commercial Manager',
    changeSummary: 'A2 excavation +20 m³; B2 RCC −5 m³; provisional sum for electrical wiring.',
    lines: REV_1_LINES
  },
  {
    id: 'rev-ta-2',
    projectId: 'tower-a',
    revisionNo: 'R2',
    title: 'Rate escalation — concrete & PCC',
    status: 'pending',
    createdAt: '2025-06-01T16:45:00',
    createdBy: 'M. Ali — QS',
    effectiveDate: null,
    approvedAt: null,
    approvedBy: null,
    changeSummary: 'Index-linked rate adjustment on PCC, RCC M25, and foundation concrete.',
    lines: REV_2_LINES
  },
  {
    id: 'rev-ta-3',
    projectId: 'tower-a',
    revisionNo: 'R3',
    title: 'VO-12 — Additional earthing (draft)',
    status: 'draft',
    createdAt: '2025-06-03T08:20:00',
    createdBy: 'M. Ali — QS',
    effectiveDate: null,
    approvedAt: null,
    approvedBy: null,
    changeSummary: 'New earthing items under electrical — not yet submitted.',
    lines: [
      ...REV_2_LINES,
      snap('ELC', 'MEC-001', 'DB Installation', 'Nos', 4, 8500)
    ]
  },
  {
    id: 'rev-wh-0',
    projectId: 'warehouse-p2',
    revisionNo: 'R0',
    title: 'Phase 2 — Tender BOQ',
    status: 'approved',
    createdAt: '2025-03-01T12:00:00',
    createdBy: 'J. Patel — Estimator',
    effectiveDate: '2025-03-15',
    approvedAt: '2025-03-10T09:00:00',
    approvedBy: 'S. Rahman — Commercial Manager',
    changeSummary: 'Approved tender BOQ for warehouse expansion.',
    lines: [
      snap('A', 'A1', 'Site Clearance', 'm²', 2200, 48),
      snap('B', 'B2', 'RCC M25', 'm³', 180, 27500)
    ]
  },
  {
    id: 'rev-wh-1',
    projectId: 'warehouse-p2',
    revisionNo: 'R1',
    title: 'Design change — slab thickness',
    status: 'pending',
    createdAt: '2025-05-20T10:30:00',
    createdBy: 'J. Patel — Estimator',
    effectiveDate: null,
    approvedAt: null,
    approvedBy: null,
    changeSummary: 'RCC quantity increase following structural revision.',
    lines: [
      snap('A', 'A1', 'Site Clearance', 'm²', 2200, 48),
      snap('B', 'B2', 'RCC M25', 'm³', 205, 27500)
    ]
  }
];

export function revisionGrandTotal(revision: BoqRevision): number {
  return revisionTotal(revision.lines);
}

export function revisionDelta(revision: BoqRevision, previous: BoqRevision | null): number {
  const current = revisionGrandTotal(revision);
  if (!previous) return current;
  return roundMoney(current - revisionGrandTotal(previous));
}

export function lineKey(line: BoqRevisionLineSnapshot): string {
  return `${line.sectionCode}|${line.itemCode}`;
}

export function buildBoqDiff(
  from: BoqRevision,
  to: BoqRevision,
  includeUnchanged: boolean
): BoqLineDiffRow[] {
  const mapFrom = new Map(from.lines.map((l) => [lineKey(l), l]));
  const mapTo = new Map(to.lines.map((l) => [lineKey(l), l]));
  const keys = new Set([...mapFrom.keys(), ...mapTo.keys()]);
  const rows: BoqLineDiffRow[] = [];

  for (const key of [...keys].sort()) {
    const a = mapFrom.get(key);
    const b = mapTo.get(key);

    if (!a && b) {
      rows.push({
        key,
        sectionCode: b.sectionCode,
        itemCode: b.itemCode,
        description: b.description,
        unit: b.unit,
        change: 'added',
        qtyTo: b.qty,
        rateTo: b.rate,
        amountTo: snapshotAmount(b),
        amountDelta: snapshotAmount(b)
      });
      continue;
    }

    if (a && !b) {
      rows.push({
        key,
        sectionCode: a.sectionCode,
        itemCode: a.itemCode,
        description: a.description,
        unit: a.unit,
        change: 'removed',
        qtyFrom: a.qty,
        rateFrom: a.rate,
        amountFrom: snapshotAmount(a),
        amountDelta: -snapshotAmount(a)
      });
      continue;
    }

    if (a && b) {
      const amountFrom = snapshotAmount(a);
      const amountTo = snapshotAmount(b);
      const changed = a.qty !== b.qty || a.rate !== b.rate || a.description !== b.description;
      const change: BoqDiffChange = changed ? 'modified' : 'unchanged';
      if (!includeUnchanged && !changed) continue;

      rows.push({
        key,
        sectionCode: b.sectionCode,
        itemCode: b.itemCode,
        description: b.description,
        unit: b.unit,
        change,
        qtyFrom: a.qty,
        qtyTo: b.qty,
        rateFrom: a.rate,
        rateTo: b.rate,
        amountFrom,
        amountTo,
        amountDelta: roundMoney(amountTo - amountFrom)
      });
    }
  }

  return rows;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
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
