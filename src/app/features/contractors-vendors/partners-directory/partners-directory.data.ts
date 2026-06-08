import { DEMO_PROJECTS } from '../../project-management/projects-sites-org-chart/projects-sites-org-chart.data';

export type CompanyType = 'contractor' | 'subcontractor' | 'vendor';
export type PartnerStatus = 'Active' | 'Inactive' | 'Prequalified' | 'Blacklisted';
export type PartnerApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface PartnerAuditEntry {
  at: string;
  action: string;
  by: string;
}

export interface PartnerAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface PartnerContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface PartnerCertification {
  id: string;
  name: string;
  issuer: string;
  validUntil: string;
  verified: boolean;
}

export interface PartnerRecord {
  id: string;
  companyCode: string;
  companyType: CompanyType;
  legalName: string;
  tradeName: string;
  status: PartnerStatus;
  approvalStatus: PartnerApprovalStatus;
  tradeLicense: string;
  taxRegistration: string;
  commercialRegistration: string;
  primaryContactName: string;
  primaryEmail: string;
  primaryPhone: string;
  address: string;
  city: string;
  country: string;
  specialties: string[];
  parentContractorId: string | null;
  assignedProjectIds: string[];
  paymentTerms: string;
  currency: string;
  creditLimit: number;
  bankName: string;
  iban: string;
  prequalificationExpiry: string;
  notes: string;
  audit: PartnerAuditEntry[];
  attachments: PartnerAttachment[];
  contacts: PartnerContact[];
  certifications: PartnerCertification[];
}

export type PartnerFormValue = Pick<
  PartnerRecord,
  | 'companyCode'
  | 'companyType'
  | 'legalName'
  | 'tradeName'
  | 'status'
  | 'tradeLicense'
  | 'taxRegistration'
  | 'commercialRegistration'
  | 'primaryContactName'
  | 'primaryEmail'
  | 'primaryPhone'
  | 'address'
  | 'city'
  | 'country'
  | 'specialties'
  | 'parentContractorId'
  | 'assignedProjectIds'
  | 'paymentTerms'
  | 'currency'
  | 'creditLimit'
  | 'bankName'
  | 'iban'
  | 'prequalificationExpiry'
  | 'notes'
>;

export const PAGE_COMPANY_TYPE: Record<string, CompanyType> = {
  contractors: 'contractor',
  'sub-contractors': 'subcontractor',
  vendors: 'vendor'
};

export const PAGE_TITLES: Record<string, string> = {
  contractors: 'Contractors',
  'sub-contractors': 'Sub-contractors',
  vendors: 'Vendors'
};

export const PAGE_SUBTITLES: Record<string, string> = {
  contractors:
    'Main contractor register with trade license, prequalification, project assignment, and approval workflow.',
  'sub-contractors':
    'Sub-contractor and trade packages linked to main contractors — compliance, certifications, and work orders.',
  vendors:
    'Vendor and supplier master for procurement — quotations, POs, payment terms, and performance tracking.'
};

export const PARTNER_STATUS_OPTIONS: { label: string; value: PartnerStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Prequalified', value: 'Prequalified' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Blacklisted', value: 'Blacklisted' }
];

export const PARTNER_FORM_STATUS_OPTIONS = PARTNER_STATUS_OPTIONS.filter((o) => o.value !== 'all');

