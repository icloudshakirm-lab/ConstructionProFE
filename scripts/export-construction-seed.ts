/**
 * Exports frontend mock data → docs/construction-platform-seed-data.json
 * Run: npx --yes tsx scripts/export-construction-seed.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEMO_PROJECTS } from '../src/app/features/project-management/projects-sites-org-chart/projects-sites-org-chart.data';
import { initialProjectRegister } from '../src/app/features/project-management/projects-register/projects-register.data';
import {
  DEMO_BOQ_SECTIONS,
  ITEM_CODE_CATALOG
} from '../src/app/features/boq-billing/boq-creation/boq-creation.data';
import { DEMO_BOQ_REVISIONS } from '../src/app/features/boq-billing/boq-revisions/boq-revisions.data';
import {
  initialMaterialIssuances,
  MATERIAL_CATALOG
} from '../src/app/features/store-inventory/material-issuance/material-issuance.data';
import { initialConsumptionRecords } from '../src/app/features/store-inventory/material-consumption/material-consumption.data';
import { initialPartnerRecords } from '../src/app/features/contractors-vendors/partners-directory/partners-directory.data';
import { initialBidPlans } from '../src/app/features/bidding/bid-planning/bid-planning.data';
import { initialBidRegisters } from '../src/app/features/bidding/bids-register/bids-register.data';
import { DEMO_QA_QC_INSPECTIONS } from '../src/app/features/project-management/qa-qc-inspections/qa-qc-inspections.data';
import { initialDailyProgressRecords } from '../src/app/features/site-mobile/daily-progress/daily-progress.data';
import { initialEmployeeRecords } from '../src/app/features/hr-payroll/employee-records/employee-records.data';
import { initialAttendanceRecords } from '../src/app/features/hr-payroll/hr-attendance/hr-attendance.data';
import { initialPayrollRuns } from '../src/app/features/hr-payroll/payroll/payroll.data';
import { DEMO_DRAWINGS } from '../src/app/features/document-management/drawing-viewer/drawings.data';
import { DEMO_NOTES } from '../src/app/features/collaboration/notes/notes.data';
import { DEMO_TODOS } from '../src/app/features/collaboration/todo/todo.data';
import { DEMO_MESSAGES } from '../src/app/features/collaboration/messages/messages.data';
import { DEMO_MILESTONES } from '../src/app/features/collaboration/milestones/milestones.data';
import { initialFleetVehicles } from '../src/app/features/site-mobile/vehicle-tracking/vehicle-tracking.data';
import { GPS_TRACKERS } from '../src/app/features/site-mobile/gps-tracking/gps-tracking.data';
import { CONSTRUCTION_GANTT_TASKS } from '../src/app/features/project-management/gantt-chart/gantt-chart.data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'docs', 'construction-platform-seed-data.json');

/** BOQ module slugs → canonical project IDs used elsewhere in the app. */
const PROJECT_ID_MAP: Record<string, string> = {
  'tower-a': 'P-001',
  'warehouse-p2': 'P-002',
  'roadworks-c': 'P-003'
};

const LEGACY_BOQ_SLUG_BY_PROJECT: Record<string, string> = {
  'P-001': 'tower-a',
  'P-002': 'warehouse-p2',
  'P-003': 'roadworks-c'
};

const PROJECT_NAME_TO_ID: Record<string, string> = {
  'Tower Block A': 'P-001',
  'Warehouse Expansion': 'P-002',
  'Roadworks Package C': 'P-003',
  'Central Hospital Wing B': 'P-004',
  'Marina Promenade': 'P-005'
};

function mapProjectId(id: string | null | undefined): string | null {
  if (!id) return null;
  return PROJECT_ID_MAP[id] ?? id;
}

