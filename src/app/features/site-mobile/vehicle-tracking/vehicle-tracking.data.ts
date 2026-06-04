import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type VehicleFleetStatus = 'moving' | 'idle' | 'parked' | 'offline' | 'speeding';
export type VehicleType = 'tipper' | 'pickup' | 'van' | 'mixer' | 'flatbed';

export interface VehicleAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface VehicleAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

/** Editable fleet register fields (not live GPS/telematics). */
export interface VehicleMasterRecord {
  id: string;
  name: string;
  plateNumber: string;
  vehicleType: VehicleType;
  /** Linked employee (Driver / Operator designation). */
  driverEmployeeId: string;
  driverName: string;
  projectId: string;
  projectName: string;
  speedLimitKph: number;
  /** Telematics unit id — links to GPS feed when connected. */
  deviceId: string;
  notes: string;
}

/** Live data supplied by GPS / telematics API. */
export interface VehicleGpsTelemetry {
  status: VehicleFleetStatus;
  lat: number;
  lng: number;
  speedKph: number;
  idleMinutes: number;
  odometerKm: number;
  fuelPct: number;
  lastUpdate: string;
  route: [number, number][];
}

export interface FleetVehicle extends VehicleMasterRecord, VehicleGpsTelemetry {
  audit: VehicleAuditEntry[];
  attachments: VehicleAttachment[];
}

export type VehicleFormValue = Pick<
  FleetVehicle,
  | 'name'
  | 'plateNumber'
  | 'vehicleType'
  | 'driverEmployeeId'
  | 'projectId'
  | 'speedLimitKph'
  | 'deviceId'
  | 'notes'
>;

export const FLEET_MAP_CENTER: [number, number] = [25.12, 55.2];
export const FLEET_MAP_ZOOM = 11;

export const FLEET_PROJECT_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const FLEET_VEHICLE_TYPE_OPTIONS = [
  { label: 'All vehicle types', value: 'all' },
  { label: 'Tipper / dumper', value: 'tipper' },
  { label: 'Pickup', value: 'pickup' },
  { label: 'Van', value: 'van' },
  { label: 'Mixer', value: 'mixer' },
  { label: 'Flatbed', value: 'flatbed' }
];

export const FLEET_FORM_PROJECT_OPTIONS = DEMO_PROJECTS.map((p) => ({
  label: p.name,
  value: p.id
}));

export const FLEET_FORM_VEHICLE_TYPE_OPTIONS = FLEET_VEHICLE_TYPE_OPTIONS.filter((o) => o.value !== 'all');

export const FLEET_STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Moving', value: 'moving' },
  { label: 'Idle', value: 'idle' },
  { label: 'Parked', value: 'parked' },
  { label: 'Offline', value: 'offline' },
  { label: 'Speeding', value: 'speeding' }
];

