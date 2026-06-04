import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type GpsTrackerType = 'staff' | 'asset';
export type GpsTrackerStatus = 'online' | 'idle' | 'offline' | 'alert';

export interface GpsAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface GpsTracker {
  id: string;
  name: string;
  type: GpsTrackerType;
  role: string;
  projectId: string;
  projectName: string;
  status: GpsTrackerStatus;
  lat: number;
  lng: number;
  speedKph: number;
  headingDeg: number;
  batteryPct: number;
  lastUpdate: string;
  deviceId: string;
  trail: [number, number][];
  audit: GpsAuditEntry[];
}

export const GPS_MAP_CENTER: [number, number] = [25.12, 55.2];
export const GPS_MAP_ZOOM = 11;

export const GPS_PROJECT_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const GPS_TYPE_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Staff', value: 'staff' },
  { label: 'Assets', value: 'asset' }
];

export const GPS_STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Idle', value: 'idle' },
  { label: 'Offline', value: 'offline' },
  { label: 'Alert', value: 'alert' }
];

const trail = (points: [number, number][]): [number, number][] => points;

export const GPS_TRACKERS: GpsTracker[] = [
  {
    id: 'gps-001',
    name: 'Ahmed Hassan',
    type: 'staff',
    role: 'Site Engineer',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'online',
    lat: 25.0788,
    lng: 55.1362,
    speedKph: 4.2,
    headingDeg: 120,
    batteryPct: 78,
    lastUpdate: '2026-06-04T14:32:00+04:00',
    deviceId: 'SM-GPS-1042',
    trail: trail([
      [25.0772, 55.1345],
      [25.0778, 55.1352],
      [25.0788, 55.1362]
    ]),
    audit: [
      { at: '2026-06-04 14:32', action: 'Position ping', by: 'Device' },
      { at: '2026-06-04 07:58', action: 'Check-in verified (GPS)', by: 'System' }
    ]
  },
  {
    id: 'gps-002',
    name: 'Priya Patel',
    type: 'staff',
    role: 'QA Inspector',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'idle',
    lat: 25.0795,
    lng: 55.1378,
    speedKph: 0,
    headingDeg: 0,
    batteryPct: 62,
    lastUpdate: '2026-06-04T14:28:00+04:00',
    deviceId: 'SM-GPS-1088',
    trail: trail([
      [25.081, 55.139],
      [25.0802, 55.1385],
      [25.0795, 55.1378]
    ]),
    audit: [
      { at: '2026-06-04 14:28', action: 'Idle > 15 min alert cleared', by: 'Supervisor' },
      { at: '2026-06-04 09:12', action: 'Inspection zone entered', by: 'Geofence' }
    ]
  },
  {
    id: 'gps-003',
    name: 'Concrete pump CP-07',
    type: 'asset',
    role: 'Plant · Pump',
    projectId: 'P-002',
    projectName: 'Marina Podium & Retail',
    status: 'online',
    lat: 25.0292,
    lng: 55.1095,
    speedKph: 18,
    headingDeg: 245,
    batteryPct: 91,
    lastUpdate: '2026-06-04T14:35:00+04:00',
    deviceId: 'AST-GPS-3307',
    trail: trail([
      [25.032, 55.112],
      [25.0305, 55.1108],
      [25.0292, 55.1095]
    ]),
    audit: [
      { at: '2026-06-04 14:35', action: 'Speed within limit', by: 'Fleet rules' },
      { at: '2026-06-04 11:00', action: 'Departure from laydown yard', by: 'Geofence' }
    ]
  },
  {
    id: 'gps-004',
    name: 'Dumper DT-12',
    type: 'asset',
    role: 'Fleet · Tipper',
    projectId: 'P-002',
    projectName: 'Marina Podium & Retail',
    status: 'alert',
    lat: 25.031,
    lng: 55.1142,
    speedKph: 62,
    headingDeg: 310,
    batteryPct: 54,
    lastUpdate: '2026-06-04T14:34:00+04:00',
    deviceId: 'AST-GPS-2212',
    trail: trail([
      [25.028, 55.108],
      [25.0295, 55.111],
      [25.031, 55.1142]
    ]),
    audit: [
      { at: '2026-06-04 14:34', action: 'Speed alert (> 55 km/h)', by: 'Fleet rules' },
      { at: '2026-06-04 13:50', action: 'Route deviation noted', by: 'System' }
    ]
  },
  {
    id: 'gps-005',
    name: 'Nadia Siddiqui',
    type: 'staff',
    role: 'Safety Officer',
    projectId: 'P-003',
    projectName: 'Warehouse & Logistics Hub',
    status: 'online',
    lat: 25.1532,
    lng: 55.279,
    speedKph: 2.1,
    headingDeg: 45,
    batteryPct: 85,
    lastUpdate: '2026-06-04T14:33:00+04:00',
    deviceId: 'SM-GPS-1156',
    trail: trail([
      [25.1518, 55.2775],
      [25.1525, 55.2782],
      [25.1532, 55.279]
    ]),
    audit: [
      { at: '2026-06-04 14:33', action: 'PPE zone patrol logged', by: 'System' },
      { at: '2026-06-04 06:45', action: 'Shift start GPS lock', by: 'Attendance' }
    ]
  },
  {
    id: 'gps-006',
    name: 'Khalid Omar',
    type: 'staff',
    role: 'Foreman',
    projectId: 'P-003',
    projectName: 'Warehouse & Logistics Hub',
    status: 'offline',
    lat: 25.1545,
    lng: 55.281,
    speedKph: 0,
    headingDeg: 0,
    batteryPct: 12,
    lastUpdate: '2026-06-04T11:20:00+04:00',
    deviceId: 'SM-GPS-1021',
    trail: trail([
      [25.154, 55.2802],
      [25.1542, 55.2806],
      [25.1545, 55.281]
    ]),
    audit: [
      { at: '2026-06-04 11:20', action: 'Device offline (low battery)', by: 'System' },
      { at: '2026-06-04 07:02', action: 'Last known inside site fence', by: 'Geofence' }
    ]
  },
  {
    id: 'gps-007',
    name: 'Tower crane TC-02',
    type: 'asset',
    role: 'Plant · Crane',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'idle',
    lat: 25.0775,
    lng: 55.135,
    speedKph: 0,
    headingDeg: 0,
    batteryPct: 88,
    lastUpdate: '2026-06-04T14:30:00+04:00',
    deviceId: 'AST-GPS-4402',
    trail: trail([
      [25.0775, 55.135]
    ]),
    audit: [
      { at: '2026-06-04 14:30', action: 'Fixed plant heartbeat', by: 'Device' },
      { at: '2026-06-03 16:00', action: 'Anti-collision zone OK', by: 'System' }
    ]
  },
  {
    id: 'gps-008',
    name: 'Delivery van VN-03',
    type: 'asset',
    role: 'Fleet · Van',
    projectId: 'P-004',
    projectName: 'Residential Phase 2',
    status: 'online',
    lat: 25.0658,
    lng: 55.1295,
    speedKph: 35,
    headingDeg: 190,
    batteryPct: 71,
    lastUpdate: '2026-06-04T14:36:00+04:00',
    deviceId: 'AST-GPS-5503',
    trail: trail([
      [25.068, 55.127],
      [25.067, 55.1282],
      [25.0658, 55.1295]
    ]),
    audit: [
      { at: '2026-06-04 14:36', action: 'En route to site gate B', by: 'Dispatch' },
      { at: '2026-06-04 13:10', action: 'BOQ material pickup confirmed', by: 'Warehouse' }
    ]
  }
];

export function gpsStatusSeverity(
  status: GpsTrackerStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'online':
      return 'success';
    case 'idle':
      return 'warn';
    case 'offline':
      return 'secondary';
    case 'alert':
      return 'danger';
  }
}

export function gpsStatusColor(status: GpsTrackerStatus): string {
  switch (status) {
    case 'online':
      return '#22c55e';
    case 'idle':
      return '#eab308';
    case 'offline':
      return '#94a3b8';
    case 'alert':
      return '#ef4444';
  }
}

export function gpsTypeLabel(type: GpsTrackerType): string {
  return type === 'staff' ? 'Staff' : 'Asset';
}

export function formatLastUpdate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}
