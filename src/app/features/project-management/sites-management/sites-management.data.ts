import {
  DEMO_PROJECTS,
  type ConstructionSite,
  type ProjectSummary
} from '../projects-sites-org-chart/projects-sites-org-chart.data';

export type SiteTabId = 'hierarchy' | 'geofence' | 'contacts';
export type SiteApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type SiteOperationalStatus = 'Active' | 'Mobilizing' | 'Closed';
export type GeofenceZoneType = 'polygon' | 'circle' | 'corridor';

export interface SiteAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface SiteAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface SiteRecord {
  id: string;
  projectId: string;
  projectName: string;
  parentSiteId: string | null;
  name: string;
  location: string;
  superintendent: string;
  progressPct: number;
  zoneCode: string;
  operationalStatus: SiteOperationalStatus;
  approvalStatus: SiteApprovalStatus;
  audit: SiteAuditEntry[];
  attachments: SiteAttachment[];
}

export interface GeofenceRecord {
  id: string;
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  name: string;
  zoneType: GeofenceZoneType;
  radiusM: number | null;
  active: boolean;
  entryAlert: boolean;
  exitAlert: boolean;
  approvalStatus: SiteApprovalStatus;
  audit: SiteAuditEntry[];
  attachments: SiteAttachment[];
}

export interface SiteContactRecord {
  id: string;
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  approvalStatus: SiteApprovalStatus;
  audit: SiteAuditEntry[];
  attachments: SiteAttachment[];
}