const FLEET_VEHICLES_SEED: FleetVehicle[] = [
  {
    id: 'veh-001',
    name: 'Tipper DT-12',
    plateNumber: 'DXB-T-4521',
    vehicleType: 'tipper',
    driverEmployeeId: 'emp-101',
    driverName: 'Rashid Al Mansoor',
    projectId: 'P-002',
    projectName: 'Marina Podium & Retail',
    status: 'speeding',
    lat: 25.031,
    lng: 55.1142,
    speedKph: 62,
    speedLimitKph: 55,
    idleMinutes: 0,
    odometerKm: 18420,
    fuelPct: 54,
    lastUpdate: '2026-06-04T14:34:00+04:00',
    deviceId: 'FLT-GPS-2212',
    notes: 'Haul road DT-12 — speed limit enforced on exit gate.',
    route: [
      [25.028, 55.108],
      [25.0295, 55.111],
      [25.031, 55.1142]
    ],
    audit: [
      { at: '2026-06-04 14:34', action: 'Speed alert (> 55 km/h)', by: 'Fleet rules' },
      { at: '2026-06-04 13:50', action: 'Route deviation from approved haul road', by: 'System' }
    ],
    attachments: [
      { id: 'a1', name: 'Vehicle registration.pdf', type: 'PDF', uploadedAt: '2026-01-15' },
      { id: 'a2', name: 'Insurance certificate.pdf', type: 'PDF', uploadedAt: '2026-02-01' }
    ]
  },
  {
    id: 'veh-002',
    name: 'Pickup PK-04',
    plateNumber: 'DXB-P-8832',
    vehicleType: 'pickup',
    driverEmployeeId: 'emp-102',
    driverName: 'James Patel',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'moving',
    lat: 25.0782,
    lng: 55.1358,
    speedKph: 38,
    speedLimitKph: 60,
    idleMinutes: 0,
    odometerKm: 9210,
    fuelPct: 71,
    lastUpdate: '2026-06-04T14:36:00+04:00',
    deviceId: 'FLT-GPS-1104',
    notes: '',
    route: [
      [25.0765, 55.1338],
      [25.0774, 55.1348],
      [25.0782, 55.1358]
    ],
    audit: [
      { at: '2026-06-04 14:36', action: 'Entered site geofence — Gate A', by: 'Geofence' },
      { at: '2026-06-04 08:10', action: 'Daily inspection signed off', by: 'James Patel' }
    ],
    attachments: [{ id: 'a3', name: 'Gate pass photo.jpg', type: 'Image', uploadedAt: '2026-06-04' }]
  },
  {
    id: 'veh-003',
    name: 'Delivery van VN-03',
    plateNumber: 'DXB-V-3309',
    vehicleType: 'van',
    driverEmployeeId: 'emp-104',
    driverName: 'Sara Khan',
    projectId: 'P-004',
    projectName: 'Residential Phase 2',
    status: 'moving',
    lat: 25.0658,
    lng: 55.1295,
    speedKph: 35,
    speedLimitKph: 50,
    idleMinutes: 0,
    odometerKm: 45200,
    fuelPct: 48,
    lastUpdate: '2026-06-04T14:36:00+04:00',
    deviceId: 'FLT-GPS-5503',
    notes: 'Material delivery van — gate B only.',
    route: [
      [25.068, 55.127],
      [25.067, 55.1282],
      [25.0658, 55.1295]
    ],
    audit: [
      { at: '2026-06-04 14:36', action: 'En route to site gate B', by: 'Dispatch' },
      { at: '2026-06-04 13:10', action: 'BOQ material pickup confirmed', by: 'Warehouse' }
    ],
    attachments: []
  },
  {
    id: 'veh-004',
    name: 'Mixer MX-02',
    plateNumber: 'DXB-M-7710',
    vehicleType: 'mixer',
    driverEmployeeId: 'emp-107',
    driverName: 'Omar Farouk',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'idle',
    lat: 25.0798,
    lng: 55.1375,
    speedKph: 0,
    speedLimitKph: 40,
    idleMinutes: 22,
    odometerKm: 31200,
    fuelPct: 62,
    lastUpdate: '2026-06-04T14:28:00+04:00',
    deviceId: 'FLT-GPS-7702',
    notes: '',
    route: [
      [25.081, 55.139],
      [25.0805, 55.1382],
      [25.0798, 55.1375]
    ],
    audit: [
      { at: '2026-06-04 14:28', action: 'Idle > 15 min — pour window pending', by: 'Fleet rules' },
      { at: '2026-06-04 11:45', action: 'Departed batching plant', by: 'Dispatch' }
    ],
    attachments: [{ id: 'a4', name: 'Pour ticket #8841.pdf', type: 'PDF', uploadedAt: '2026-06-04' }]
  },
  {
    id: 'veh-005',
    name: 'Tipper DT-08',
    plateNumber: 'DXB-T-1198',
    vehicleType: 'tipper',
    driverEmployeeId: 'emp-105',
    driverName: 'Hassan Iqbal',
    projectId: 'P-003',
    projectName: 'Warehouse & Logistics Hub',
    status: 'moving',
    lat: 25.1525,
    lng: 55.2785,
    speedKph: 42,
    speedLimitKph: 55,
    idleMinutes: 0,
    odometerKm: 22100,
    fuelPct: 80,
    lastUpdate: '2026-06-04T14:35:00+04:00',
    deviceId: 'FLT-GPS-2208',
    notes: '',
    route: [
      [25.1508, 55.2768],
      [25.1518, 55.2778],
      [25.1525, 55.2785]
    ],
    audit: [
      { at: '2026-06-04 14:35', action: 'Haul cycle 6 of 12 completed', by: 'System' },
      { at: '2026-06-04 07:00', action: 'Shift start — GPS lock OK', by: 'Attendance' }
    ],
    attachments: []
  },
  {
    id: 'veh-006',
    name: 'Flatbed FB-01',
    plateNumber: 'DXB-F-2044',
    vehicleType: 'flatbed',
    driverEmployeeId: 'emp-111',
    driverName: 'Fleet pool (unassigned)',
    projectId: 'P-002',
    projectName: 'Marina Podium & Retail',
    status: 'parked',
    lat: 25.0288,
    lng: 55.1088,
    speedKph: 0,
    speedLimitKph: 55,
    idleMinutes: 185,
    odometerKm: 15800,
    fuelPct: 91,
    lastUpdate: '2026-06-04T12:00:00+04:00',
    deviceId: 'FLT-GPS-2001',
    notes: 'Spare flatbed — parked in laydown when not on hire.',
    route: [[25.0288, 55.1088]],
    audit: [
      { at: '2026-06-04 12:00', action: 'Parked in laydown yard', by: 'Geofence' },
      { at: '2026-06-03 17:30', action: 'End of shift ignition off', by: 'Device' }
    ],
    attachments: [{ id: 'a5', name: 'Steel delivery manifest.pdf', type: 'PDF', uploadedAt: '2026-06-03' }]
  },
  {
    id: 'veh-007',
    name: 'Pickup PK-11',
    plateNumber: 'DXB-P-9920',
    vehicleType: 'pickup',
    driverEmployeeId: 'emp-103',
    driverName: 'Nadia Siddiqui',
    projectId: 'P-003',
    projectName: 'Warehouse & Logistics Hub',
    status: 'offline',
    lat: 25.1542,
    lng: 55.2808,
    speedKph: 0,
    speedLimitKph: 60,
    idleMinutes: 0,
    odometerKm: 6700,
    fuelPct: 15,
    lastUpdate: '2026-06-04T09:45:00+04:00',
    deviceId: 'FLT-GPS-1111',
    notes: '',
    route: [
      [25.1538, 55.2802],
      [25.154, 55.2805],
      [25.1542, 55.2808]
    ],
    audit: [
      { at: '2026-06-04 09:45', action: 'Telematics offline — low power', by: 'System' },
      { at: '2026-06-04 07:15', action: 'Last ping inside site fence', by: 'Geofence' }
    ],
    attachments: []
  },
  {
    id: 'veh-008',
    name: 'Van VN-07 (spares)',
    plateNumber: 'DXB-V-4412',
    vehicleType: 'van',
    driverEmployeeId: 'emp-112',
    driverName: 'Maintenance pool',
    projectId: 'P-001',
    projectName: 'Tower Block A — Main Contract',
    status: 'idle',
    lat: 25.077,
    lng: 55.1342,
    speedKph: 0,
    speedLimitKph: 50,
    idleMinutes: 8,
    odometerKm: 38900,
    fuelPct: 66,
    lastUpdate: '2026-06-04T14:32:00+04:00',
    deviceId: 'FLT-GPS-4407',
    notes: 'Maintenance pool vehicle.',
    route: [
      [25.0768, 55.134],
      [25.077, 55.1342]
    ],
    audit: [
      { at: '2026-06-04 14:32', action: 'Waiting at stores — parts issue', by: 'Dispatch' },
      { at: '2026-06-04 10:00', action: 'Work order WO-882 linked', by: 'Maintenance' }
    ],
    attachments: [
      { id: 'a6', name: 'Work order WO-882.pdf', type: 'PDF', uploadedAt: '2026-06-04' },
      { id: 'a7', name: 'Parts photo.jpg', type: 'Image', uploadedAt: '2026-06-04' }
    ]
  }
];