export const PARTNER_APPROVAL_FILTER_OPTIONS: { label: string; value: PartnerApprovalStatus | 'all' }[] = [
  { label: 'All approvals', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

export const COMPANY_TYPE_OPTIONS: { label: string; value: CompanyType }[] = [
  { label: 'Contractor', value: 'contractor' },
  { label: 'Sub-contractor', value: 'subcontractor' },
  { label: 'Vendor', value: 'vendor' }
];

export const SPECIALTY_OPTIONS: { label: string; value: string }[] = [
  { label: 'General contracting', value: 'General contracting' },
  { label: 'Structural steel', value: 'Structural steel' },
  { label: 'Concrete works', value: 'Concrete works' },
  { label: 'MEP — mechanical', value: 'MEP — mechanical' },
  { label: 'MEP — electrical', value: 'MEP — electrical' },
  { label: 'MEP — plumbing', value: 'MEP — plumbing' },
  { label: 'Facade & cladding', value: 'Facade & cladding' },
  { label: 'Piling & foundations', value: 'Piling & foundations' },
  { label: 'Waterproofing', value: 'Waterproofing' },
  { label: 'Lifts & escalators', value: 'Lifts & escalators' },
  { label: 'Materials supply', value: 'Materials supply' },
  { label: 'Equipment rental', value: 'Equipment rental' },
  { label: 'Survey & testing', value: 'Survey & testing' },
  { label: 'Site security', value: 'Site security' },
  { label: 'Waste management', value: 'Waste management' }
];

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Net 30', value: 'Net 30' },
  { label: 'Net 45', value: 'Net 45' },
  { label: 'Net 60', value: 'Net 60' },
  { label: 'Advance 30% / progress', value: 'Advance 30% / progress' },
  { label: 'Against delivery', value: 'Against delivery' }
];

export const CURRENCY_OPTIONS = [
  { label: 'AED', value: 'AED' },
  { label: 'USD', value: 'USD' },
  { label: 'SAR', value: 'SAR' }
];

export const PARTNER_PROJECT_FILTER_OPTIONS = [
  { label: 'All projects', value: 'all' },
  ...DEMO_PROJECTS.map((p) => ({ label: p.name, value: p.id }))
];

export const PARTNER_PROJECT_FORM_OPTIONS = PARTNER_PROJECT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export function companyTypeLabel(type: CompanyType): string {
  return COMPANY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function projectNameForId(projectId: string | null): string {
  if (!projectId) return '—';
  return DEMO_PROJECTS.find((p) => p.id === projectId)?.name ?? projectId;
}

export function projectNamesForIds(ids: string[]): string {
  if (!ids.length) return '—';
  return ids.map((id) => projectNameForId(id)).join(', ');
}

export function partnerDisplayName(p: Pick<PartnerRecord, 'tradeName' | 'legalName'>): string {
  return p.tradeName || p.legalName;
}

export function newPartnerId(): string {
  return `ptr-${Date.now().toString(36).slice(-6)}`;
}

export function newContactId(): string {
  return `ctc-${Date.now().toString(36).slice(-6)}`;
}

export function newCertificationId(): string {
  return `cert-${Date.now().toString(36).slice(-6)}`;
}

export function newAttachmentId(): string {
  return `att-${Date.now().toString(36).slice(-6)}`;
}

export function auditTimestamp(): string {
  return new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function partnerStatusSeverity(
  status: PartnerStatus
): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Prequalified':
      return 'info';
    case 'Inactive':
      return 'secondary';
    case 'Blacklisted':
      return 'danger';
  }
}

export function approvalStatusSeverity(
  status: PartnerApprovalStatus
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

export function approvalStatusLabel(status: PartnerApprovalStatus): string {
  const labels: Record<PartnerApprovalStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return labels[status];
}

export function canSubmitForApproval(p: PartnerRecord): boolean {
  return p.approvalStatus === 'draft' || p.approvalStatus === 'rejected';
}

export function canApproveOrReject(p: PartnerRecord): boolean {
  return p.approvalStatus === 'pending_approval';
}

function seedPartner(
  partial: Omit<PartnerRecord, 'audit' | 'attachments' | 'contacts' | 'certifications'> & {
    audit?: PartnerAuditEntry[];
    attachments?: PartnerAttachment[];
    contacts?: PartnerContact[];
    certifications?: PartnerCertification[];
  }
): PartnerRecord {
  return {
    audit: [{ at: '2025-11-01 09:00', action: 'Record created', by: 'Procurement admin' }],
    attachments: [],
    contacts: [],
    certifications: [],
    ...partial
  };
}

export function initialPartnerRecords(): PartnerRecord[] {
  const p1 = DEMO_PROJECTS[0]?.id ?? 'proj-1';
  const p2 = DEMO_PROJECTS[1]?.id ?? 'proj-2';

  const mainContractor = seedPartner({
    id: 'ptr-mc-01',
    companyCode: 'CTR-001',
    companyType: 'contractor',
    legalName: 'SteelFrame General Contracting LLC',
    tradeName: 'SteelFrame Contractors',
    status: 'Active',
    approvalStatus: 'approved',
    tradeLicense: 'TL-DXB-88421',
    taxRegistration: 'TRN-100234567890003',
    commercialRegistration: 'CR-452891',
    primaryContactName: 'Omar Al Rashid',
    primaryEmail: 'contracts@steelframe.ae',
    primaryPhone: '+971 4 555 1200',
    address: 'Business Bay, Tower 12, Floor 18',
    city: 'Dubai',
    country: 'United Arab Emirates',
    specialties: ['General contracting', 'Structural steel'],
    parentContractorId: null,
    assignedProjectIds: [p1, p2],
    paymentTerms: 'Net 45',
    currency: 'AED',
    creditLimit: 5_000_000,
    bankName: 'Emirates NBD',
    iban: 'AE070331234567890123456',
    prequalificationExpiry: '2026-12-31',
    notes: 'Preferred main contractor for high-rise structural packages.',
    contacts: [
      {
        id: 'ctc-01',
        name: 'Omar Al Rashid',
        role: 'Commercial manager',
        email: 'contracts@steelframe.ae',
        phone: '+971 4 555 1200'
      },
      {
        id: 'ctc-02',
        name: 'Sara Menon',
        role: 'Project director',
        email: 'sara.menon@steelframe.ae',
        phone: '+971 50 555 8899'
      }
    ],
    certifications: [
      {
        id: 'cert-01',
        name: 'ISO 9001:2015',
        issuer: 'Bureau Veritas',
        validUntil: '2026-06-30',
        verified: true
      }
    ],
    attachments: [
      {
        id: 'att-01',
        name: 'Trade-License-2025.pdf',
        type: 'PDF',
        uploadedAt: '2025-10-15'
      }
    ]
  });

  const subConcrete = seedPartner({
    id: 'ptr-sub-01',
    companyCode: 'SUB-014',
    companyType: 'subcontractor',
    legalName: 'Al Noor Readymix & Concrete Works LLC',
    tradeName: 'Al Noor Concrete',
    status: 'Active',
    approvalStatus: 'approved',
    tradeLicense: 'TL-SHJ-22109',
    taxRegistration: 'TRN-100987654321001',
    commercialRegistration: 'CR-118902',
    primaryContactName: 'Khalid Hassan',
    primaryEmail: 'ops@alnoorconcrete.ae',
    primaryPhone: '+971 6 555 4400',
    address: 'Industrial Area 15',
    city: 'Sharjah',
    country: 'United Arab Emirates',
    specialties: ['Concrete works'],
    parentContractorId: mainContractor.id,
    assignedProjectIds: [p1],
    paymentTerms: 'Advance 30% / progress',
    currency: 'AED',
    creditLimit: 1_200_000,
    bankName: 'ADCB',
    iban: 'AE460030123456789012345',
    prequalificationExpiry: '2026-03-31',
    notes: 'Package: substructure & superstructure concrete.',
    contacts: [
      {
        id: 'ctc-03',
        name: 'Khalid Hassan',
        role: 'Site manager',
        email: 'ops@alnoorconcrete.ae',
        phone: '+971 6 555 4400'
      }
    ],
    certifications: [
      {
        id: 'cert-02',
        name: 'Concrete supplier approval',
        issuer: 'Main contractor QA',
        validUntil: '2026-01-15',
        verified: true
      }
    ]
  });

  const subMep = seedPartner({
    id: 'ptr-sub-02',
    companyCode: 'SUB-028',
    companyType: 'subcontractor',
    legalName: 'Gulf Spark Electrical Contracting LLC',
    tradeName: 'Gulf Spark Electric',
    status: 'Prequalified',
    approvalStatus: 'pending_approval',
    tradeLicense: 'TL-AUH-55201',
    taxRegistration: 'TRN-100112233445566',
    commercialRegistration: 'CR-339201',
    primaryContactName: 'Ravi Nair',
    primaryEmail: 'tenders@gulfspark.ae',
    primaryPhone: '+971 2 555 7700',
    address: 'Mussafah M-37',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    specialties: ['MEP — electrical'],
    parentContractorId: mainContractor.id,
    assignedProjectIds: [p2],
    paymentTerms: 'Net 30',
    currency: 'AED',
    creditLimit: 800_000,
    bankName: 'FAB',
    iban: 'AE120030987654321098765',
    prequalificationExpiry: '2025-12-31',
    notes: 'LV/MV cabling and DB installation.'
  });

  const vendorSurvey = seedPartner({
    id: 'ptr-vnd-01',
    companyCode: 'VND-102',
    companyType: 'vendor',
    legalName: 'Precision Land Survey Services FZE',
    tradeName: 'Precision Survey',
    status: 'Active',
    approvalStatus: 'approved',
    tradeLicense: 'TL-DXB-33012',
    taxRegistration: 'TRN-100556677889900',
    commercialRegistration: 'CR-902114',
    primaryContactName: 'James Okonkwo',
    primaryEmail: 'projects@precisionsurvey.ae',
    primaryPhone: '+971 4 555 3311',
    address: 'Dubai Silicon Oasis',
    city: 'Dubai',
    country: 'United Arab Emirates',
    specialties: ['Survey & testing'],
    parentContractorId: null,
    assignedProjectIds: [p1, p2],
    paymentTerms: 'Against delivery',
    currency: 'AED',
    creditLimit: 250_000,
    bankName: 'Mashreq',
    iban: 'AE700330112233445566778',
    prequalificationExpiry: '2026-08-31',
    notes: 'Topographic and as-built surveys.'
  });

  const vendorTesting = seedPartner({
    id: 'ptr-vnd-02',
    companyCode: 'VND-118',
    companyType: 'vendor',
    legalName: 'Gulf Materials Testing Laboratory LLC',
    tradeName: 'GMT Lab',
    status: 'Active',
    approvalStatus: 'approved',
    tradeLicense: 'TL-DXB-44102',
    taxRegistration: 'TRN-100667788990011',
    commercialRegistration: 'CR-771203',
    primaryContactName: 'Dr. Amira Farouk',
    primaryEmail: 'lab@gmt.ae',
    primaryPhone: '+971 4 555 9020',
    address: 'Al Quoz Industrial 3',
    city: 'Dubai',
    country: 'United Arab Emirates',
    specialties: ['Survey & testing', 'Materials supply'],
    parentContractorId: null,
    assignedProjectIds: [p1],
    paymentTerms: 'Net 30',
    currency: 'AED',
    creditLimit: 180_000,
    bankName: 'RAK Bank',
    iban: 'AE440330998877665544332',
    prequalificationExpiry: '2026-05-31',
    notes: 'Concrete cube, soil, and steel testing.'
  });

  const vendorEquip = seedPartner({
    id: 'ptr-vnd-03',
    companyCode: 'VND-205',
    companyType: 'vendor',
    legalName: 'Desert Plant Hire & Equipment Rental LLC',
    tradeName: 'Desert Plant Hire',
    status: 'Inactive',
    approvalStatus: 'draft',
    tradeLicense: 'TL-AJM-11029',
    taxRegistration: 'TRN-100998877665544',
    commercialRegistration: 'CR-551902',
    primaryContactName: 'Faisal Qureshi',
    primaryEmail: 'hire@desertplant.ae',
    primaryPhone: '+971 6 555 2211',
    address: 'Ajman Free Zone',
    city: 'Ajman',
    country: 'United Arab Emirates',
    specialties: ['Equipment rental'],
    parentContractorId: null,
    assignedProjectIds: [],
    paymentTerms: 'Net 45',
    currency: 'AED',
    creditLimit: 500_000,
    bankName: 'Emirates NBD',
    iban: 'AE070331998877665544332',
    prequalificationExpiry: '',
    notes: 'Tower cranes and mobile plant — contract lapsed.'
  });

  return [mainContractor, subConcrete, subMep, vendorSurvey, vendorTesting, vendorEquip];
}

export function contractorOptionsForForm(
  partners: PartnerRecord[],
  excludeId?: string
): { label: string; value: string }[] {
  return [
    { label: 'None (independent)', value: '' },
    ...partners
      .filter((p) => p.companyType === 'contractor' && p.id !== excludeId)
      .map((p) => ({ label: partnerDisplayName(p), value: p.id }))
  ];
}

export function partnerNameForId(partners: PartnerRecord[], id: string | null): string {
  if (!id) return '—';
  const found = partners.find((p) => p.id === id);
  return found ? partnerDisplayName(found) : id;
}
