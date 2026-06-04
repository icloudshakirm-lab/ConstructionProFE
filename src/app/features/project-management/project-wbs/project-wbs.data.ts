import { DEMO_PROJECTS } from '../projects-sites-org-chart/projects-sites-org-chart.data';
import {
  WbsPriority,
  dueDateFromMilestoneTarget
} from './project-wbs-priority';

export type { WbsPriority };
export { WBS_PRIORITY_OPTIONS } from './project-wbs-priority';

export interface ResponsiblePerson {
  id: string;
  label: string;
}

export interface WbsTask {
  id: string;
  name: string;
  responsiblePersonId: string | null;
  priority: WbsPriority;
  dueDate: string;
}

export interface WbsMilestone {
  id: string;
  name: string;
  targetDate?: string;
  priority: WbsPriority;
  tasks: WbsTask[];
}

export interface WbsSite {
  id: string;
  name: string;
  location: string;
  milestones: WbsMilestone[];
}

export interface ProjectWbs {
  projectId: string;
  projectName: string;
  sites: WbsSite[];
}

export const RESPONSIBLE_PERSON_OPTIONS: ResponsiblePerson[] = [
  { id: 'p-hassan', label: 'R. Hassan — Site Engineer' },
  { id: 'p-ahmed', label: 'K. Ahmed — Foreman (Civil)' },
  { id: 'p-ali', label: 'M. Ali — Site Engineer' },
  { id: 'p-patel', label: 'J. Patel — Project Engineer' },
  { id: 'p-siddiqui', label: 'N. Siddiqui — QA/QC Engineer' },
  { id: 'p-qureshi', label: 'F. Qureshi — Senior QC Inspector' },
  { id: 'p-rahman', label: 'S. Rahman — Superintendent' },
  { id: 'p-khan', label: 'A. Khan — MEP Coordinator' },
  { id: 'p-subcon', label: 'Subcontractor: Al Noor Concrete' },
  { id: 'p-mep', label: 'MEP Crew Lead' }
];

export const WBS_PROJECT_OPTIONS = [
  { label: '— Select project —', value: '' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

function defaultTasksForMilestone(
  milestoneId: string,
  milestoneName: string,
  targetDate?: string
): WbsTask[] {
  const defaults: [string, string | null, WbsPriority, number][] = [
    [`Mobilize & set out — ${milestoneName}`, 'p-hassan', 'high', -14],
    [`Execute works — ${milestoneName}`, null, 'critical', -3],
    [`Inspect & sign-off — ${milestoneName}`, 'p-siddiqui', 'medium', 0]
  ];
  return defaults.map(([name, responsiblePersonId, priority, dayOffset], i) => ({
    id: `${milestoneId}-T${i + 1}`,
    name,
    responsiblePersonId,
    priority,
    dueDate: dueDateFromMilestoneTarget(targetDate, dayOffset)
  }));
}

function milestonePriorityFromTarget(targetDate?: string): WbsPriority {
  if (!targetDate) return 'medium';
  const days = (new Date(targetDate + 'T00:00:00').getTime() - Date.now()) / 86400000;
  if (days < 14) return 'critical';
  if (days < 45) return 'high';
  if (days < 90) return 'medium';
  return 'low';
}

export function buildProjectWbs(projectId: string): ProjectWbs | null {
  const project = DEMO_PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;

  return {
    projectId: project.id,
    projectName: project.name,
    sites: project.sites.map((site) => ({
      id: site.id,
      name: site.name,
      location: site.location,
      milestones: site.milestones.map((ms) => ({
        id: ms.id,
        name: ms.name,
        targetDate: ms.targetDate,
        priority: milestonePriorityFromTarget(ms.targetDate),
        tasks: defaultTasksForMilestone(ms.id, ms.name, ms.targetDate)
      }))
    }))
  };
}

export function buildInitialWbsStore(): Record<string, ProjectWbs> {
  const store: Record<string, ProjectWbs> = {};
  for (const project of DEMO_PROJECTS) {
    const wbs = buildProjectWbs(project.id);
    if (wbs) store[project.id] = wbs;
  }
  return store;
}

export function responsibleLabel(personId: string | null): string {
  if (!personId) return '— Unassigned —';
  return RESPONSIBLE_PERSON_OPTIONS.find((p) => p.id === personId)?.label ?? personId;
}
