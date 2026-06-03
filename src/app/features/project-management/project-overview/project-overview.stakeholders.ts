import type {
  ProjectOverviewDemo,
  StakeholderEntity,
  StakeholderGroup,
  StakeholderKind
} from './project-overview.data';

/** Seeded RNG — same project id always yields the same stakeholder mix. */
export function createSeededRng(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    state = Math.imul(state ^ (state >>> 16), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

function chance(rng: () => number, probability: number): boolean {
  return rng() < probability;
}

function pickOne<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function pickMany<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  return picked;
}

const FIRST_NAMES = [
  'Sarah',
  'Omar',
  'Layla',
  'James',
  'Fatima',
  'Hassan',
  'Elena',
  'Aisha',
  'David',
  'Sofia',
  'Ravi',
  'Carlos',
  'Maria',
  'Youssef',
  'Tom',
  'Kenji'
] as const;

const LAST_NAMES = [
  'Al-Mansoori',
  'Hassan',
  'Karim',
  'Okonkwo',
  'Al-Zaabi',
  'Rahman',
  'Petrova',
  'Noor',
  'Chen',
  'Andersson',
  'Menon',
  'Mendez',
  'Santos',
  'Ibrahim',
  'Bradley',
  'Tanaka'
] as const;

const CONTRACTORS = [
  'Gulf Build LLC',
  'SteelFrame Contractors',
  'RoadWorks Gulf JV',
  'MedBuild Healthcare',
  'Coastal Marine Works',
  'Desert Foundations',
  'Skyline MEP Partners',
  'Harbour Civil Works',
  'Prime Structures FZE',
  'Al Waha General Contracting'
] as const;

const ARCHITECTS = [
  'Design Studio AE',
  'Industrial Design Co.',
  'Highway Design Bureau',
  'Clinical Architecture LLP',
  'Waterfront Design Group',
  'Urban Form Architects',
  'Gulf Engineering Design'
] as const;

const TRADE_SUBS: { id: string; label: string; icon: string }[] = [
  { id: 'sub-civil', label: 'Civil & Earthworks', icon: 'pi pi-wrench' },
  { id: 'sub-steel', label: 'Structural Steel', icon: 'pi pi-box' },
  { id: 'sub-gas', label: 'Gas & Plumbing', icon: 'pi pi-sliders-h' },
  { id: 'sub-elec', label: 'Electrician', icon: 'pi pi-bolt' },
  { id: 'sub-hvac', label: 'HVAC', icon: 'pi pi-sun' },
  { id: 'sub-finish', label: 'Finishes', icon: 'pi pi-palette' },
  { id: 'sub-fire', label: 'Fire Protection', icon: 'pi pi-shield' },
  { id: 'sub-clad', label: 'Cladding & Roofing', icon: 'pi pi-home' },
  { id: 'sub-asphalt', label: 'Asphalt & Paving', icon: 'pi pi-stop' },
  { id: 'sub-drain', label: 'Drainage & Utilities', icon: 'pi pi-sliders-h' },
  { id: 'sub-mep', label: 'Medical Gas & MEP', icon: 'pi pi-heart' },
  { id: 'sub-piling', label: 'Marine Piling', icon: 'pi pi-arrow-down' },
  { id: 'sub-land', label: 'Landscape & Lighting', icon: 'pi pi-sun' },
  { id: 'sub-bms', label: 'BMS / Controls', icon: 'pi pi-desktop' }
];

interface GroupChances {
  leadership: number;
  contractors: number;
  consultants: number;
  client: number;
  commercial: number;
  hseq: number;
  authorities: number;
  siteSupport: number;
  finance: number;
}

const DEFAULT_CHANCES: GroupChances = {
  leadership: 1,
  contractors: 1,
  consultants: 0.88,
  client: 0.92,
  commercial: 0.85,
  hseq: 0.9,
  authorities: 0.78,
  siteSupport: 0.82,
  finance: 0.58
};

/** Per-project tweaks — e.g. no finance on small / on-hold jobs. */
const PROFILE_OVERRIDES: Record<string, Partial<GroupChances>> = {
  'P-001': { finance: 0.95, authorities: 0.95 },
  'P-002': { finance: 0.15, consultants: 0.7, authorities: 0.5 },
  'P-003': { finance: 0.35, authorities: 1, consultants: 0.6 },
  'P-004': { finance: 0.9, hseq: 1, consultants: 1 },
  'P-005': { finance: 0.08, consultants: 0.45, commercial: 0.55, siteSupport: 0.5 }
};

function personName(rng: () => number): string {
  return `${pickOne(rng, FIRST_NAMES)} ${pickOne(rng, LAST_NAMES)}`;
}

function entity(
  id: string,
  label: string,
  kind: StakeholderKind,
  icon: string,
  detail?: string,
  children?: StakeholderEntity[]
): StakeholderEntity {
  const e: StakeholderEntity = { id, label, kind, icon };
  if (detail) e.detail = detail;
  if (children?.length) e.children = children;
  return e;
}

function resolveChances(projectId: string, status: ProjectOverviewDemo['status']): GroupChances {
  const base = { ...DEFAULT_CHANCES, ...PROFILE_OVERRIDES[projectId] };
  if (status === 'Planned') {
    base.finance = Math.min(base.finance, 0.25);
    base.siteSupport = Math.min(base.siteSupport, 0.65);
  }
  if (status === 'On Hold') {
    base.finance = Math.min(base.finance, 0.12);
    base.contractors = Math.min(base.contractors, 0.85);
  }
  if (status === 'Completed') {
    base.finance = Math.min(base.finance, 0.4);
  }
  return base;
}

export function generateStakeholderGroupsForProject(project: ProjectOverviewDemo): StakeholderGroup[] {
  const rng = createSeededRng(`stakeholders-${project.id}`);
  const chances = resolveChances(project.id, project.status);
  const groups: StakeholderGroup[] = [];

  if (chance(rng, chances.leadership)) {
    const roles: StakeholderEntity[] = [
      entity('pm', 'Project Manager', 'role', 'pi pi-user', personName(rng))
    ];
    if (chance(rng, 0.92)) roles.push(entity('pe', 'Project Engineer', 'role', 'pi pi-cog', personName(rng)));
    if (chance(rng, 0.85)) roles.push(entity('se', 'Site Engineer', 'role', 'pi pi-map', personName(rng)));
    if (chance(rng, 0.55)) roles.push(entity('planner', 'Planning Engineer', 'role', 'pi pi-calendar'));
    if (chance(rng, 0.35)) roles.push(entity('qs-site', 'Site QS', 'role', 'pi pi-calculator'));
    groups.push({ id: 'leadership', title: 'Project team', entities: roles });
  }

  if (chance(rng, chances.contractors)) {
    const subCount = 2 + Math.floor(rng() * 5);
    const subs = pickMany(rng, TRADE_SUBS, subCount).map((s) =>
      entity(s.id, s.label, 'subcontractor', s.icon)
    );
    groups.push({
      id: 'contractors',
      title: 'Contractors',
      entities: [
        entity('main-mc', 'Main Contractor', 'contractor', 'pi pi-building', pickOne(rng, CONTRACTORS), subs)
      ]
    });
  }

  if (chance(rng, chances.consultants)) {
    const consultants: StakeholderEntity[] = [];
    if (chance(rng, 0.9)) consultants.push(entity('arch', 'Architect', 'consultant', 'pi pi-pencil', pickOne(rng, ARCHITECTS)));
    if (chance(rng, 0.75)) consultants.push(entity('struct', 'Structural Consultant', 'consultant', 'pi pi-th-large'));
    if (chance(rng, 0.7)) consultants.push(entity('mep', 'MEP Consultant', 'consultant', 'pi pi-sitemap'));
    if (chance(rng, 0.45)) consultants.push(entity('pmc', 'PMC / Owner Engineer', 'consultant', 'pi pi-eye'));
    if (chance(rng, 0.25)) consultants.push(entity('bim', 'BIM Coordinator', 'consultant', 'pi pi-desktop'));
    if (consultants.length) groups.push({ id: 'consultants', title: 'Consultants & design', entities: consultants });
  }

  if (chance(rng, chances.client)) {
    const clientEntities: StakeholderEntity[] = [];
    if (chance(rng, 0.88)) clientEntities.push(entity('client-pm', 'Client Project Manager', 'client', 'pi pi-briefcase'));
    if (chance(rng, 0.6)) clientEntities.push(entity('owner-rep', 'Owner Representative', 'client', 'pi pi-users'));
    if (chance(rng, 0.4)) clientEntities.push(entity('end-user', 'End-user / FM', 'client', 'pi pi-home'));
    if (clientEntities.length) groups.push({ id: 'client', title: 'Client & stakeholders', entities: clientEntities });
  }

  if (chance(rng, chances.commercial)) {
    const commercial: StakeholderEntity[] = [];
    if (chance(rng, 0.8)) commercial.push(entity('qs', 'Quantity Surveyor', 'role', 'pi pi-calculator', 'Cost control'));
    if (chance(rng, 0.65)) commercial.push(entity('proc', 'Procurement', 'role', 'pi pi-shopping-cart'));
    if (chance(rng, 0.7)) commercial.push(entity('supplier-mat', 'Material Supplier', 'supplier', 'pi pi-truck', pickOne(rng, ['Ready-mix & steel', 'MEP bulk supply', 'Precast panels', 'Finishes package'])));
    if (chance(rng, 0.35)) commercial.push(entity('logistics', 'Logistics / Laydown', 'supplier', 'pi pi-truck', 'Site delivery'));
    if (commercial.length) groups.push({ id: 'commercial', title: 'Commercial', entities: commercial });
  }

  if (chance(rng, chances.hseq)) {
    const hseq: StakeholderEntity[] = [];
    if (chance(rng, 0.95)) hseq.push(entity('hse', 'HSE Officer', 'role', 'pi pi-shield', 'Site safety'));
    if (chance(rng, 0.8)) hseq.push(entity('qa', 'QA / QC Inspector', 'role', 'pi pi-check-circle'));
    if (chance(rng, 0.5)) hseq.push(entity('env', 'Environmental Officer', 'role', 'pi pi-globe'));
    if (hseq.length) groups.push({ id: 'hseq', title: 'HSEQ & quality', entities: hseq });
  }

  if (chance(rng, chances.authorities)) {
    const authorities: StakeholderEntity[] = [];
    if (chance(rng, 0.85)) authorities.push(entity('muni', 'Municipality', 'authority', 'pi pi-building-columns'));
    if (chance(rng, 0.7)) authorities.push(entity('civil-def', 'Civil Defense', 'authority', 'pi pi-exclamation-circle'));
    if (chance(rng, 0.55)) authorities.push(entity('utility', 'Utility providers', 'authority', 'pi pi-power-off', pickOne(rng, ['DEWA / ADDC', 'SEWA', 'FEWA'])));
    if (authorities.length) groups.push({ id: 'authorities', title: 'Authorities & permits', entities: authorities });
  }

  if (chance(rng, chances.siteSupport)) {
    const support: StakeholderEntity[] = [];
    if (chance(rng, 0.75)) support.push(entity('surveyor', 'Land Surveyor', 'vendor', 'pi pi-compass'));
    if (chance(rng, 0.65)) support.push(entity('testing', 'Testing laboratory', 'vendor', 'pi pi-filter'));
    if (chance(rng, 0.6)) support.push(entity('equipment', 'Equipment rental', 'vendor', 'pi pi-cog'));
    if (chance(rng, 0.55)) support.push(entity('manpower', 'Manpower agency', 'labor', 'pi pi-users'));
    if (chance(rng, 0.5)) support.push(entity('security', 'Site security', 'vendor', 'pi pi-lock'));
    if (chance(rng, 0.35)) support.push(entity('traffic', 'Traffic management', 'vendor', 'pi pi-car'));
    if (chance(rng, 0.3)) support.push(entity('waste', 'Waste management', 'vendor', 'pi pi-trash'));
    if (chance(rng, 0.25)) support.push(entity('commission', 'Commissioning agent', 'vendor', 'pi pi-check-square'));
    if (support.length) groups.push({ id: 'site-support', title: 'Site support', entities: support });
  }

  if (chance(rng, chances.finance)) {
    const finance: StakeholderEntity[] = [];
    if (chance(rng, 0.75)) finance.push(entity('bank', 'Project financier / Bank', 'finance', 'pi pi-wallet'));
    if (chance(rng, 0.8)) finance.push(entity('insurer', 'Insurer (CAR / TPL)', 'finance', 'pi pi-file'));
    if (chance(rng, 0.6)) finance.push(entity('bond', 'Performance bond provider', 'finance', 'pi pi-verified'));
    if (finance.length) groups.push({ id: 'finance', title: 'Finance & insurance', entities: finance });
  }

  return groups;
}

export function buildStakeholdersMap(projects: ProjectOverviewDemo[]): Record<string, StakeholderGroup[]> {
  return Object.fromEntries(projects.map((p) => [p.id, generateStakeholderGroupsForProject(p)]));
}
