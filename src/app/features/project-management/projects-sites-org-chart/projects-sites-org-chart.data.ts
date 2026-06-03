import { TreeNode } from 'primeng/api';

export type MilestoneStatus = 'Not Started' | 'In Progress' | 'At Risk' | 'Completed' | 'Delayed';

export interface SiteMilestone {
  id: string;
  name: string;
  status: MilestoneStatus;
  targetDate?: string;
}

export interface ConstructionSite {
  id: string;
  name: string;
  location: string;
  progressPct: number;
  milestones: SiteMilestone[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  client: string;
  status: 'Active' | 'Planned' | 'Completed' | 'On Hold';
  sites: ConstructionSite[];
}

export const MILESTONE_STATUS_OPTIONS: { label: string; value: MilestoneStatus }[] = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'At Risk', value: 'At Risk' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Delayed', value: 'Delayed' }
];

export const DEMO_PROJECTS: ProjectSummary[] = [
  {
    id: 'P-001',
    name: 'Tower Block A — Main Contract',
    client: 'Al Noor Developments',
    status: 'Active',
    sites: [
      {
        id: 'S-001',
        name: 'Basement Works',
        location: 'Zone 3',
        progressPct: 85,
        milestones: [
          { id: 'M-001', name: 'Basement slab complete', status: 'In Progress', targetDate: '2026-05-30' },
          { id: 'M-002', name: 'Basement handover', status: 'Not Started', targetDate: '2026-06-15' }
        ]
      },
      {
        id: 'S-002',
        name: 'Superstructure',
        location: 'Zone 3',
        progressPct: 35,
        milestones: [
          { id: 'M-010', name: 'Level 5 structure complete', status: 'At Risk', targetDate: '2026-07-01' },
          { id: 'M-011', name: 'Topping out', status: 'Not Started', targetDate: '2026-09-30' }
        ]
      },
      {
        id: 'S-003',
        name: 'MEP & Finishes',
        location: 'Zone 3',
        progressPct: 10,
        milestones: [
          { id: 'M-020', name: 'MEP rough-in start', status: 'Not Started', targetDate: '2026-08-01' }
        ]
      }
    ]
  },
  {
    id: 'P-002',
    name: 'Warehouse Expansion — Phase 2',
    client: 'Gulf Logistics',
    status: 'Planned',
    sites: [
      {
        id: 'S-010',
        name: 'Site Setup',
        location: 'Industrial Area',
        progressPct: 0,
        milestones: [
          { id: 'M-100', name: 'Site establishment', status: 'Not Started', targetDate: '2026-07-15' }
        ]
      },
      {
        id: 'S-011',
        name: 'Steel Structure',
        location: 'Industrial Area',
        progressPct: 0,
        milestones: [
          { id: 'M-110', name: 'Steel erection start', status: 'Not Started', targetDate: '2026-09-01' }
        ]
      }
    ]
  },
  {
    id: 'P-003',
    name: 'Roadworks Package — Section C',
    client: 'City Municipality',
    status: 'Active',
    sites: [
      {
        id: 'S-020',
        name: 'Earthworks',
        location: 'KM 12–18',
        progressPct: 60,
        milestones: [
          { id: 'M-200', name: 'Earthworks complete', status: 'In Progress', targetDate: '2026-06-10' }
        ]
      },
      {
        id: 'S-021',
        name: 'Drainage',
        location: 'KM 12–18',
        progressPct: 40,
        milestones: [
          { id: 'M-210', name: 'Drainage testing', status: 'Not Started', targetDate: '2026-07-15' }
        ]
      },
      {
        id: 'S-022',
        name: 'Asphalt',
        location: 'KM 12–18',
        progressPct: 15,
        milestones: [
          { id: 'M-220', name: 'Final asphalt layer', status: 'Not Started', targetDate: '2026-08-30' }
        ]
      }
    ]
  },
  {
    id: 'P-004',
    name: 'Central Hospital — Wing B Retrofit',
    client: 'Ministry of Health',
    status: 'Active',
    sites: [
      {
        id: 'S-030',
        name: 'Demolition & Strip-out',
        location: 'Wing B — Level 1–3',
        progressPct: 70,
        milestones: [
          { id: 'M-300', name: 'Strip-out complete', status: 'In Progress', targetDate: '2026-05-25' }
        ]
      },
      {
        id: 'S-031',
        name: 'Medical MEP Fit-out',
        location: 'Wing B — Level 2 ICU',
        progressPct: 25,
        milestones: [
          { id: 'M-310', name: 'Medical gas certification', status: 'Not Started', targetDate: '2026-08-01' },
          { id: 'M-311', name: 'ICU handover', status: 'Not Started', targetDate: '2026-10-15' }
        ]
      }
    ]
  },
  {
    id: 'P-005',
    name: 'Marina Promenade & Boardwalk',
    client: 'Harbour Estates',
    status: 'On Hold',
    sites: [
      {
        id: 'S-040',
        name: 'Marine Piling',
        location: 'East Marina',
        progressPct: 20,
        milestones: [
          { id: 'M-400', name: 'Piling complete', status: 'Delayed', targetDate: '2026-06-30' }
        ]
      },
      {
        id: 'S-041',
        name: 'Boardwalk Structure',
        location: 'Waterfront promenade',
        progressPct: 5,
        milestones: [
          { id: 'M-410', name: 'Deck installation start', status: 'Not Started', targetDate: '2026-09-01' }
        ]
      },
      {
        id: 'S-042',
        name: 'Landscape & Lighting',
        location: 'Promenade edge',
        progressPct: 0,
        milestones: [
          { id: 'M-420', name: 'Final lighting commissioning', status: 'Not Started', targetDate: '2026-11-30' }
        ]
      }
    ]
  }
];