function projectIdFromName(name: string): string | null {
  for (const [key, id] of Object.entries(PROJECT_NAME_TO_ID)) {
    if (name.includes(key) || name.startsWith(key.split(' ')[0])) {
      if (name.includes('Tower Block A') || name === 'Tower Block A') return 'P-001';
      if (name.includes('Warehouse')) return 'P-002';
      if (name.includes('Roadworks')) return 'P-003';
      if (name.includes('Hospital')) return 'P-004';
      if (name.includes('Marina')) return 'P-005';
    }
  }
  const hit = Object.entries(PROJECT_NAME_TO_ID).find(([k]) => name.includes(k));
  return hit?.[1] ?? null;
}

function siteIdFromProjectAndName(projectId: string | null, siteName: string): string | null {
  if (!projectId) return null;
  const project = DEMO_PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;
  const site = project.sites.find((s) => s.name === siteName || siteName.includes(s.name));
  return site?.id ?? null;
}

// ─── Normalize master data ───────────────────────────────────────────────────

const projects = initialProjectRegister().map((p) => ({
  id: p.id,
  name: p.name,
  client: p.client,
  status: p.status,
  approvalStatus: p.approvalStatus,
  contractValue: p.contractValue,
  currency: p.currency,
  startDate: p.startDate,
  endDate: p.endDate,
  projectManager: p.projectManager,
  scopeSummary: p.scopeSummary,
  linkedSiteCount: p.linkedSiteCount,
  legacyBoqSlug: LEGACY_BOQ_SLUG_BY_PROJECT[p.id] ?? null,
  erpCostCenterId: null
}));

const sites: object[] = [];
const siteMilestones: object[] = [];

for (const p of DEMO_PROJECTS) {
  for (const s of p.sites) {
    sites.push({
      id: s.id,
      projectId: p.id,
      name: s.name,
      location: s.location,
      progressPct: s.progressPct
    });
    for (const m of s.milestones) {
      siteMilestones.push({
        id: m.id,
        siteId: s.id,
        projectId: p.id,
        name: m.name,
        status: m.status,
        targetDate: m.targetDate ?? null
      });
    }
  }
}

const itemCodeCatalog = ITEM_CODE_CATALOG.map((item, i) => ({
  id: `icc-${i + 1}`,
  code: item.code,
  description: item.description,
  unit: item.unit,
  typicalRate: item.typicalRate
}));

const boqSections: object[] = [];
const boqLineItems: object[] = [];

for (const section of DEMO_BOQ_SECTIONS) {
  boqSections.push({
    id: section.id,
    projectId: 'P-001',
    code: section.code,
    title: section.title,
    parentId: section.parentId
  });
  for (const item of section.items) {
    boqLineItems.push({
      id: item.id,
      sectionId: section.id,
      projectId: 'P-001',
      itemNo: item.itemNo,
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      qty: item.qty,
      rate: item.rate,
      amount: Math.round(item.qty * item.rate * 100) / 100
    });
  }
}

const boqRevisions: object[] = [];
const boqRevisionLineSnapshots: object[] = [];

for (const rev of DEMO_BOQ_REVISIONS) {
  const projectId = mapProjectId(rev.projectId)!;
  boqRevisions.push({
    id: rev.id,
    projectId,
    revisionNo: rev.revisionNo,
    title: rev.title,
    status: rev.status,
    createdAt: rev.createdAt,
    createdBy: rev.createdBy,
    effectiveDate: rev.effectiveDate,
    approvedAt: rev.approvedAt,
    approvedBy: rev.approvedBy,
    changeSummary: rev.changeSummary
  });
  rev.lines.forEach((line, idx) => {
    boqRevisionLineSnapshots.push({
      id: `${rev.id}-ln-${idx + 1}`,
      revisionId: rev.id,
      lineOrder: idx + 1,
      sectionCode: line.sectionCode,
      itemCode: line.itemCode,
      description: line.description,
      unit: line.unit,
      qty: line.qty,
      rate: line.rate,
      amount: Math.round(line.qty * line.rate * 100) / 100
    });
  });
}

const materialCatalog = MATERIAL_CATALOG.map((m, i) => ({
  id: `mat-${i + 1}`,
  code: m.code,
  name: m.name,
  unit: m.unit,
  typicalRate: m.typicalRate,
  boqItemId: m.boqItemId,
  erpItemId: null
}));

