/** Road / utility corridor construction progress shown on the GIS map. */
export type SiteProgressStatus =
  | 'survey_layout'
  | 'excavation'
  | 'refilled'
  | 'subbase_placed'
  | 'compaction_done'
  | 'compaction_test_passed'
  | 'pipe_welding_done'
  | 'pipe_laying_done'
  | 'pipe_pressure_test'
  | 'concrete_done'
  | 'asphalt_pavement'
  | 'road_reopened';

export interface SiteProgressDefinition {
  id: SiteProgressStatus;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  weight: number;
  /** Dashed line on map (e.g. planned vs completed). */
  dashArray?: string;
}

export const SITE_PROGRESS_STATUSES: readonly SiteProgressDefinition[] = [
  {
    id: 'survey_layout',
    label: 'Survey & layout',
    shortLabel: 'Survey',
    description: 'Survey stakes, alignment, and layout along the corridor.',
    color: '#64748b',
    weight: 4,
    dashArray: '4 6'
  },
  {
    id: 'excavation',
    label: 'Excavation (soil removed)',
    shortLabel: 'Excavation',
    description: 'Trench or road formation where soil has been excavated.',
    color: '#b45309',
    weight: 6
  },
  {
    id: 'refilled',
    label: 'Backfill / refilled',
    shortLabel: 'Backfill',
    description: 'Sections where trench or excavation has been backfilled.',
    color: '#ca8a04',
    weight: 5
  },
  {
    id: 'subbase_placed',
    label: 'Sub-base placed',
    shortLabel: 'Sub-base',
    description: 'Granular sub-base material placed and graded.',
    color: '#a16207',
    weight: 5
  },
  {
    id: 'compaction_done',
    label: 'Compaction done',
    shortLabel: 'Compaction',
    description: 'Compaction completed on fill or sub-base.',
    color: '#65a30d',
    weight: 5
  },
  {
    id: 'compaction_test_passed',
    label: 'Compaction test passed',
    shortLabel: 'Test passed',
    description: 'Compaction density testing approved.',
    color: '#15803d',
    weight: 6
  },
  {
    id: 'pipe_welding_done',
    label: 'Pipeline welding done',
    shortLabel: 'Welding',
    description: 'Pipe welding completed for this section.',
    color: '#7c3aed',
    weight: 5,
    dashArray: '8 6'
  },
  {
    id: 'pipe_laying_done',
    label: 'Pipe laying done',
    shortLabel: 'Pipe laid',
    description: 'Pipe installed and laid in trench.',
    color: '#2563eb',
    weight: 6
  },
  {
    id: 'pipe_pressure_test',
    label: 'Pipe pressure test',
    shortLabel: 'Pressure test',
    description: 'Hydrostatic / pressure testing completed.',
    color: '#0891b2',
    weight: 5,
    dashArray: '6 5'
  },
  {
    id: 'concrete_done',
    label: 'Concrete done',
    shortLabel: 'Concrete',
    description: 'Concrete encasement, thrust blocks, or structures.',
    color: '#475569',
    weight: 7
  },
  {
    id: 'asphalt_pavement',
    label: 'Asphalt / pavement',
    shortLabel: 'Asphalt',
    description: 'Asphalt or wearing course placed.',
    color: '#1e293b',
    weight: 6
  },
  {
    id: 'road_reopened',
    label: 'Road reopened',
    shortLabel: 'Reopened',
    description: 'Corridor restored and open to traffic.',
    color: '#16a34a',
    weight: 4
  }
] as const;

export const DEFAULT_SITE_PROGRESS: SiteProgressStatus = 'excavation';

export function getProgressDefinition(id: SiteProgressStatus): SiteProgressDefinition {
  return SITE_PROGRESS_STATUSES.find((s) => s.id === id) ?? SITE_PROGRESS_STATUSES[0];
}

export function parseProgressStatus(raw: unknown): SiteProgressStatus | undefined {
  if (typeof raw !== 'string') return undefined;
  return SITE_PROGRESS_STATUSES.some((s) => s.id === raw) ? (raw as SiteProgressStatus) : undefined;
}

export function initialLayerVisibility(): Record<SiteProgressStatus, boolean> {
  return SITE_PROGRESS_STATUSES.reduce(
    (acc, s) => {
      acc[s.id] = true;
      return acc;
    },
    {} as Record<SiteProgressStatus, boolean>
  );
}

export function emptyLayerCounts(): Record<SiteProgressStatus, number> {
  return SITE_PROGRESS_STATUSES.reduce(
    (acc, s) => {
      acc[s.id] = 0;
      return acc;
    },
    {} as Record<SiteProgressStatus, number>
  );
}