/** @deprecated Use initialFleetVehicles() in the app — kept for tests/imports. */
export const FLEET_VEHICLES = FLEET_VEHICLES_SEED;

export function initialFleetVehicles(): FleetVehicle[] {
  return structuredClone(FLEET_VEHICLES_SEED);
}

export function projectNameForId(projectId: string): string {
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function newFleetVehicleId(): string {
  return `veh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function auditTimestamp(): string {
  const d = new Date();
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Default telematics snapshot until GPS API provides live data. */
export function defaultGpsTelemetry(projectId?: string): VehicleGpsTelemetry {
  const anchor = projectGpsAnchor(projectId);
  return {
    status: 'offline',
    lat: anchor.lat,
    lng: anchor.lng,
    speedKph: 0,
    idleMinutes: 0,
    odometerKm: 0,
    fuelPct: 0,
    lastUpdate: new Date().toISOString(),
    route: [[anchor.lat, anchor.lng]]
  };
}

function projectGpsAnchor(projectId?: string): { lat: number; lng: number } {
  const anchors: Record<string, { lat: number; lng: number }> = {
    'P-001': { lat: 25.0785, lng: 55.1358 },
    'P-002': { lat: 25.029, lng: 55.109 },
    'P-003': { lat: 25.153, lng: 55.279 },
    'P-004': { lat: 25.066, lng: 55.129 }
  };
  if (projectId && anchors[projectId]) return anchors[projectId];
  return { lat: FLEET_MAP_CENTER[0], lng: FLEET_MAP_CENTER[1] };
}

export function fleetStatusSeverity(
  status: VehicleFleetStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'moving':
      return 'success';
    case 'idle':
      return 'warn';
    case 'parked':
      return 'info';
    case 'offline':
      return 'secondary';
    case 'speeding':
      return 'danger';
  }
}

export function fleetStatusColor(status: VehicleFleetStatus): string {
  switch (status) {
    case 'moving':
      return '#22c55e';
    case 'idle':
      return '#eab308';
    case 'parked':
      return '#3b82f6';
    case 'offline':
      return '#94a3b8';
    case 'speeding':
      return '#ef4444';
  }
}

export function vehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    tipper: 'Tipper',
    pickup: 'Pickup',
    van: 'Van',
    mixer: 'Mixer',
    flatbed: 'Flatbed'
  };
  return labels[type];
}

export function vehicleTypeIcon(type: VehicleType): string {
  switch (type) {
    case 'tipper':
      return 'pi pi-truck';
    case 'pickup':
      return 'pi pi-car';
    case 'van':
      return 'pi pi-box';
    case 'mixer':
      return 'pi pi-circle';
    case 'flatbed':
      return 'pi pi-server';
    default:
      return 'pi pi-car';
  }
}

export function formatFleetTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}