const costCodes = [
  { id: 'cc-civ-01', code: 'CIV-01', name: 'Substructure', erpCostCategoryId: null },
  { id: 'cc-civ-02', code: 'CIV-02', name: 'Superstructure', erpCostCategoryId: null },
  { id: 'cc-str-01', code: 'STR-01', name: 'Reinforcement', erpCostCategoryId: null },
  { id: 'cc-mep-01', code: 'MEP-01', name: 'Electrical', erpCostCategoryId: null },
  { id: 'cc-mep-02', code: 'MEP-02', name: 'Mechanical', erpCostCategoryId: null },
  { id: 'cc-fin-01', code: 'FIN-01', name: 'Finishes', erpCostCategoryId: null }
];

const warehouses = [
  { id: 'wh-ho', name: 'Central store — HO', projectId: null, siteId: null },
  { id: 'wh-s001', name: 'Site store — Basement Works', projectId: 'P-001', siteId: 'S-001' },
  { id: 'wh-s002', name: 'Site store — Superstructure', projectId: 'P-001', siteId: 'S-002' },
  { id: 'wh-s011', name: 'Site store — Warehouse Bay 2', projectId: 'P-002', siteId: 'S-011' }
];

const materialIssuances: object[] = [];
const materialIssueLines: object[] = [];
const entityAuditLog: object[] = [];
const entityAttachments: object[] = [];

for (const iss of initialMaterialIssuances()) {
  materialIssuances.push({
    id: iss.id,
    issueNumber: iss.issueNumber,
    issueDate: iss.issueDate,
    projectId: iss.projectId,
    siteId: iss.siteId,
    warehouse: iss.warehouse,
    costCode: iss.costCode,
    requisitionRef: iss.requisitionRef,
    requestedBy: iss.requestedBy,
    issuedBy: iss.issuedBy || null,
    status: iss.status,
    approvalStatus: iss.approvalStatus,
    remarks: iss.remarks
  });
  for (const line of iss.lines) {
    materialIssueLines.push({
      id: line.id,
      issuanceId: iss.id,
      boqItemId: line.boqItemId,
      boqItemCode: line.boqItemCode,
      boqDescription: line.boqDescription,
      boqSection: line.boqSection,
      materialCode: line.materialCode,
      materialName: line.materialName,
      unit: line.unit,
      issuedQty: line.issuedQty,
      unitRate: line.unitRate,
      boqBudgetQty: line.boqBudgetQty,
      boqBudgetAmount: line.boqBudgetAmount,
      lineAmount: Math.round(line.issuedQty * line.unitRate * 100) / 100
    });
  }
  for (const a of iss.audit) {
    entityAuditLog.push({
      id: `aud-${iss.id}-${entityAuditLog.length}`,
      entityType: 'material_issuances',
      entityId: iss.id,
      at: a.at,
      action: a.action,
      by: a.by
    });
  }
  for (const att of iss.attachments) {
    entityAttachments.push({
      ...att,
      entityType: 'material_issuances',
      entityId: iss.id
    });
  }
}

const materialConsumption: object[] = [];
const consumptionIssuanceRefs: object[] = [];

for (const c of initialConsumptionRecords()) {
  materialConsumption.push({
    id: c.id,
    projectId: c.projectId,
    siteId: c.siteId ?? null,
    boqItemId: c.boqItemId,
    itemCode: c.boqItemCode,
    description: c.boqDescription,
    boqSection: c.boqSection,
    costCode: c.costCode,
    unit: c.unit,
    budgetQty: c.budgetQty,
    budgetAmount: c.budgetAmount,
    boqRate: c.boqRate,
    consumedQty: c.consumedQty,
    consumedAmount: c.consumedAmount,
    remainingQty: c.remainingQty,
    remainingAmount: c.remainingAmount,
    varianceQtyPct: c.varianceQtyPct,
    varianceAmountPct: c.varianceAmountPct,
    status: c.status,
    approvalStatus: c.approvalStatus,
    lastUpdated: c.lastUpdated,
    notes: c.notes
  });
  for (const ref of c.issuanceRefs ?? []) {
    consumptionIssuanceRefs.push({
      id: ref.id,
      consumptionId: c.id,
      issueNumber: ref.issueNumber,
      issueDate: ref.issueDate,
      siteId: ref.siteId,
      materialCode: ref.materialCode,
      materialName: ref.materialName,
      qty: ref.qty,
      unit: ref.unit,
      amount: ref.amount
    });
  }
}

