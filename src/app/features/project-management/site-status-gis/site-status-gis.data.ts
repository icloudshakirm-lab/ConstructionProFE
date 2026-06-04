import { DEMO_PROJECTS } from '../projects-sites-org-chart/projects-sites-org-chart.data';

export type GisDrawTool = 'point' | 'polyline' | 'polygon' | null;

export const GIS_PROJECT_OPTIONS = [
  { label: '— Select project context —', value: '' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

/** Map center [lat, lng] and zoom per project (Leaflet). */
export const GIS_PROJECT_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  'P-001': { center: [25.078, 55.136], zoom: 16 },
  'P-002': { center: [25.029, 55.109], zoom: 15 },
  'P-003': { center: [25.204, 55.313], zoom: 14 },
  'P-004': { center: [25.153, 55.279], zoom: 16 },
  'P-005': { center: [25.066, 55.129], zoom: 15 }
};

export const DEFAULT_GIS_VIEW = { center: [25.12, 55.2] as [number, number], zoom: 12 };