export const SITE_PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const SITE_APPROVAL_FILTER_OPTIONS: { label: string; value: SiteApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const SITE_OPERATIONAL_OPTIONS = [
  { label: 'Active', value: 'Active' as SiteOperationalStatus },
  { label: 'Mobilizing', value: 'Mobilizing' as SiteOperationalStatus },
  { label: 'Closed', value: 'Closed' as SiteOperationalStatus }
];

export const GEOFENCE_TYPE_OPTIONS = [
  { label: 'Polygon', value: 'polygon' as GeofenceZoneType },
  { label: 'Circle', value: 'circle' as GeofenceZoneType },
  { label: 'Corridor', value: 'corridor' as GeofenceZoneType }
];

const SUPERINTENDENTS: Record<string, string> = {
  'S-001': 'R. Hassan',
  'S-002': 'R. Hassan',
  'S-003': 'M. Ali',
  'S-010': 'J. Patel',
  'S-011': 'J. Patel',
  'S-020': 'K. Ahmed',
  'S-021': 'K. Ahmed',
  'S-022': 'K. Ahmed',
  'S-030': 'N. Siddiqui',
  'S-031': 'F. Qureshi',
  'S-040': 'S. Rahman',
  'S-041': 'S. Rahman',
  'S-042': 'A. Khan'
};

const PARENT_SITES: Record<string, string> = {
  'S-002': 'S-001',
  'S-003': 'S-001',
  'S-021': 'S-020',
  'S-031': 'S-030'
};

export function auditTimestamp(): string {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).slice(-6)}`;
}

export function approvalLabel(status: SiteApprovalStatus): string {
  const map: Record<SiteApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return map[status];
}

export function approvalSeverity(
  status: SiteApprovalStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_approval':
      return 'warn';
    case 'rejected':
      return 'danger';
    case 'draft':
      return 'secondary';
  }
}

export function canSubmitForApproval(status: SiteApprovalStatus): boolean {
  return status === 'draft' || status === 'rejected';
}

export function canApproveOrReject(status: SiteApprovalStatus): boolean {
  return status === 'pending_approval';
}

function seedSite(project: ProjectSummary, site: ConstructionSite): SiteRecord {
  return {
    id: site.id,
    projectId: project.id,
    projectName: project.name,
    parentSiteId: PARENT_SITES[site.id] ?? null,
    name: site.name,
    location: site.location,
    superintendent: SUPERINTENDENTS[site.id] ?? 'Site Superintendent',
    progressPct: site.progressPct,
    zoneCode: site.location.replace(/\s+/g, '-').toUpperCase().slice(0, 12),
    operationalStatus: site.progressPct >= 100 ? 'Closed' : site.progressPct > 0 ? 'Active' : 'Mobilizing',
    approvalStatus: site.progressPct > 50 ? 'approved' : 'draft',
    audit: [{ at: auditTimestamp(), action: 'Site loaded from demo hierarchy', by: 'System' }],
    attachments: []
  };
}

export function initialSites(): SiteRecord[] {
  return DEMO_PROJECTS.flatMap((p) => p.sites.map((s) => seedSite(p, s)));
}

export function initialGeofences(sites: SiteRecord[]): GeofenceRecord[] {
  const rows: GeofenceRecord[] = [];
  for (const site of sites) {
    rows.push({
      id: `gf-${site.id}-main`,
      siteId: site.id,
      siteName: site.name,
      projectId: site.projectId,
      projectName: site.projectName,
      name: `${site.name} — main boundary`,
      zoneType: 'polygon',
      radiusM: null,
      active: true,
      entryAlert: true,
      exitAlert: true,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Geofence activated', by: 'GIS admin' }],
      attachments: []
    });
    if (site.progressPct > 0 && site.progressPct < 100) {
      rows.push({
        id: `gf-${site.id}-haul`,
        siteId: site.id,
        siteName: site.name,
        projectId: site.projectId,
        projectName: site.projectName,
        name: `${site.name} — haul road corridor`,
        zoneType: 'corridor',
        radiusM: 25,
        active: true,
        entryAlert: false,
        exitAlert: true,
        approvalStatus: 'pending_approval',
        audit: [{ at: auditTimestamp(), action: 'Corridor zone submitted', by: 'Site engineer' }],
        attachments: []
      });
    }
  }
  return rows;
}

export function initialContacts(sites: SiteRecord[]): SiteContactRecord[] {
  const contacts: SiteContactRecord[] = [];
  const roles = ['Site superintendent', 'Safety officer', 'Client representative', 'Gate security'];
  sites.forEach((site, idx) => {
    contacts.push({
      id: `ct-${site.id}-1`,
      siteId: site.id,
      siteName: site.name,
      projectId: site.projectId,
      projectName: site.projectName,
      name: site.superintendent,
      role: roles[0],
      phone: `+971 50 ${100 + idx} ${2000 + idx}`,
      email: `super.${site.id.toLowerCase()}@constructpro.demo`,
      isPrimary: true,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Primary contact designated', by: 'HR' }],
      attachments: []
    });
    if (idx % 2 === 0) {
      contacts.push({
        id: `ct-${site.id}-2`,
        siteId: site.id,
        siteName: site.name,
        projectId: site.projectId,
        projectName: site.projectName,
        name: `Safety — ${site.zoneCode}`,
        role: roles[1],
        phone: `+971 55 ${300 + idx} ${4000 + idx}`,
        email: `safety.${site.id.toLowerCase()}@constructpro.demo`,
        isPrimary: false,
        approvalStatus: 'draft',
        audit: [],
        attachments: []
      });
    }
  });
  return contacts;
}

export function siteHierarchyLabel(site: SiteRecord, sites: SiteRecord[]): string {
  if (!site.parentSiteId) return site.name;
  const parent = sites.find((s) => s.id === site.parentSiteId);
  return parent ? `${parent.name} › ${site.name}` : site.name;
}

export function siteDepth(site: SiteRecord, sites: SiteRecord[]): number {
  let depth = 0;
  let current: SiteRecord | undefined = site;
  while (current?.parentSiteId && depth < 5) {
    depth++;
    current = sites.find((s) => s.id === current!.parentSiteId);
  }
  return depth;
}

export function projectNameForId(projectId: string): string {
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function siteOptions(sites: SiteRecord[]): { label: string; value: string }[] {
  return sites.map((s) => ({
    label: `${s.name} (${s.projectName})`,
    value: s.id
  }));
}

export function parentSiteOptions(
  sites: SiteRecord[],
  projectId: string,
  excludeId?: string
): { label: string; value: string }[] {
  return [
    { label: '— Root site (no parent) —', value: '' },
    ...sites
      .filter((s) => s.projectId === projectId && s.id !== excludeId && !s.parentSiteId)
      .map((s) => ({ label: s.name, value: s.id }))
  ];
}