const partners: object[] = [];
const partnerContacts: object[] = [];
const partnerCertifications: object[] = [];
const partnerProjects: object[] = [];

for (const p of initialPartnerRecords()) {
  partners.push({
    id: p.id,
    companyCode: p.companyCode,
    companyType: p.companyType,
    legalName: p.legalName,
    tradeName: p.tradeName,
    status: p.status,
    approvalStatus: p.approvalStatus,
    tradeLicense: p.tradeLicense,
    taxRegistration: p.taxRegistration,
    commercialRegistration: p.commercialRegistration,
    primaryContactName: p.primaryContactName,
    primaryEmail: p.primaryEmail,
    primaryPhone: p.primaryPhone,
    address: p.address,
    city: p.city,
    country: p.country,
    specialties: p.specialties,
    parentContractorId: p.parentContractorId,
    paymentTerms: p.paymentTerms,
    currency: p.currency,
    creditLimit: p.creditLimit,
    bankName: p.bankName,
    iban: p.iban,
    prequalificationExpiry: p.prequalificationExpiry,
    notes: p.notes,
    erpLedgerId: null
  });
  for (const c of p.contacts) {
    partnerContacts.push({ ...c, partnerId: p.id });
  }
  for (const cert of p.certifications) {
    partnerCertifications.push({ ...cert, partnerId: p.id });
  }
  for (const projectId of p.assignedProjectIds) {
    partnerProjects.push({ partnerId: p.id, projectId });
  }
  for (const a of p.audit) {
    entityAuditLog.push({
      id: `aud-${p.id}-${a.at}`,
      entityType: 'partners',
      entityId: p.id,
      at: a.at,
      action: a.action,
      by: a.by
    });
  }
  for (const att of p.attachments) {
    entityAttachments.push({ ...att, entityType: 'partners', entityId: p.id });
  }
}

const bidPlans: object[] = [];
for (const bp of initialBidPlans()) {
  bidPlans.push({
    id: bp.id,
    planCode: bp.planCode,
    opportunityName: bp.opportunityName,
    clientName: bp.clientName,
    sector: bp.sector,
    estimatedValue: bp.estimatedValue,
    currency: bp.currency,
    location: bp.location,
    rfpReceivedDate: bp.rfpReceivedDate,
    bidDueDate: bp.bidDueDate,
    status: bp.status,
    winProbabilityPct: bp.winProbabilityPct,
    bidManager: bp.bidManager,
    estimator: bp.estimator,
    goNoGoDate: bp.goNoGoDate || null,
    scopeSummary: bp.scopeSummary,
    risks: bp.risks,
    linkedInwardBidId: bp.linkedInwardBidId,
    approvalStatus: bp.approvalStatus
  });
  for (const a of bp.audit) {
    entityAuditLog.push({
      id: `aud-${bp.id}-${a.at}`,
      entityType: 'bid_plans',
      entityId: bp.id,
      at: a.at,
      action: a.action,
      by: a.by
    });
  }
  for (const att of bp.attachments) {
    entityAttachments.push({ ...att, entityType: 'bid_plans', entityId: bp.id });
  }
}

const bids: object[] = [];
const bidQuotations: object[] = [];
const bidInvitedPartners: object[] = [];

