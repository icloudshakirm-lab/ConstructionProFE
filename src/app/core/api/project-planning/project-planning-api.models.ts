/** DTOs aligned with swagger v1 — /api/v1/project-planning/* */

export interface ProjectPlanningProjectsDto {
  id: string;
  legacyBoqSlug?: string | null;
  code: string;
  name: string;
  clientName: string;
  clientId?: string | null;
  status: string;
  approvalStatus: string;
  contractValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  projectManager: string;
  scopeSummary: string;
  erpCostCenterId?: number | null;
}

export interface CreateProjectsRequest {
  id: string;
  legacyBoqSlug?: string | null;
  code: string;
  name: string;
  clientName: string;
  clientId?: string | null;
  status: string;
  approvalStatus: string;
  contractValue: number;
  currency: string;
  startDate: string;
  endDate: string;
  projectManager: string;
  scopeSummary: string;
  erpCostCenterId?: number | null;
}

export type UpdateProjectsRequest = Omit<CreateProjectsRequest, 'id'>;

export interface CreateProjectsResponse {
  id: string;
}

export interface ProjectPlanningSitesDto {
  id: string;
  projectId: string;
  parentSiteId?: string | null;
  name: string;
  location: string;
  zoneCode?: string | null;
  superintendent?: string | null;
  progressPct: number;
  operationalStatus: string;
  approvalStatus: string;
  lat?: number | null;
  lng?: number | null;
}

export interface CreateSitesRequest {
  id: string;
  projectId: string;
  parentSiteId?: string | null;
  name: string;
  location: string;
  zoneCode?: string | null;
  superintendent?: string | null;
  progressPct: number;
  operationalStatus: string;
  approvalStatus: string;
  lat?: number | null;
  lng?: number | null;
}

export type UpdateSitesRequest = Omit<CreateSitesRequest, 'id'>;

export interface CreateSitesResponse {
  id: string;
}

export interface ProjectPlanningSiteSummaryDto {
  id: string;
  name: string;
  location: string;
  progressPct: number;
}

export interface BoqLineDto {
  id: string;
  sectionId: string;
  itemNo: string;
  itemCode: string;
  description: string;
  unit: string;
  budgetQty: number;
  budgetRate: number;
  budgetAmount: number;
}

export interface ProjectPlanningBidPlansDto {
  id: string;
  planCode: string;
  opportunityName: string;
  clientName: string;
  sector: string;
  estimatedValue: number;
  currency: string;
  location: string;
  rfpReceivedDate: string;
  bidDueDate: string;
  status: string;
  winProbabilityPct: number;
  bidManager: string;
  estimator: string;
  goNoGoDate?: string | null;
  scopeSummary: string;
  risks?: string | null;
  linkedInwardBidId?: string | null;
  approvalStatus: string;
}

export interface ProjectPlanningBidsDto {
  id: string;
  bidNumber: string;
  bidDirection: string;
  bidManager?: string | null;
  scopeSummary?: string | null;
  currency: string;
  approvalStatus: string;
  bidPlanId?: string | null;
  projectId?: string | null;
  siteId?: string | null;
  projectName?: string | null;
  clientName?: string | null;
  tenderReference?: string | null;
  bidType?: string | null;
  submissionDeadline?: string | null;
  submittedDate?: string | null;
  bidValue?: number | null;
  marginPct?: number | null;
  bondRequired?: boolean | null;
  bondAmount?: number | null;
  competitors?: string | null;
  inwardStatus?: string | null;
  packageName?: string | null;
  tradePackage?: string | null;
  invitationDate?: string | null;
  closingDate?: string | null;
  targetBudget?: number | null;
  awardedPartnerId?: string | null;
  awardedValue?: number | null;
  outwardStatus?: string | null;
}

export type CreateBidsRequest = ProjectPlanningBidsDto;
export type UpdateBidsRequest = Omit<ProjectPlanningBidsDto, 'id'>;
export interface CreateBidsResponse {
  id: string;
}

export interface ProjectPlanningPartnersDto {
  id: string;
  companyCode: string;
  companyType: string;
  legalName: string;
  tradeName?: string | null;
  status: string;
  approvalStatus: string;
  parentContractorId?: string | null;
  erpLedgerId?: number | null;
  primaryContactName: string;
  primaryEmail: string;
  primaryPhone: string;
  address: string;
  city: string;
  country: string;
  paymentTerms?: string | null;
  currency: string;
  creditLimit?: number | null;
  tradeLicense?: string | null;
  taxRegistration?: string | null;
  commercialRegistration?: string | null;
  bankName?: string | null;
  iban?: string | null;
  prequalificationExpiry?: string | null;
  notes?: string | null;
}

export type CreatePartnersRequest = ProjectPlanningPartnersDto;
export type UpdatePartnersRequest = Omit<ProjectPlanningPartnersDto, 'id'>;
export interface CreatePartnersResponse {
  id: string;
}

