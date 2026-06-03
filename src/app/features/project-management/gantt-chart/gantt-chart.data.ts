import Gantt from 'frappe-gantt';

/** Sample construction schedule for demo / POC. */
export const CONSTRUCTION_GANTT_TASKS: Gantt.Task[] = [
  {
    id: 'mobilization',
    name: 'Site Mobilization',
    start: '2026-04-01',
    end: '2026-04-18',
    progress: 100,
    custom_class: 'bar-done'
  },
  {
    id: 'earthworks',
    name: 'Excavation & Earthworks',
    start: '2026-04-14',
    end: '2026-05-20',
    progress: 85,
    dependencies: 'mobilization',
    custom_class: 'bar-active'
  },
  {
    id: 'foundation',
    name: 'Foundation & Piling',
    start: '2026-05-10',
    end: '2026-06-25',
    progress: 60,
    dependencies: 'earthworks',
    custom_class: 'bar-active'
  },
  {
    id: 'structure',
    name: 'Structural Frame',
    start: '2026-06-15',
    end: '2026-08-30',
    progress: 35,
    dependencies: 'foundation',
    custom_class: 'bar-active'
  },
  {
    id: 'envelope',
    name: 'Building Envelope',
    start: '2026-08-01',
    end: '2026-10-15',
    progress: 15,
    dependencies: 'structure',
    custom_class: 'bar-planned'
  },
  {
    id: 'mep',
    name: 'MEP Rough-in',
    start: '2026-08-20',
    end: '2026-10-30',
    progress: 10,
    dependencies: 'structure',
    custom_class: 'bar-planned'
  },
  {
    id: 'finishes',
    name: 'Interior Finishes',
    start: '2026-09-25',
    end: '2026-11-20',
    progress: 0,
    dependencies: 'envelope,mep',
    custom_class: 'bar-planned'
  },
  {
    id: 'commissioning',
    name: 'Testing & Commissioning',
    start: '2026-11-01',
    end: '2026-12-05',
    progress: 0,
    dependencies: 'finishes',
    custom_class: 'bar-milestone'
  },
  {
    id: 'handover',
    name: 'Practical Completion / Handover',
    start: '2026-12-01',
    end: '2026-12-20',
    progress: 0,
    dependencies: 'commissioning',
    custom_class: 'bar-milestone'
  }
];

export const GANTT_VIEW_MODES = [
  { label: 'Day', value: 'Day' as const },
  { label: 'Week', value: 'Week' as const },
  { label: 'Month', value: 'Month' as const },
  { label: 'Year', value: 'Year' as const }
];

export type GanttViewMode = (typeof GANTT_VIEW_MODES)[number]['value'];