for (const b of initialBidRegisters()) {
  const isOutward = b.bidDirection === 'outward';
  bids.push({
    id: b.id,
    bidNumber: b.bidNumber,
    bidDirection: b.bidDirection,
    projectName: isOutward ? null : (b as { projectName: string }).projectName,
    clientName: isOutward ? null : (b as { clientName: string }).clientName,
    tenderReference: isOutward ? null : (b as { tenderReference: string }).tenderReference,
    bidType: isOutward ? null : (b as { bidType: string }).bidType,
    submissionDeadline: isOutward ? null : (b as { submissionDeadline: string }).submissionDeadline,
    submittedDate: isOutward ? null : (b as { submittedDate: string }).submittedDate || null,
    bidValue: isOutward ? null : (b as { bidValue: number }).bidValue,
    marginPct: isOutward ? null : (b as { marginPct: number }).marginPct,
    bondRequired: isOutward ? null : (b as { bondRequired: boolean }).bondRequired,
    bondAmount: isOutward ? null : (b as { bondAmount: number }).bondAmount,
    competitors: isOutward ? null : (b as { competitors: string }).competitors,
    bidPlanId: isOutward ? null : (b as { bidPlanId: string | null }).bidPlanId,
    inwardStatus: isOutward ? null : (b as { inwardStatus: string }).inwardStatus,
    packageName: isOutward ? (b as { packageName: string }).packageName : null,
    projectId: isOutward ? (b as { projectId: string }).projectId : null,
    siteId: isOutward ? (b as { siteId: string }).siteId : null,
    tradePackage: isOutward ? (b as { tradePackage: string }).tradePackage : null,
    invitationDate: isOutward ? (b as { invitationDate: string }).invitationDate : null,
    closingDate: isOutward ? (b as { closingDate: string }).closingDate : null,
    targetBudget: isOutward ? (b as { targetBudget: number }).targetBudget : null,
    currency: b.currency,
    awardedPartnerId: isOutward ? (b as { awardedPartnerId: string | null }).awardedPartnerId : null,
    awardedValue: isOutward ? (b as { awardedValue: number }).awardedValue : null,
    outwardStatus: isOutward ? (b as { outwardStatus: string }).outwardStatus : null,
    bidManager: b.bidManager,
    scopeSummary: b.scopeSummary,
    approvalStatus: b.approvalStatus
  });
  if (isOutward && 'invitedPartners' in b) {
    for (const partnerId of b.invitedPartners) {
      bidInvitedPartners.push({ bidId: b.id, partnerId });
    }
    for (const q of b.quotations ?? []) {
      bidQuotations.push({ ...q, bidId: b.id });
    }
  }
  for (const a of b.audit) {
    entityAuditLog.push({
      id: `aud-${b.id}-${a.at}`,
      entityType: 'bids',
      entityId: b.id,
      at: a.at,
      action: a.action,
      by: a.by
    });
  }
  for (const att of b.attachments) {
    entityAttachments.push({ ...att, entityType: 'bids', entityId: b.id });
  }
}

const qaInspections: object[] = [];
const qaInspectionHistory: object[] = [];

for (const insp of DEMO_QA_QC_INSPECTIONS) {
  qaInspections.push({
    id: insp.id,
    refNo: insp.refNo,
    projectId: mapProjectId(insp.projectId),
    siteName: insp.siteName,
    wbsTask: insp.wbsTask,
    workPackage: insp.workPackage,
    description: insp.description,
    status: insp.status,
    siteTeamAssignee: insp.siteTeamAssignee,
    qaEngineer: insp.qaEngineer,
    requestedAt: insp.requestedAt,
    inspectedAt: insp.inspectedAt,
    approvedAt: insp.approvedAt,
    reworkCount: insp.reworkCount,
    correctiveActionNote: insp.correctiveActionNote
  });
  for (const h of insp.history) {
    qaInspectionHistory.push({ ...h, inspectionId: insp.id });
  }
}

const dailySiteReports: object[] = [];
const dsrQuantityLines: object[] = [];
const dsrPhotos: object[] = [];

