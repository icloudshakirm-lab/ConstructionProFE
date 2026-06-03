import { DEMO_PROJECTS, ProjectSummary } from '../projects-sites-org-chart/projects-sites-org-chart.data';

export interface SiteMapMarker {
  id: string;
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectSummary['status'];
  locationLabel: string;
  lat: number;
  lng: number;
  progressPct: number;
  superintendent: string;
}

/** Approximate coordinates for demo sites (Gulf / UAE region). */
const SITE_COORDS: Record<string, { lat: number; lng: number; superintendent: string }> = {
  'S-001': { lat: 25.0785, lng: 55.1358, superintendent: 'R. Hassan' },
  'S-002': { lat: 25.0798, lng: 55.1372, superintendent: 'R. Hassan' },
  'S-003': { lat: 25.0772, lng: 55.1345, superintendent: 'M. Ali' },
  'S-010': { lat: 25.0284, lng: 55.1082, superintendent: 'J. Patel' },
  'S-011': { lat: 25.0296, lng: 55.1101, superintendent: 'J. Patel' },
  'S-020': { lat: 25.2042, lng: 55.3125, superintendent: 'K. Ahmed' },
  'S-021': { lat: 25.2058, lng: 55.3148, superintendent: 'K. Ahmed' },
  'S-022': { lat: 25.2031, lng: 55.3102, superintendent: 'K. Ahmed' },
  'S-030': { lat: 25.1528, lng: 55.2784, superintendent: 'N. Siddiqui' },
  'S-031': { lat: 25.1541, lng: 55.2801, superintendent: 'F. Qureshi' },
  'S-040': { lat: 25.0652, lng: 55.1288, superintendent: 'S. Rahman' },
  'S-041': { lat: 25.0668, lng: 55.1305, superintendent: 'S. Rahman' },
  'S-042': { lat: 25.0641, lng: 55.1272, superintendent: 'A. Khan' }
};

const DEFAULT_COORD = { lat: 25.12, lng: 55.2, superintendent: 'Site Superintendent' };

export const MAP_CENTER: [number, number] = [25.12, 55.2];
export const MAP_DEFAULT_ZOOM = 11;

export interface MapTileConfig {
  url: string;
  attribution: string;
}

/** Light: OpenStreetMap. Dark: CARTO Dark Matter (free, OSM-based). */
export const MAP_TILES = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>'
  }
} satisfies Record<'light' | 'dark', MapTileConfig>;

export const PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export function buildSiteMapMarkers(): SiteMapMarker[] {
  const markers: SiteMapMarker[] = [];

  for (const project of DEMO_PROJECTS) {
    for (const site of project.sites) {
      const coords = SITE_COORDS[site.id] ?? DEFAULT_COORD;
      markers.push({
        id: `${project.id}-${site.id}`,
        siteId: site.id,
        siteName: site.name,
        projectId: project.id,
        projectName: project.name,
        projectStatus: project.status,
        locationLabel: site.location,
        lat: coords.lat,
        lng: coords.lng,
        progressPct: site.progressPct,
        superintendent: coords.superintendent
      });
    }
  }

  return markers;
}

export const ALL_SITE_MARKERS = buildSiteMapMarkers();

export function projectStatusSeverity(
  status: ProjectSummary['status']
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Planned':
      return 'info';
    case 'On Hold':
      return 'warn';
    case 'Completed':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function progressMarkerColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 35) return '#3b82f6';
  if (pct > 0) return '#f59e0b';
  return '#94a3b8';
}
