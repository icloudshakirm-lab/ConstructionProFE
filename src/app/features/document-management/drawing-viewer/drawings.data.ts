export type DrawingFileFormat = 'dwg' | 'dxf';

export interface DrawingRecord {
  id: string;
  sheet: string;
  title: string;
  discipline: string;
  revision: string;
  format: DrawingFileFormat;
  fileUrl: string;
  project: string;
  updated: string;
}

/** Demo drawing register — view-only; files are local DXF or public sample DWG. */
export const DEMO_DRAWINGS: DrawingRecord[] = [
  {
    id: 'drw-001',
    sheet: 'A-101',
    title: 'Ground Floor Plan',
    discipline: 'Architectural',
    revision: 'A',
    format: 'dxf',
    fileUrl: '/drawings/ground-floor-plan.dxf',
    project: 'Tower Block A',
    updated: '2026-05-12'
  },
  {
    id: 'drw-002',
    sheet: 'S-201',
    title: 'Foundation Layout',
    discipline: 'Structural',
    revision: 'B',
    format: 'dxf',
    fileUrl: '/drawings/foundation-layout.dxf',
    project: 'Tower Block A',
    updated: '2026-05-28'
  },
  {
    id: 'drw-003',
    sheet: 'A-102',
    title: 'Sample DWG — Map of UAE',
    discipline: 'Architectural',
    revision: '01',
    format: 'dwg',
    fileUrl: 'https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/data/map-of-uae.dwg',
    project: 'Tower Block A',
    updated: '2026-04-01'
  }
];

export const DRAWING_FORMATS = ['dwg', 'dxf'] as const;