for (const dsr of initialDailyProgressRecords()) {
  dailySiteReports.push({
    id: dsr.id,
    dsrNumber: dsr.dsrNumber,
    reportDate: dsr.reportDate,
    projectId: dsr.projectId,
    siteId: dsr.siteId,
    submittedBy: dsr.submittedBy,
    supervisorName: dsr.supervisorName,
    weather: dsr.weather,
    temperatureC: dsr.temperatureC,
    humidityPct: dsr.humidityPct,
    windSpeedKmh: dsr.windSpeedKmh,
    manpowerCount: dsr.manpowerCount,
    equipmentCount: dsr.equipmentCount,
    workSummary: dsr.workSummary,
    safetyNotes: dsr.safetyNotes,
    incidents: dsr.incidents,
    supervisorSignOff: dsr.supervisorSignOff,
    signOffAt: dsr.signOffAt || null,
    signOffBy: dsr.signOffBy || null,
    approvalStatus: dsr.approvalStatus
  });
  for (const q of dsr.quantities) {
    dsrQuantityLines.push({ ...q, dsrId: dsr.id });
  }
  for (const ph of dsr.photos) {
    dsrPhotos.push({ ...ph, dsrId: dsr.id });
  }
  for (const a of dsr.audit ?? []) {
    entityAuditLog.push({
      id: `aud-${dsr.id}-${a.at}`,
      entityType: 'daily_site_reports',
      entityId: dsr.id,
      at: a.at,
      action: a.action,
      by: a.by
    });
  }
  for (const att of dsr.attachments ?? []) {
    entityAttachments.push({ ...att, entityType: 'daily_site_reports', entityId: dsr.id });
  }
}

const employees = initialEmployeeRecords().map((e) => ({
  id: e.id,
  employeeCode: e.employeeCode,
  firstName: e.firstName,
  middleName: e.middleName,
  lastName: e.lastName,
  dateOfBirth: e.dateOfBirth,
  gender: e.gender,
  nationality: e.nationality,
  maritalStatus: e.maritalStatus,
  personalEmail: e.personalEmail,
  personalPhone: e.personalPhone,
  emergencyContactName: e.emergencyContactName,
  emergencyContactPhone: e.emergencyContactPhone,
  emergencyContactRelation: e.emergencyContactRelation,
  governmentIdType: e.governmentIdType,
  governmentIdNumber: e.governmentIdNumber,
  workEmail: e.workEmail,
  workPhone: e.workPhone,
  designation: e.designation,
  department: e.department,
  grade: e.grade,
  employmentType: e.employmentType,
  joinDate: e.joinDate,
  confirmationDate: e.confirmationDate || null,
  terminationDate: e.terminationDate || null,
  reportingManager: e.reportingManager,
  status: e.status,
  projectId: e.projectId,
  siteId: e.siteId,
  basicSalary: e.basicSalary,
  currency: e.currency,
  bankName: e.bankName,
  bankAccountNumber: e.bankAccountNumber,
  iban: e.iban,
  presentAddress: e.presentAddress,
  permanentAddress: e.permanentAddress,
  city: e.city,
  country: e.country,
  approvalStatus: e.approvalStatus
}));

const employeeEducation: object[] = [];
const employeeWorkHistory: object[] = [];

for (const e of initialEmployeeRecords()) {
  for (const ed of e.education) {
    employeeEducation.push({ ...ed, employeeId: e.id });
  }
  for (const wh of e.workHistory) {
    employeeWorkHistory.push({ ...wh, employeeId: e.id });
  }
}

const attendanceRecords = initialAttendanceRecords().map((a) => ({ ...a }));

const payrollRuns: object[] = [];
const payrollLineItems: object[] = [];
const payrollProjectAllocations: object[] = [];

