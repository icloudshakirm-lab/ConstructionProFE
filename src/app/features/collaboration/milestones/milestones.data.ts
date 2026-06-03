export type MilestoneStatus = 'Not Started' | 'In Progress' | 'At Risk' | 'Completed' | 'Delayed';

export interface ContractMilestone {
  id: string;
  name: string;
  project: string;
  site: string;
  plannedDate: string;
  forecastDate: string;
  status: MilestoneStatus;
  owner: string;
}

export const DEMO_MILESTONES: ContractMilestone[] = [
  {
    id: 'ms-1',
    name: 'Basement slab complete',
    project: 'Tower Block A',
    site: 'Basement Works',
    plannedDate: '2026-05-30',
    forecastDate: '2026-06-02',
    status: 'In Progress',
    owner: 'Structure Lead'
  },
  {
    id: 'ms-2',
    name: 'Topping out',
    project: 'Tower Block A',
    site: 'Superstructure',
    plannedDate: '2026-09-30',
    forecastDate: '2026-10-15',
    status: 'Not Started',
    owner: 'Project Manager'
  },
  {
    id: 'ms-3',
    name: 'Earthworks complete',
    project: 'Roadworks Package C',
    site: 'Earthworks',
    plannedDate: '2026-06-10',
    forecastDate: '2026-06-10',
    status: 'In Progress',
    owner: 'Site Engineer'
  },
  {
    id: 'ms-4',
    name: 'ICU handover',
    project: 'Central Hospital Wing B',
    site: 'Medical MEP Fit-out',
    plannedDate: '2026-10-15',
    forecastDate: '2026-11-01',
    status: 'At Risk',
    owner: 'MEP Coordinator'
  },
  {
    id: 'ms-5',
    name: 'Piling complete',
    project: 'Marina Promenade',
    site: 'Marine Piling',
    plannedDate: '2026-06-30',
    forecastDate: '2026-07-20',
    status: 'Delayed',
    owner: 'Marine Subcontractor'
  }
];

export const MILESTONE_STATUS_OPTIONS: { label: string; value: MilestoneStatus }[] = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'At Risk', value: 'At Risk' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Delayed', value: 'Delayed' }
];
