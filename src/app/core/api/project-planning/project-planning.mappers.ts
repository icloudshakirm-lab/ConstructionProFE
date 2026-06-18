import type { ProjectPlanningProjectsDto, ProjectPlanningSitesDto } from './project-planning-api.models';
import type {
  ProjectApprovalStatus,
  ProjectLifecycleStatus,
  ProjectRegister
} from '../../../features/project-management/projects-register/projects-register.data';
import type {
  SiteApprovalStatus,
  SiteOperationalStatus,
  SiteRecord
} from '../../../features/project-management/sites-management/sites-management.data';

export function projectDtoToRegister(
  dto: ProjectPlanningProjectsDto,
  linkedSiteCount = 0
): ProjectRegister {
  return {
    id: dto.id,
    name: dto.name,
    client: dto.clientName,
    status: dto.status as ProjectLifecycleStatus,
    approvalStatus: dto.approvalStatus as ProjectApprovalStatus,
    contractValue: Number(dto.contractValue),
    currency: dto.currency,
    startDate: dto.startDate?.slice(0, 10) ?? '',
    endDate: dto.endDate?.slice(0, 10) ?? '',
    projectManager: dto.projectManager,
    scopeSummary: dto.scopeSummary ?? '',
    linkedSiteCount,
    audit: [],
    attachments: []
  };
}

export function siteDtoToRecord(
  dto: ProjectPlanningSitesDto,
  projectName: string
): SiteRecord {
  return {
    id: dto.id,
    projectId: dto.projectId,
    projectName,
    parentSiteId: dto.parentSiteId ?? null,
    name: dto.name,
    location: dto.location,
    superintendent: dto.superintendent?.trim() || '—',
    progressPct: Number(dto.progressPct),
    zoneCode: dto.zoneCode?.trim() ?? '',
    operationalStatus: (dto.operationalStatus as SiteOperationalStatus) || 'Active',
    approvalStatus: (dto.approvalStatus as SiteApprovalStatus) || 'draft',
    audit: [],
    attachments: []
  };
}

export function countSitesByProject(
  sites: Array<{ projectId: string }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const site of sites) {
    counts[site.projectId] = (counts[site.projectId] ?? 0) + 1;
  }
  return counts;
}