for (const run of initialPayrollRuns()) {
  payrollRuns.push({
    id: run.id,
    periodMonth: run.periodMonth,
    periodLabel: run.periodLabel,
    status: run.status,
    employeeCount: run.employeeCount,
    totalGross: run.totalGross,
    totalDeductions: run.totalDeductions,
    totalNet: run.totalNet,
    currency: run.currency,
    bankFileGenerated: run.bankFileGenerated
  });
  for (const line of run.lines) {
    payrollLineItems.push({
      id: line.id,
      payrollRunId: run.id,
      employeeId: line.employeeId,
      employeeCode: line.employeeCode,
      employeeName: line.employeeName,
      department: line.department,
      basicSalary: line.basicSalary,
      currency: line.currency,
      daysWorked: line.daysWorked,
      daysInMonth: line.daysInMonth,
      overtimeHours: line.overtimeHours,
      overtimePay: line.overtimePay,
      allowances: line.allowances,
      grossPay: line.grossPay,
      statutoryDeductions: line.statutoryDeductions,
      netPay: line.netPay
    });
    for (const alloc of line.projectAllocations ?? []) {
      payrollProjectAllocations.push({
        id: `ppa-${line.id}-${alloc.projectId}`,
        payrollLineItemId: line.id,
        projectId: alloc.projectId,
        projectName: alloc.projectName,
        allocationPct: alloc.allocationPct,
        chargedAmount: alloc.chargedAmount
      });
    }
  }
}

const drawings = DEMO_DRAWINGS.map((d) => ({
  id: d.id,
  sheet: d.sheet,
  title: d.title,
  discipline: d.discipline,
  revision: d.revision,
  format: d.format,
  fileUrl: d.fileUrl,
  projectId: projectIdFromName(d.project) ?? 'P-001',
  updated: d.updated
}));

const projectNotes = DEMO_NOTES.map((n) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  projectId: projectIdFromName(n.project),
  author: n.author,
  updatedAt: n.updatedAt,
  pinned: n.pinned
}));

const todos = DEMO_TODOS.map((t) => ({
  id: t.id,
  title: t.title,
  projectId: projectIdFromName(t.project),
  assignee: t.assignee,
  dueDate: t.dueDate,
  priority: t.priority,
  completed: t.completed
}));

const messages = DEMO_MESSAGES.map((m) => ({
  id: m.id,
  subject: m.subject,
  preview: m.preview,
  body: m.body,
  from: m.from,
  to: m.to,
  projectId: projectIdFromName(m.project),
  channel: m.channel,
  sentAt: m.sentAt,
  read: m.read
}));

const contractMilestones = DEMO_MILESTONES.map((m) => ({
  id: m.id,
  name: m.name,
  projectId: projectIdFromName(m.project),
  siteId: siteIdFromProjectAndName(projectIdFromName(m.project), m.site),
  plannedDate: m.plannedDate,
  forecastDate: m.forecastDate,
  status: m.status,
  owner: m.owner
}));

const ganttTasks = CONSTRUCTION_GANTT_TASKS.map((t) => ({
  id: t.id,
  projectId: 'P-001',
  name: t.name,
  startDate: t.start,
  endDate: t.end,
  progressPct: t.progress,
  dependencies: t.dependencies ?? null,
  customClass: t.custom_class ?? null
}));

const fleetVehicles = initialFleetVehicles().map((v) => ({
  id: v.id,
  name: v.name,
  plateNumber: v.plateNumber,
  vehicleType: v.vehicleType,
  driverEmployeeId: v.driverEmployeeId,
  driverName: v.driverName,
  projectId: v.projectId,
  projectName: v.projectName,
  speedLimitKph: v.speedLimitKph,
  deviceId: v.deviceId,
  notes: v.notes,
  status: v.status,
  lat: v.lat,
  lng: v.lng,
  speedKph: v.speedKph,
  idleMinutes: v.idleMinutes,
  odometerKm: v.odometerKm,
  fuelPct: v.fuelPct,
  lastUpdate: v.lastUpdate
}));

