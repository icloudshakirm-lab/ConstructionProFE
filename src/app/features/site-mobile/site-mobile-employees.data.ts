/** Designations eligible as vehicle driver / operator on Site Mobile fleet forms. */
export type VehicleOperatorDesignation = 'Driver' | 'Operator';

export interface SiteEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: VehicleOperatorDesignation;
  projectId?: string;
  active: boolean;
}

export const SITE_EMPLOYEES: SiteEmployee[] = [
  {
    id: 'emp-101',
    employeeCode: 'EMP-1042',
    fullName: 'Rashid Al Mansoor',
    designation: 'Driver',
    projectId: 'P-002',
    active: true
  },
  {
    id: 'emp-102',
    employeeCode: 'EMP-1088',
    fullName: 'James Patel',
    designation: 'Driver',
    projectId: 'P-001',
    active: true
  },
  {
    id: 'emp-103',
    employeeCode: 'EMP-1156',
    fullName: 'Nadia Siddiqui',
    designation: 'Driver',
    projectId: 'P-003',
    active: true
  },
  {
    id: 'emp-104',
    employeeCode: 'EMP-1102',
    fullName: 'Sara Khan',
    designation: 'Driver',
    projectId: 'P-004',
    active: true
  },
  {
    id: 'emp-105',
    employeeCode: 'EMP-1201',
    fullName: 'Hassan Iqbal',
    designation: 'Driver',
    projectId: 'P-003',
    active: true
  },
  {
    id: 'emp-106',
    employeeCode: 'EMP-1188',
    fullName: 'Khalid Omar',
    designation: 'Driver',
    projectId: 'P-003',
    active: true
  },
  {
    id: 'emp-107',
    employeeCode: 'EMP-1310',
    fullName: 'Omar Farouk',
    designation: 'Operator',
    projectId: 'P-001',
    active: true
  },
  {
    id: 'emp-108',
    employeeCode: 'EMP-1322',
    fullName: 'Vikram Singh',
    designation: 'Operator',
    projectId: 'P-001',
    active: true
  },
  {
    id: 'emp-109',
    employeeCode: 'EMP-1405',
    fullName: 'Youssef Haddad',
    designation: 'Operator',
    projectId: 'P-002',
    active: true
  },
  {
    id: 'emp-110',
    employeeCode: 'EMP-1418',
    fullName: 'Mohammed Saleh',
    designation: 'Operator',
    projectId: 'P-002',
    active: true
  },
  {
    id: 'emp-111',
    employeeCode: 'EMP-1501',
    fullName: 'Fleet pool (unassigned)',
    designation: 'Operator',
    active: true
  },
  {
    id: 'emp-112',
    employeeCode: 'EMP-1508',
    fullName: 'Maintenance pool',
    designation: 'Operator',
    projectId: 'P-001',
    active: true
  },
  {
    id: 'emp-113',
    employeeCode: 'EMP-1520',
    fullName: 'Anil Desai',
    designation: 'Driver',
    projectId: 'P-004',
    active: true
  },
  {
    id: 'emp-114',
    employeeCode: 'EMP-1533',
    fullName: 'Faisal Rahman',
    designation: 'Operator',
    projectId: 'P-003',
    active: true
  }
];

const VEHICLE_OPERATOR_DESIGNATIONS: VehicleOperatorDesignation[] = ['Driver', 'Operator'];

export function isVehicleOperatorDesignation(designation: string): designation is VehicleOperatorDesignation {
  return VEHICLE_OPERATOR_DESIGNATIONS.includes(designation as VehicleOperatorDesignation);
}

/** Active employees with Driver or Operator designation (for fleet assignment dropdown). */
export function driverOperatorEmployees(): SiteEmployee[] {
  return SITE_EMPLOYEES.filter(
    (e) => e.active && isVehicleOperatorDesignation(e.designation)
  );
}

export function driverOperatorSelectOptions(): { label: string; value: string }[] {
  return driverOperatorEmployees()
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((e) => ({
      label: `${e.fullName} — ${e.designation} (${e.employeeCode})`,
      value: e.id
    }));
}

export function employeeById(id: string): SiteEmployee | undefined {
  return SITE_EMPLOYEES.find((e) => e.id === id);
}

export function employeeLabel(id: string): string {
  const e = employeeById(id);
  return e ? `${e.fullName} — ${e.designation}` : id;
}

/** Resolve legacy stored driver name to employee id when opening edit. */
export function resolveDriverEmployeeId(driverName: string, driverEmployeeId?: string): string {
  if (driverEmployeeId && employeeById(driverEmployeeId)) {
    return driverEmployeeId;
  }
  const normalized = driverName.trim().toLowerCase();
  if (!normalized) return '';

  const exact = driverOperatorEmployees().find(
    (e) => e.fullName.toLowerCase() === normalized
  );
  if (exact) return exact.id;

  const partial = driverOperatorEmployees().find(
    (e) =>
      normalized.includes(e.fullName.toLowerCase()) ||
      e.fullName.toLowerCase().includes(normalized) ||
      normalized.startsWith(e.fullName.split(' ')[0]?.toLowerCase() ?? '')
  );
  if (partial) return partial.id;

  const aliases: Record<string, string> = {
    'rashid al m.': 'emp-101',
    'rashid al m': 'emp-101',
    unassigned: 'emp-111'
  };
  return aliases[normalized] ?? '';
}