export interface MilestoneNodeItem {
  id: string;
  title: string;
  targetDate?: string;
  status: MilestoneStatus;
  showHeading: boolean;
}

/** One branch under the site: milestones listed vertically (equal items, not nested under each other). */
function buildMilestoneColumn(
  milestones: SiteMilestone[],
  projectId: string,
  siteId: string
): TreeNode[] {
  if (milestones.length === 0) {
    return [];
  }

  return [
    {
      expanded: true,
      type: 'milestones',
      styleClass: 'org-milestones-column',
      data: {
        projectId,
        siteId,
        items: milestones.map((m, index) => ({
          id: m.id,
          title: m.name,
          targetDate: m.targetDate,
          status: m.status,
          showHeading: index === 0
        }))
      }
    }
  ];
}

export interface SerializedOrgChartNode {
  type?: string;
  expanded?: boolean;
  styleClass?: string;
  data?: unknown;
  children?: SerializedOrgChartNode[];
}

/** JSON-safe tree passed to PrimeNG `p-organizationChart [value]`. */
export function serializeOrgChartNodes(nodes: TreeNode[]): SerializedOrgChartNode[] {
  return nodes.map((node) => {
    const serialized: SerializedOrgChartNode = {
      type: node.type,
      expanded: node.expanded,
      data: node.data
    };
    if (node.styleClass) {
      serialized.styleClass = node.styleClass;
    }
    if (node.children?.length) {
      serialized.children = serializeOrgChartNodes(node.children);
    }
    return serialized;
  });
}

export function buildProjectsSitesOrgChart(projects: ProjectSummary[]): TreeNode[] {
  return [
    {
      expanded: true,
      type: 'root',
      data: {
        title: 'Projects',
        subtitle: `${projects.length} total`
      },
      children: projects.map((p) => ({
        expanded: true,
        type: 'project',
        data: {
          id: p.id,
          title: p.name,
          subtitle: `${p.client} • ${p.status}`,
          status: p.status
        },
        children: p.sites.map((s) => ({
          expanded: true,
          type: 'site',
          data: {
            projectId: p.id,
            id: s.id,
            title: s.name,
            subtitle: s.location,
            progressPct: s.progressPct
          },
          children: buildMilestoneColumn(s.milestones, p.id, s.id)
        }))
      }))
    }
  ];
}
