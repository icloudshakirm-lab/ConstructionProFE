export type StakeholderKind =
  | 'role'
  | 'contractor'
  | 'subcontractor'
  | 'consultant'
  | 'client'
  | 'supplier'
  | 'authority'
  | 'vendor'
  | 'labor'
  | 'finance';

export interface StakeholderEntity {
  id: string;
  label: string;
  kind: StakeholderKind;
  icon: string;
  detail?: string;
  /** Sub-contractors or team members under a main contractor / lead role */
  children?: StakeholderEntity[];
}

export interface StakeholderGroup {
  id: string;
  title: string;
  entities: StakeholderEntity[];
}

export const ALL_STAKEHOLDER_GROUP_IDS = [
  'leadership',
  'contractors',
  'consultants',
  'client',
  'commercial',
  'hseq',
  'authorities',
  'site-support',
  'finance'
] as const;

export interface ProjectOverviewDemo {
  id: string;
  name: string;
  client: string;
  contractRef: string;
  location: string;
  status: 'Active' | 'Planned' | 'Completed' | 'On Hold';
}

export const DEMO_OVERVIEW_PROJECTS: ProjectOverviewDemo[] = [
  {
    id: 'P-001',
    name: 'Tower Block A — Main Contract',
    client: 'Al Noor Developments',
    contractRef: 'MC-2026-0142',
    location: 'Zone 3 — Downtown',
    status: 'Active'
  },
  {
    id: 'P-002',
    name: 'Warehouse Expansion — Phase 2',
    client: 'Gulf Logistics',
    contractRef: 'MC-2026-0198',
    location: 'Industrial Area — Plot 12',
    status: 'Planned'
  },
  {
    id: 'P-003',
    name: 'Roadworks Package — Section C',
    client: 'City Municipality',
    contractRef: 'RW-2026-0087',
    location: 'KM 12–18 Highway Corridor',
    status: 'Active'
  },
  {
    id: 'P-004',
    name: 'Central Hospital — Wing B Retrofit',
    client: 'Ministry of Health',
    contractRef: 'HC-2026-0031',
    location: 'Medical District — Block 4',
    status: 'Active'
  },
  {
    id: 'P-005',
    name: 'Marina Promenade & Boardwalk',
    client: 'Harbour Estates',
    contractRef: 'MW-2026-0155',
    location: 'East Marina — Waterfront',
    status: 'On Hold'
  }
];

import {
  buildStakeholdersMap,
  generateStakeholderGroupsForProject
} from './project-overview.stakeholders';

const STAKEHOLDERS_BY_PROJECT = buildStakeholdersMap(DEMO_OVERVIEW_PROJECTS);

export function getStakeholderGroupsForProject(projectId: string): StakeholderGroup[] {
  const project = DEMO_OVERVIEW_PROJECTS.find((p) => p.id === projectId);
  if (project) {
    return STAKEHOLDERS_BY_PROJECT[projectId] ?? generateStakeholderGroupsForProject(project);
  }
  return STAKEHOLDERS_BY_PROJECT[DEMO_OVERVIEW_PROJECTS[0]!.id];
}

export interface DiagramGroupLayout extends StakeholderGroup {
  xPct: number;
  yPct: number;
  anchorX: number;
  anchorY: number;
  angleRad: number;
}

export interface DiagramConnector {
  id: string;
  /** SVG path `d` — curved / orthogonal (draw.io style) */
  path: string;
  variant?: 'hub' | 'trade';
}

const CENTER = 50;
const GROUP_RADIUS_PCT = 38;
const HUB_EDGE_RADIUS = 7;
const GROUP_EDGE_INSET = 0.92;

export function layoutStakeholderGroups(groups: StakeholderGroup[]): DiagramGroupLayout[] {
  const n = groups.length;
  if (n === 0) return [];

  return groups.map((group, index) => {
    const angleRad = -Math.PI / 2 + (2 * Math.PI * index) / n;
    const xPct = CENTER + GROUP_RADIUS_PCT * Math.cos(angleRad);
    const yPct = CENTER + GROUP_RADIUS_PCT * Math.sin(angleRad);
    const anchorX = CENTER + GROUP_RADIUS_PCT * GROUP_EDGE_INSET * Math.cos(angleRad);
    const anchorY = CENTER + GROUP_RADIUS_PCT * GROUP_EDGE_INSET * Math.sin(angleRad);
    return { ...group, xPct, yPct, anchorX, anchorY, angleRad };
  });
}

/** Hub perimeter point toward a group (connector start). */
export function hubEdgePoint(angleRad: number): { x: number; y: number } {
  return {
    x: CENTER + HUB_EDGE_RADIUS * Math.cos(angleRad),
    y: CENTER + HUB_EDGE_RADIUS * Math.sin(angleRad)
  };
}

/**
 * Draw.io–style bent connector: smooth cubic curve (curved edge) with optional elbow variant.
 * Default uses a slight S-curve so lines read clearly on a radial layout.
 */
export function buildBentConnectorPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: 'curved' | 'orthogonal' = 'curved'
): string {
  if (style === 'orthogonal') {
    return buildOrthogonalBentPath(x1, y1, x2, y2);
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const bend = Math.min(0.42, 0.18 + dist * 0.004);
  const nx = -dy / dist;
  const ny = dx / dist;
  const offset = dist * 0.14;

  const c1x = x1 + dx * bend + nx * offset;
  const c1y = y1 + dy * bend + ny * offset;
  const c2x = x1 + dx * (1 - bend) + nx * offset * 0.65;
  const c2y = y1 + dy * (1 - bend) + ny * offset * 0.65;

  return `M ${x1} ${y1} C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
}

/** Right-angle routing with one elbow (draw.io orthogonal). */
export function buildOrthogonalBentPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dx) < 0.3 || Math.abs(dy) < 0.3) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = x1 + dx * 0.58;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }

  const my = y1 + dy * 0.58;
  return `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`;
}

export function buildGroupConnectors(
  layouts: DiagramGroupLayout[],
  style: 'curved' | 'orthogonal' = 'curved'
): DiagramConnector[] {
  return layouts.map((g) => {
    const start = hubEdgePoint(g.angleRad);
    return {
      id: g.id,
      path: buildBentConnectorPath(start.x, start.y, g.anchorX, g.anchorY, style)
    };
  });
}

/** Small bent link from contractor to each sub-contractor (draw.io nested edge). */
export function buildChildConnectorPath(index: number, total: number): string {
  const spread = Math.min(total, 6);
  const t = spread === 1 ? 0.5 : index / (spread - 1);
  const x1 = 12;
  const y1 = 4;
  const x2 = 6 + t * 88;
  const y2 = 22;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} Q ${mx} ${y1 + 4} ${x2} ${y2}`;
}

export function buildOverviewDiagramPayload(
  project: ProjectOverviewDemo,
  groups: StakeholderGroup[]
): Record<string, unknown> {
  return {
    component: 'project-overview-hub-diagram',
    layout: 'radial — project center, stakeholder groups on ring',
    connectorStyle: 'curved | orthogonal (draw.io style bent paths with arrowheads)',
    project,
    groups,
    entityKinds: [
      'role',
      'contractor',
      'subcontractor',
      'consultant',
      'client',
      'supplier',
      'authority',
      'vendor',
      'labor',
      'finance'
    ],
    generation: 'Seeded per project id — groups/entities vary (e.g. finance may be omitted)',
    omittedGroupIds: ALL_STAKEHOLDER_GROUP_IDS.filter(
      (id) => !groups.some((g) => g.id === id)
    ),
    notes: 'Contractors may include child sub-contractors (trades).'
  };
}