export interface ProjectPlanningMaterialIssuancesDto {
  id: string;
  issueNumber: string;
  issueDate: string;
  projectId: string;
  siteId: string;
  warehouseId: string;
  costCode: string;
  requisitionRef?: string | null;
  requestedByUserId: string;
  issuedByUserId?: string | null;
  status: string;
  approvalStatus: string;
  remarks?: string | null;
  erpTransactionId?: number | null;
}

export type CreateMaterialIssuancesRequest = ProjectPlanningMaterialIssuancesDto;
export type UpdateMaterialIssuancesRequest = Omit<ProjectPlanningMaterialIssuancesDto, 'id'>;
export interface CreateMaterialIssuancesResponse {
  id: string;
}

export interface ApproveMaterialIssuanceRequest {
  approvedByUserId?: string;
}

export interface MaterialConsumptionLineDto {
  id: string;
  projectId: string;
  siteId?: string | null;
  costCode: string;
  boqItemId: string;
  budgetQty: number;
  budgetAmount: number;
  boqRate: number;
  consumedQty: number;
  consumedAmount: number;
  remainingQty: number;
  remainingAmount: number;
  varianceQtyPct: number;
  varianceAmountPct: number;
  status: string;
  approvalStatus: string;
  lastUpdated: string;
  notes?: string | null;
}

export type ProjectPlanningMaterialConsumptionDto = MaterialConsumptionLineDto;

export interface ProjectPlanningQaInspectionsDto {
  id: string;
  refNo: string;
  projectId: string;
  siteId?: string | null;
  siteName: string;
  wbsTaskId?: string | null;
  workPackage: string;
  description: string;
  status: string;
  siteTeamAssignee: string;
  qaEngineer: string;
  requestedAt?: string | null;
  inspectedAt?: string | null;
  approvedAt?: string | null;
  reworkCount: number;
  correctiveActionNote?: string | null;
}

export type CreateQaInspectionsRequest = ProjectPlanningQaInspectionsDto;
export type UpdateQaInspectionsRequest = Omit<ProjectPlanningQaInspectionsDto, 'id'>;
export interface CreateQaInspectionsResponse {
  id: string;
}

export interface ProjectPlanningDailySiteReportsDto {
  id: string;
  dsrNumber: string;
  reportDate: string;
  projectId: string;
  siteId: string;
  submittedByUserId: string;
  supervisorName: string;
  weather: string;
  temperatureC?: number | null;
  humidityPct?: number | null;
  windSpeedKmh?: number | null;
  manpowerCount: number;
  equipmentCount: number;
  workSummary: string;
  safetyNotes?: string | null;
  incidents?: string | null;
  supervisorSignOff: boolean;
  signOffAt?: string | null;
  approvalStatus: string;
}

export type CreateDailySiteReportsRequest = ProjectPlanningDailySiteReportsDto;
export type UpdateDailySiteReportsRequest = Omit<ProjectPlanningDailySiteReportsDto, 'id'>;
export interface CreateDailySiteReportsResponse {
  id: string;
}

export interface ProjectPlanningEmployeesDto {
  id: string;
  employeeCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  governmentIdType?: string | null;
  governmentIdNumber?: string | null;
  designation: string;
  department?: string | null;
  grade?: string | null;
  employmentType: string;
  joinDate?: string | null;
  confirmationDate?: string | null;
  terminationDate?: string | null;
  reportingManager?: string | null;
  projectId?: string | null;
  siteId?: string | null;
  basicSalary?: number | null;
  currency?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  iban?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
  approvalStatus: string;
}

export interface ProjectPlanningPayrollRunsDto {
  id: string;
  runNumber: string;
  periodMonth: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  currency: string;
  bankFileGenerated: boolean;
}

export type CreatePayrollRunsRequest = ProjectPlanningPayrollRunsDto;
export type UpdatePayrollRunsRequest = Omit<ProjectPlanningPayrollRunsDto, 'id'>;
export interface CreatePayrollRunsResponse {
  id: string;
}

export interface ProjectPlanningFleetVehiclesDto {
  id: string;
  name: string;
  plateNumber: string;
  vehicleType: string;
  driverEmployeeId?: string | null;
  projectId?: string | null;
  speedLimitKph: number;
  deviceId?: string | null;
}

export interface ProjectPlanningGpsTrackersDto {
  id: string;
  name: string;
  trackerType: string;
  projectId?: string | null;
  status: string;
  deviceId: string;
  lastLat: number;
  lastLng: number;
  lastUpdate: string;
}

export interface ProjectPlanningInvoicesDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  projectId: string;
  clientName: string;
  erpTransactionId?: number | null;
  erpPartyLedgerId: number;
  erpMaterialSalesLedgerId: number;
  materialTotal: number;
  serviceTotal: number;
  totalAmount: number;
  status: string;
}

export type CreateInvoicesRequest = ProjectPlanningInvoicesDto;
export type UpdateInvoicesRequest = Omit<ProjectPlanningInvoicesDto, 'id'>;
export interface CreateInvoicesResponse {
  id: string;
}