const gpsTrackers = GPS_TRACKERS.map((t) => ({
  id: t.id,
  name: t.name,
  type: t.type,
  role: t.role,
  projectId: t.projectId,
  projectName: t.projectName,
  status: t.status,
  lat: t.lat,
  lng: t.lng,
  speedKph: t.speedKph,
  headingDeg: t.headingDeg,
  batteryPct: t.batteryPct,
  lastUpdate: t.lastUpdate,
  deviceId: t.deviceId
}));

const seed = {
  meta: {
    title: 'ConstructPro — Construction Platform Seed Data',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    source: 'ConstructionProFE frontend mock data (.data.ts modules)',
    specReference: 'docs/construction-platform-backend-spec.json v1.1.0',
    projectIdMap: PROJECT_ID_MAP,
    legacyBoqSlugByProject: LEGACY_BOQ_SLUG_BY_PROJECT,
    importOrder: [
      'projects',
      'sites',
      'site_milestones',
      'cost_codes',
      'warehouses',
      'item_code_catalog',
      'boq_sections',
      'boq_line_items',
      'boq_revisions',
      'boq_revision_line_snapshots',
      'material_catalog',
      'partners',
      'partner_contacts',
      'partner_certifications',
      'partner_projects',
      'bid_plans',
      'bids',
      'bid_quotations',
      'bid_invited_partners',
      'material_issuances',
      'material_issue_lines',
      'material_consumption',
      'consumption_issuance_refs',
      'qa_inspections',
      'qa_inspection_history',
      'daily_site_reports',
      'dsr_quantity_lines',
      'dsr_photos',
      'employees',
      'employee_education',
      'employee_work_history',
      'attendance_records',
      'payroll_runs',
      'payroll_line_items',
      'payroll_project_allocations',
      'drawings',
      'project_notes',
      'todos',
      'messages',
      'contract_milestones',
      'gantt_tasks',
      'fleet_vehicles',
      'gps_trackers',
      'entity_audit_log',
      'entity_attachments'
    ],
    counts: {} as Record<string, number>
  },
  projects,
  sites,
  site_milestones: siteMilestones,
  cost_codes: costCodes,
  warehouses,
  item_code_catalog: itemCodeCatalog,
  boq_sections: boqSections,
  boq_line_items: boqLineItems,
  boq_revisions: boqRevisions,
  boq_revision_line_snapshots: boqRevisionLineSnapshots,
  material_catalog: materialCatalog,
  partners,
  partner_contacts: partnerContacts,
  partner_certifications: partnerCertifications,
  partner_projects: partnerProjects,
  bid_plans: bidPlans,
  bids,
  bid_quotations: bidQuotations,
  bid_invited_partners: bidInvitedPartners,
  material_issuances: materialIssuances,
  material_issue_lines: materialIssueLines,
  material_consumption: materialConsumption,
  consumption_issuance_refs: consumptionIssuanceRefs,
  qa_inspections: qaInspections,
  qa_inspection_history: qaInspectionHistory,
  daily_site_reports: dailySiteReports,
  dsr_quantity_lines: dsrQuantityLines,
  dsr_photos: dsrPhotos,
  employees,
  employee_education: employeeEducation,
  employee_work_history: employeeWorkHistory,
  attendance_records: attendanceRecords,
  payroll_runs: payrollRuns,
  payroll_line_items: payrollLineItems,
  payroll_project_allocations: payrollProjectAllocations,
  drawings,
  project_notes: projectNotes,
  todos,
  messages,
  contract_milestones: contractMilestones,
  gantt_tasks: ganttTasks,
  fleet_vehicles: fleetVehicles,
  gps_trackers: gpsTrackers,
  entity_audit_log: entityAuditLog,
  entity_attachments: entityAttachments
};

for (const key of seed.meta.importOrder) {
  const table = (seed as Record<string, unknown>)[key];
  if (Array.isArray(table)) {
    seed.meta.counts[key] = table.length;
  }
}

writeFileSync(OUT, JSON.stringify(seed, null, 2), 'utf8');
console.log(`Wrote ${OUT}`);
console.log('Row counts:', seed.meta.counts);
