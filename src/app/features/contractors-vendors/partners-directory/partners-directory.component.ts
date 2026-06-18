import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import { PartnersApiService } from '../../../core/api/project-planning';
import {
  CURRENCY_OPTIONS,
  PAGE_COMPANY_TYPE,
  PAGE_SUBTITLES,
  PAGE_TITLES,
  PARTNER_APPROVAL_FILTER_OPTIONS,
  PARTNER_FORM_STATUS_OPTIONS,
  PARTNER_PROJECT_FILTER_OPTIONS,
  PARTNER_PROJECT_FORM_OPTIONS,
  PARTNER_STATUS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  SPECIALTY_OPTIONS,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  companyTypeLabel,
  contractorOptionsForForm,
  initialPartnerRecords,
  newAttachmentId,
  newCertificationId,
  newContactId,
  newPartnerId,
  partnerDisplayName,
  partnerNameForId,
  partnerStatusSeverity,
  projectNamesForIds,
  type CompanyType,
  type PartnerCertification,
  type PartnerContact,
  type PartnerFormValue,
  type PartnerRecord
} from './partners-directory.data';

type ChildKind = 'contact' | 'certification';

@Component({
  selector: 'app-partners-directory',
  imports: [
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Button,
    Checkbox,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    MultiSelect,
    Select,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    Textarea
  ],
  templateUrl: './partners-directory.component.html',
  styleUrl: './partners-directory.component.scss'
})
export class PartnersDirectoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly partnersApi = inject(PartnersApiService);

  readonly pageId = (this.route.snapshot.data['pageId'] as string) ?? 'contractors';
  readonly companyType = PAGE_COMPANY_TYPE[this.pageId] ?? 'contractor';
  readonly pageTitle = PAGE_TITLES[this.pageId] ?? 'Partners';
  readonly pageSubtitle = PAGE_SUBTITLES[this.pageId] ?? '';

  readonly statusFilterOptions = PARTNER_STATUS_OPTIONS;
  readonly approvalFilterOptions = PARTNER_APPROVAL_FILTER_OPTIONS;
  readonly projectFilterOptions = PARTNER_PROJECT_FILTER_OPTIONS;
  readonly formStatusOptions = PARTNER_FORM_STATUS_OPTIONS;
  readonly projectFormOptions = PARTNER_PROJECT_FORM_OPTIONS;
  readonly specialtyOptions = SPECIALTY_OPTIONS;
  readonly paymentTermsOptions = PAYMENT_TERMS_OPTIONS;
  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly partners = signal<PartnerRecord[]>([]);

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<'all' | PartnerRecord['approvalStatus']>('all');
  readonly projectFilter = signal('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(
    this.partners().find((p) => p.companyType === this.companyType)?.id ?? null
  );

  readonly detailVisible = signal(false);
  readonly detailPartner = signal<PartnerRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly partnerToDelete = signal<PartnerRecord | null>(null);

  readonly childFormVisible = signal(false);
  readonly childFormMode = signal<'create' | 'edit'>('create');
  readonly childFormKind = signal<ChildKind>('contact');
  readonly childEditingId = signal<string | null>(null);
  readonly childFormError = signal<string | null>(null);

  readonly partnerForm = this.fb.nonNullable.group({
    companyCode: ['', [Validators.required, Validators.maxLength(24)]],
    companyType: [this.companyType as CompanyType, Validators.required],
    legalName: ['', [Validators.required, Validators.maxLength(120)]],
    tradeName: ['', [Validators.required, Validators.maxLength(80)]],
    status: ['Active' as PartnerRecord['status'], Validators.required],
    tradeLicense: ['', [Validators.required, Validators.maxLength(40)]],
    taxRegistration: ['', Validators.maxLength(40)],
    commercialRegistration: ['', Validators.maxLength(40)],
    primaryContactName: ['', [Validators.required, Validators.maxLength(80)]],
    primaryEmail: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    primaryPhone: ['', [Validators.required, Validators.maxLength(24)]],
    address: ['', Validators.maxLength(200)],
    city: ['', Validators.maxLength(60)],
    country: ['', Validators.maxLength(60)],
    specialties: [[] as string[]],
    parentContractorId: [''],
    assignedProjectIds: [[] as string[]],
    paymentTerms: ['Net 30', Validators.required],
    currency: ['AED', Validators.required],
    creditLimit: [0, [Validators.min(0)]],
    bankName: ['', Validators.maxLength(80)],
    iban: ['', Validators.maxLength(34)],
    prequalificationExpiry: [''],
    notes: ['', Validators.maxLength(500)]
  });

  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    role: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', Validators.maxLength(24)]
  });

  readonly certificationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    issuer: ['', [Validators.required, Validators.maxLength(80)]],
    validUntil: ['', Validators.required],
    verified: [false]
  });

  readonly filteredPartners = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const project = this.projectFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.partners()
      .filter((p) => p.companyType === this.companyType)
      .filter((p) => {
        if (status !== 'all' && p.status !== status) return false;
        if (approval !== 'all' && p.approvalStatus !== approval) return false;
        if (project !== 'all' && !p.assignedProjectIds.includes(project)) return false;
        if (!q) return true;
        const name = partnerDisplayName(p).toLowerCase();
        return (
          name.includes(q) ||
          p.legalName.toLowerCase().includes(q) ||
          p.companyCode.toLowerCase().includes(q) ||
          p.tradeLicense.toLowerCase().includes(q) ||
          p.primaryContactName.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => partnerDisplayName(a).localeCompare(partnerDisplayName(b)));
  });

  readonly singularLabel = computed(() => {
    const title = this.pageTitle.toLowerCase();
    return title.endsWith('s') ? title.slice(0, -1) : title;
  });

  readonly addButtonLabel = computed(() => `Add ${this.singularLabel()}`);

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? this.addButtonLabel() : `Edit ${this.singularLabel()}`
  );

  readonly childFormHeader = computed(() => {
    const kind = this.childFormKind() === 'contact' ? 'Contact' : 'Certification';
    return this.childFormMode() === 'create' ? `Add ${kind.toLowerCase()}` : `Edit ${kind.toLowerCase()}`;
  });

  readonly contractorFormOptions = computed(() =>
    contractorOptionsForForm(this.partners(), this.editingId() ?? undefined)
  );

  ngOnInit(): void {
    this.partnersApi.list().subscribe({
      next: (data) => console.log('[PartnersDirectory] GET /partners', data),
      error: (err) => console.error('[PartnersDirectory] GET /partners failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: this.pageTitle });
    return items;
  });

  readonly showParentContractor = computed(() => this.companyType === 'subcontractor');

  displayName(p: PartnerRecord): string {
    return partnerDisplayName(p);
  }

  typeLabel(type: PartnerRecord['companyType']): string {
    return companyTypeLabel(type);
  }

  statusSeverity(status: PartnerRecord['status']) {
    return partnerStatusSeverity(status);
  }

  approvalSeverity(status: PartnerRecord['approvalStatus']) {
    return approvalStatusSeverity(status);
  }

  approvalLabel(status: PartnerRecord['approvalStatus']) {
    return approvalStatusLabel(status);
  }

  projectsLabel(ids: string[]): string {
    return projectNamesForIds(ids);
  }

  parentLabel(id: string | null): string {
    return partnerNameForId(this.partners(), id);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    const prefix = this.companyType === 'contractor' ? 'CTR' : this.companyType === 'subcontractor' ? 'SUB' : 'VND';
    this.partnerForm.reset({
      companyCode: `${prefix}-${Date.now().toString().slice(-4)}`,
      companyType: this.companyType,
      legalName: '',
      tradeName: '',
      status: 'Active',
      tradeLicense: '',
      taxRegistration: '',
      commercialRegistration: '',
      primaryContactName: '',
      primaryEmail: '',
      primaryPhone: '',
      address: '',
      city: '',
      country: 'United Arab Emirates',
      specialties: [],
      parentContractorId: '',
      assignedProjectIds: [],
      paymentTerms: 'Net 30',
      currency: 'AED',
      creditLimit: 0,
      bankName: '',
      iban: '',
      prequalificationExpiry: '',
      notes: ''
    });
    this.formVisible.set(true);
  }

  openEdit(row: PartnerRecord): void {
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.partnerForm.patchValue({
      ...row,
      parentContractorId: row.parentContractorId ?? '',
      assignedProjectIds: [...row.assignedProjectIds]
    });
    this.formVisible.set(true);
  }

  openDetail(row: PartnerRecord): void {
    this.detailPartner.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.detailPartner.set(null);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  savePartner(): void {
    if (this.partnerForm.invalid) {
      this.partnerForm.markAllAsTouched();
      this.formError.set('Please complete all required fields.');
      return;
    }

    const raw = this.partnerForm.getRawValue();
    const value: PartnerFormValue = {
      ...raw,
      parentContractorId: raw.parentContractorId || null,
      assignedProjectIds: raw.assignedProjectIds ?? []
    };

    if (this.formMode() === 'create') {
      const created: PartnerRecord = {
        id: newPartnerId(),
        ...value,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Record created', by: 'Procurement admin' }],
        attachments: [],
        contacts: value.primaryContactName
          ? [
              {
                id: newContactId(),
                name: value.primaryContactName,
                role: 'Primary contact',
                email: value.primaryEmail,
                phone: value.primaryPhone
              }
            ]
          : [],
        certifications: []
      };
      this.partners.update((list) => [...list, created]);
      this.selectedId.set(created.id);
    } else {
      const id = this.editingId();
      if (!id) return;
      const existing = this.partners().find((p) => p.id === id);
      if (!existing) return;
      const updated: PartnerRecord = {
        ...existing,
        ...value,
        audit: [{ at: auditTimestamp(), action: 'Record updated', by: 'Procurement admin' }, ...existing.audit]
      };
      this.patchPartner(updated);
      if (this.detailPartner()?.id === id) {
        this.detailPartner.set(updated);
      }
    }

    this.closeForm();
  }

  requestDelete(row: PartnerRecord): void {
    this.partnerToDelete.set(row);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.partnerToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.partnerToDelete();
    if (!target) return;
    const next = this.partners().filter((p) => p.id !== target.id);
    this.partners.set(next);
    if (this.selectedId() === target.id) {
      this.selectedId.set(next.find((p) => p.companyType === this.companyType)?.id ?? null);
    }
    if (this.detailPartner()?.id === target.id) {
      this.closeDetail();
    }
    this.cancelDelete();
  }

  submitForApproval(partner: PartnerRecord): void {
    if (!canSubmitForApproval(partner)) return;
    this.patchPartner({
      ...partner,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for approval', by: 'Procurement officer' }, ...partner.audit]
    });
  }

  approvePartner(partner: PartnerRecord): void {
    if (!canApproveOrReject(partner)) return;
    this.patchPartner({
      ...partner,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'Partner record approved', by: 'Commercial manager' }, ...partner.audit]
    });
  }

  rejectPartner(partner: PartnerRecord): void {
    if (!canApproveOrReject(partner)) return;
    this.patchPartner({
      ...partner,
      approvalStatus: 'rejected',
      audit: [
        { at: auditTimestamp(), action: 'Approval rejected — verify trade license and certifications', by: 'Commercial manager' },
        ...partner.audit
      ]
    });
  }

  canSubmit(p: PartnerRecord): boolean {
    return canSubmitForApproval(p);
  }

  canApprove(p: PartnerRecord): boolean {
    return canApproveOrReject(p);
  }

  mockAddAttachment(partner: PartnerRecord): void {
    const attachment = {
      id: newAttachmentId(),
      name: `Document-${Date.now().toString(36).slice(-4)}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchPartner({
      ...partner,
      attachments: [attachment, ...partner.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${attachment.name}`, by: 'Procurement admin' }, ...partner.audit]
    });
  }

  openAddContact(): void {
    this.childFormKind.set('contact');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.contactForm.reset({ name: '', role: '', email: '', phone: '' });
    this.childFormVisible.set(true);
  }

  openEditContact(row: PartnerContact): void {
    this.childFormKind.set('contact');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.contactForm.patchValue(row);
    this.childFormVisible.set(true);
  }

  openAddCertification(): void {
    this.childFormKind.set('certification');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.certificationForm.reset({ name: '', issuer: '', validUntil: '', verified: false });
    this.childFormVisible.set(true);
  }

  openEditCertification(row: PartnerCertification): void {
    this.childFormKind.set('certification');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.certificationForm.patchValue(row);
    this.childFormVisible.set(true);
  }

  closeChildForm(): void {
    this.childFormVisible.set(false);
    this.childFormError.set(null);
  }

  saveChildRecord(): void {
    const partner = this.detailPartner();
    if (!partner) return;

    if (this.childFormKind() === 'contact') {
      this.saveContact(partner);
    } else {
      this.saveCertification(partner);
    }
  }

  deleteContact(row: PartnerContact): void {
    const partner = this.detailPartner();
    if (!partner) return;
    this.patchPartner({
      ...partner,
      contacts: partner.contacts.filter((c) => c.id !== row.id),
      audit: [{ at: auditTimestamp(), action: `Contact removed: ${row.name}`, by: 'Procurement admin' }, ...partner.audit]
    });
  }

  deleteCertification(row: PartnerCertification): void {
    const partner = this.detailPartner();
    if (!partner) return;
    this.patchPartner({
      ...partner,
      certifications: partner.certifications.filter((c) => c.id !== row.id),
      audit: [
        { at: auditTimestamp(), action: `Certification removed: ${row.name}`, by: 'Procurement admin' },
        ...partner.audit
      ]
    });
  }

  exportCsv(): void {
    const rows = this.filteredPartners();
    const header = [
      'id',
      'companyCode',
      'legalName',
      'tradeName',
      'companyType',
      'status',
      'approvalStatus',
      'tradeLicense',
      'primaryContactName',
      'primaryEmail',
      'city',
      'country',
      'specialties',
      'paymentTerms',
      'currency',
      'creditLimit'
    ];
    const lines = [
      header.join(','),
      ...rows.map((p) =>
        [
          p.id,
          p.companyCode,
          `"${p.legalName.replace(/"/g, '""')}"`,
          `"${p.tradeName.replace(/"/g, '""')}"`,
          p.companyType,
          p.status,
          p.approvalStatus,
          `"${p.tradeLicense.replace(/"/g, '""')}"`,
          `"${p.primaryContactName.replace(/"/g, '""')}"`,
          p.primaryEmail,
          p.city,
          p.country,
          `"${p.specialties.join('; ').replace(/"/g, '""')}"`,
          p.paymentTerms,
          p.currency,
          p.creditLimit
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.pageId}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private saveContact(partner: PartnerRecord): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.childFormError.set('Please complete all required contact fields.');
      return;
    }
    const value = this.contactForm.getRawValue();
    if (this.childFormMode() === 'create') {
      const contact: PartnerContact = { id: newContactId(), ...value };
      this.patchPartner({
        ...partner,
        contacts: [...partner.contacts, contact],
        audit: [{ at: auditTimestamp(), action: `Contact added: ${contact.name}`, by: 'Procurement admin' }, ...partner.audit]
      });
    } else {
      const id = this.childEditingId();
      if (!id) return;
      this.patchPartner({
        ...partner,
        contacts: partner.contacts.map((c) => (c.id === id ? { ...c, ...value } : c)),
        audit: [{ at: auditTimestamp(), action: `Contact updated: ${value.name}`, by: 'Procurement admin' }, ...partner.audit]
      });
    }
    this.closeChildForm();
  }

  private saveCertification(partner: PartnerRecord): void {
    if (this.certificationForm.invalid) {
      this.certificationForm.markAllAsTouched();
      this.childFormError.set('Please complete all required certification fields.');
      return;
    }
    const value = this.certificationForm.getRawValue();
    if (this.childFormMode() === 'create') {
      const cert: PartnerCertification = { id: newCertificationId(), ...value };
      this.patchPartner({
        ...partner,
        certifications: [...partner.certifications, cert],
        audit: [
          { at: auditTimestamp(), action: `Certification added: ${cert.name}`, by: 'Procurement admin' },
          ...partner.audit
        ]
      });
    } else {
      const id = this.childEditingId();
      if (!id) return;
      this.patchPartner({
        ...partner,
        certifications: partner.certifications.map((c) => (c.id === id ? { ...c, ...value } : c)),
        audit: [
          { at: auditTimestamp(), action: `Certification updated: ${value.name}`, by: 'Procurement admin' },
          ...partner.audit
        ]
      });
    }
    this.closeChildForm();
  }

  private patchPartner(updated: PartnerRecord): void {
    this.partners.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    if (this.detailPartner()?.id === updated.id) {
      this.detailPartner.set(updated);
    }
  }
}
