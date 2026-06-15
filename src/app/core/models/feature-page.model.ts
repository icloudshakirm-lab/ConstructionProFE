export type FeaturePageComponent =
  | 'gantt-chart'
  | 'projects-sites-org-chart'
  | 'project-overview'
  | 'drawing-viewer'
  | 'notes'
  | 'todo'
  | 'milestones-page'
  | 'messages'
  | 'boq-creation'
  | 'boq-revisions'
  | 'qa-qc-inspections'
  | 'sites-map'
  | 'project-gis-planner'
  | 'site-status-gis'
  | 'project-wbs'
  | 'gps-tracking'
  | 'vehicle-tracking'
  | 'projects-register'
  | 'sites-management'
  | 'approval-workflows'
  | 'employee-records'
  | 'hr-attendance'
  | 'payroll'
  | 'partners-directory'
  | 'daily-progress'
  | 'bid-planning'
  | 'bids-register'
  | 'material-issuance';

export interface FeaturePage {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlights?: string[];
  /** When set, loads a dedicated screen instead of the generic placeholder. */
  component?: FeaturePageComponent;
}

export interface FeatureModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  routePath: string;
  badge?: string;
  pages: FeaturePage[];
}
