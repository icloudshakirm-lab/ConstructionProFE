export interface ProjectNote {
  id: string;
  title: string;
  body: string;
  project: string;
  author: string;
  updatedAt: string;
  pinned: boolean;
}

export const DEMO_NOTES: ProjectNote[] = [
  {
    id: 'note-1',
    title: 'Tower Block A — crane lift window',
    body: 'Crane lift approved 06:00–10:00 Saturday. Secure exclusion zone on south elevation. Notify MEP before deck penetration.',
    project: 'Tower Block A',
    author: 'Site Engineer',
    updatedAt: '2026-06-03T09:15:00',
    pinned: true
  },
  {
    id: 'note-2',
    title: 'Warehouse Phase 2 — soil report summary',
    body: 'Geotech report received. Bearing capacity 180 kPa at founding level. No groundwater within 2 m at grid B4.',
    project: 'Warehouse Expansion',
    author: 'QS',
    updatedAt: '2026-06-02T14:30:00',
    pinned: false
  },
  {
    id: 'note-3',
    title: 'Roadworks Section C — traffic management',
    body: 'Night lane closure approved by municipality. Signage layout per drawing TM-104 rev C.',
    project: 'Roadworks Package C',
    author: 'Project Manager',
    updatedAt: '2026-06-01T11:00:00',
    pinned: false
  }
];
