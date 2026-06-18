import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  CreateSitesRequest,
  ProjectsApiService,
  SitesApiService,
  UpdateSitesRequest,
  siteDtoToRecord
} from '../../../core/api/project-planning';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { startWith } from 'rxjs';
import {
  GEOFENCE_TYPE_OPTIONS,
  SITE_APPROVAL_FILTER_OPTIONS,
  SITE_OPERATIONAL_OPTIONS,
  type GeofenceRecord,
  type GeofenceZoneType,
  type SiteApprovalStatus,
  type SiteContactRecord,
  type SiteOperationalStatus,
  type SiteRecord,
  type SiteTabId,
  approvalLabel,
  approvalSeverity,
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  newId,
  parentSiteOptions,
  projectNameForId,
  siteDepth,
  siteHierarchyLabel,
  siteOptions
} from './sites-management.data';

type EntityKind = 'site' | 'geofence' | 'contact';

type SiteFormValue = {
  projectId: string;
  parentSiteId: string;
  name: string;
  location: string;
  superintendent: string;
  progressPct: number;
  zoneCode: string;
  operationalStatus: SiteOperationalStatus;
};

type GeofenceFormValue = {
  siteId: string;
  name: string;
  zoneType: GeofenceZoneType;
  radiusM: number | null;
  active: boolean;
  entryAlert: boolean;
  exitAlert: boolean;
};

type ContactFormValue = {
  siteId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

@Component({
  selector: 'app-sites-management',
  imports: [
    NgTemplateOutlet,
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
    Select,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag
  ],
  templateUrl: './sites-management.component.html',
  styleUrl: './sites-management.component.scss'
})
export class SitesManagementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly sitesApi = inject(SitesApiService);
  private readonly projectsApi = inject(ProjectsApiService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly projectOptionsFromApi = signal<Array<{ label: string; value: string }>>([]);

  readonly projectFilterOptions = computed(() => [
    { label: 'All projects', value: 'all' },
    ...this.projectOptionsFromApi()
  ]);
  readonly projectFormOptions = computed(() => this.projectOptionsFromApi());
  readonly approvalFilterOptions = SITE_APPROVAL_FILTER_OPTIONS;
  readonly operationalOptions = SITE_OPERATIONAL_OPTIONS;
  readonly geofenceTypeOptions = GEOFENCE_TYPE_OPTIONS;

  readonly activeTab = signal<SiteTabId>('hierarchy');
  readonly projectFilter = signal('all');
  readonly approvalFilter = signal<SiteApprovalStatus | 'all'>('all');
  readonly searchText = signal('');

  readonly sites = signal<SiteRecord[]>([]);
  readonly geofences = signal<GeofenceRecord[]>([]);
  readonly contacts = signal<SiteContactRecord[]>([]);

  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly formKind = signal<EntityKind>('site');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly deleteKind = signal<EntityKind>('site');
  readonly deleteLabel = signal('');

  readonly detailVisible = signal(false);
  readonly detailKind = signal<EntityKind>('site');

  readonly siteForm = this.fb.group({
    projectId: ['', Validators.required],
    parentSiteId: [''],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    location: ['', [Validators.required, Validators.maxLength(80)]],
    superintendent: ['', [Validators.required, Validators.maxLength(80)]],
    progressPct: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    zoneCode: ['', Validators.maxLength(24)],
    operationalStatus: ['Active' as SiteOperationalStatus, Validators.required]
  });

  readonly geofenceForm = this.fb.group({
    siteId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    zoneType: ['polygon' as GeofenceZoneType, Validators.required],
    radiusM: [null as number | null],
    active: [true],
    entryAlert: [true],
    exitAlert: [true]
  });

  readonly contactForm = this.fb.group({
    siteId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    role: ['', [Validators.required, Validators.maxLength(60)]],
    phone: ['', [Validators.required, Validators.maxLength(24)]],
    email: ['', [Validators.required, Validators.email]],
    isPrimary: [false]
  });

  readonly detailSite = signal<SiteRecord | null>(null);
  readonly detailGeofence = signal<GeofenceRecord | null>(null);
  readonly detailContact = signal<SiteContactRecord | null>(null);

  readonly siteSelectOptions = computed(() => siteOptions(this.sites()));

  private readonly siteFormProjectId = toSignal(
    this.siteForm.controls.projectId.valueChanges.pipe(
      startWith(this.siteForm.controls.projectId.value ?? '')
    ),
    { initialValue: '' }
  );

  readonly parentOptions = computed(() =>
    parentSiteOptions(this.sites(), this.siteFormProjectId() || '', this.editingId() ?? undefined)
  );

  constructor() {
    this.siteForm.controls.projectId.valueChanges.subscribe((projectId) => {
      const parentId = this.siteForm.controls.parentSiteId.value ?? '';
      if (!parentId) return;
      const allowed = parentSiteOptions(
        this.sites(),
        projectId ?? '',
        this.editingId() ?? undefined
      ).some((o) => o.value === parentId);
      if (!allowed) {
        this.siteForm.controls.parentSiteId.setValue('');
      }
    });
  }

  readonly filteredSites = computed(() => this.filterSites(this.sites()));
  readonly filteredGeofences = computed(() => this.filterGeofences(this.geofences()));
  readonly filteredContacts = computed(() => this.filterContacts(this.contacts()));

  readonly formDialogHeader = computed(() => {
    const kind = this.formKind();
    const mode = this.formMode() === 'create' ? 'Add' : 'Edit';
    const labels: Record<EntityKind, string> = {
      site: 'site',
      geofence: 'geofence zone',
      contact: 'site contact'
    };
    return `${mode} ${labels[kind]}`;
  });

  ngOnInit(): void {
    this.loadSitesFromApi();
  }

  private loadSitesFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      sites: this.sitesApi.list(),
      projects: this.projectsApi.list()
    }).subscribe({
      next: ({ sites, projects }) => {
        const nameById = Object.fromEntries(projects.map((p) => [p.id, p.name]));
        this.projectOptionsFromApi.set(
          projects.map((p) => ({ label: p.name, value: p.id }))
        );
        const mapped = sites.map((s) => siteDtoToRecord(s, nameById[s.projectId] ?? s.projectId));
        this.sites.set(mapped);

        const detailId = this.detailSite()?.id;
        if (detailId) {
          const refreshed = mapped.find((s) => s.id === detailId) ?? null;
          this.detailSite.set(refreshed);
          if (!refreshed) this.detailVisible.set(false);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('[SitesManagement] load failed', err);
        this.loadError.set('Could not load sites from the server.');
        this.loading.set(false);
      }
    });
  }

  private siteRecordToFormValue(site: SiteRecord): SiteFormValue {
    return {
      projectId: site.projectId,
      parentSiteId: site.parentSiteId ?? '',
      name: site.name,
      location: site.location,
      superintendent: site.superintendent,
      progressPct: site.progressPct,
      zoneCode: site.zoneCode,
      operationalStatus: site.operationalStatus
    };
  }

  private buildCreateSiteRequest(id: string, raw: SiteFormValue): CreateSitesRequest {
    return {
      id,
      projectId: raw.projectId,
      parentSiteId: raw.parentSiteId || null,
      name: raw.name.trim(),
      location: raw.location.trim(),
      zoneCode: raw.zoneCode.trim() || raw.location.slice(0, 8).toUpperCase(),
      superintendent: raw.superintendent.trim(),
      progressPct: raw.progressPct,
      operationalStatus: raw.operationalStatus,
      approvalStatus: 'draft',
      lat: null,
      lng: null
    };
  }

  private buildUpdateSiteRequest(raw: SiteFormValue, approvalStatus: string): UpdateSitesRequest {
    const id = this.editingId() ?? newId('S');
    const { id: _id, ...rest } = this.buildCreateSiteRequest(id, raw);
    return { ...rest, approvalStatus };
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Sites' });
    return items;
  });

  approvalLabel = approvalLabel;
  approvalSeverity = approvalSeverity;

  hierarchyLabel(site: SiteRecord): string {
    return siteHierarchyLabel(site, this.sites());
  }

  depth(site: SiteRecord): number {
    return siteDepth(site, this.sites());
  }

  canSubmit(status: SiteApprovalStatus): boolean {
    return canSubmitForApproval(status);
  }

  canApprove(status: SiteApprovalStatus): boolean {
    return canApproveOrReject(status);
  }

  onTabChange(value: string | number | undefined): void {
    if (value === 'hierarchy' || value === 'geofence' || value === 'contacts') {
      this.activeTab.set(value);
    }
  }

  openCreate(kind: EntityKind): void {
    this.formKind.set(kind);
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    if (kind === 'site') {
      this.siteForm.reset({
        projectId: this.projectFormOptions()[0]?.value ?? '',
        parentSiteId: '',
        name: '',
        location: '',
        superintendent: '',
        progressPct: 0,
        zoneCode: '',
        operationalStatus: 'Mobilizing'
      });
    } else if (kind === 'geofence') {
      this.geofenceForm.reset({
        siteId: this.sites()[0]?.id ?? '',
        name: '',
        zoneType: 'polygon',
        radiusM: null,
        active: true,
        entryAlert: true,
        exitAlert: true
      });
    } else {
      this.contactForm.reset({
        siteId: this.sites()[0]?.id ?? '',
        name: '',
        role: 'Site superintendent',
        phone: '',
        email: '',
        isPrimary: false
      });
    }
    this.formVisible.set(true);
  }

  openEditSite(site: SiteRecord): void {
    this.formKind.set('site');
    this.formMode.set('edit');
    this.editingId.set(site.id);
    this.formError.set(null);
    this.siteForm.patchValue({
      projectId: site.projectId,
      parentSiteId: site.parentSiteId ?? '',
      name: site.name,
      location: site.location,
      superintendent: site.superintendent,
      progressPct: site.progressPct,
      zoneCode: site.zoneCode,
      operationalStatus: site.operationalStatus
    });
    this.formVisible.set(true);
  }

  openEditGeofence(row: GeofenceRecord): void {
    this.formKind.set('geofence');
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.geofenceForm.patchValue({
      siteId: row.siteId,
      name: row.name,
      zoneType: row.zoneType,
      radiusM: row.radiusM,
      active: row.active,
      entryAlert: row.entryAlert,
      exitAlert: row.exitAlert
    });
    this.formVisible.set(true);
  }

  openEditContact(row: SiteContactRecord): void {
    this.formKind.set('contact');
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.contactForm.patchValue({
      siteId: row.siteId,
      name: row.name,
      role: row.role,
      phone: row.phone,
      email: row.email,
      isPrimary: row.isPrimary
    });
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  saveForm(): void {
    const kind = this.formKind();
    if (kind === 'site') this.saveSite();
    else if (kind === 'geofence') this.saveGeofence();
    else this.saveContact();
  }

  private saveSite(): void {
    this.siteForm.markAllAsTouched();
    if (this.siteForm.invalid) {
      this.formError.set('Fix the highlighted site fields.');
      return;
    }
    const raw = this.siteForm.getRawValue() as SiteFormValue;

    if (this.formMode() === 'create') {
      const id = newId('S');
      const body = this.buildCreateSiteRequest(id, raw);
      this.sitesApi.create(body).subscribe({
        next: (res) => {
          console.log('[SitesManagement] POST /sites', res);
          this.loadSitesFromApi();
          this.formVisible.set(false);
        },
        error: (err) => {
          console.error('[SitesManagement] POST /sites failed', err);
          this.formError.set('Failed to create site — see console.');
        }
      });
      return;
    }

    const id = this.editingId();
    if (!id) return;
    const existing = this.sites().find((s) => s.id === id);
    const approvalStatus = existing?.approvalStatus ?? 'draft';

    this.sitesApi.update(id, this.buildUpdateSiteRequest(raw, approvalStatus)).subscribe({
      next: (res) => {
        console.log('[SitesManagement] PUT /sites/' + id, res);
        this.loadSitesFromApi();
        this.formVisible.set(false);
      },
      error: (err) => {
        console.error('[SitesManagement] PUT /sites failed', err);
        this.formError.set('Failed to update site — see console.');
      }
    });
  }

  private saveGeofence(): void {
    this.geofenceForm.markAllAsTouched();
    if (this.geofenceForm.invalid) {
      this.formError.set('Fix the highlighted geofence fields.');
      return;
    }
    const raw = this.geofenceForm.getRawValue() as GeofenceFormValue;
    const site = this.sites().find((s) => s.id === raw.siteId);
    if (!site) {
      this.formError.set('Select a valid site.');
      return;
    }
    if (raw.zoneType === 'circle' && (raw.radiusM == null || raw.radiusM <= 0)) {
      this.formError.set('Circle zones require a radius in metres.');
      return;
    }

    const payload = {
      siteId: site.id,
      siteName: site.name,
      projectId: site.projectId,
      projectName: site.projectName,
      name: raw.name.trim(),
      zoneType: raw.zoneType,
      radiusM: raw.zoneType === 'circle' ? raw.radiusM : null,
      active: !!raw.active,
      entryAlert: !!raw.entryAlert,
      exitAlert: !!raw.exitAlert
    };

    if (this.formMode() === 'create') {
      const created: GeofenceRecord = {
        id: newId('gf'),
        ...payload,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Geofence zone created', by: 'GIS admin' }],
        attachments: []
      };
      this.geofences.update((l) => [...l, created]);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    const existing = this.geofences().find((g) => g.id === id);
    if (!existing) return;
    this.patchGeofence({
      ...existing,
      ...payload,
      audit: [{ at: auditTimestamp(), action: 'Geofence updated', by: 'GIS admin' }, ...existing.audit]
    });
    this.formVisible.set(false);
  }

  private saveContact(): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) {
      this.formError.set('Fix the highlighted contact fields.');
      return;
    }
    const raw = this.contactForm.getRawValue() as ContactFormValue;
    const site = this.sites().find((s) => s.id === raw.siteId);
    if (!site) {
      this.formError.set('Select a valid site.');
      return;
    }

    const payload = {
      siteId: site.id,
      siteName: site.name,
      projectId: site.projectId,
      projectName: site.projectName,
      name: raw.name.trim(),
      role: raw.role.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim(),
      isPrimary: !!raw.isPrimary
    };

    if (this.formMode() === 'create') {
      const created: SiteContactRecord = {
        id: newId('ct'),
        ...payload,
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'Contact added', by: 'Site admin' }],
        attachments: []
      };
      this.contacts.update((l) => [...l, created]);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    const existing = this.contacts().find((c) => c.id === id);
    if (!existing) return;
    this.patchContact({
      ...existing,
      ...payload,
      audit: [{ at: auditTimestamp(), action: 'Contact updated', by: 'Site admin' }, ...existing.audit]
    });
    this.formVisible.set(false);
  }

  requestDelete(kind: EntityKind, label: string, id: string): void {
    this.deleteKind.set(kind);
    this.deleteLabel.set(label);
    this.editingId.set(id);
    this.deleteConfirmVisible.set(true);
  }

  confirmDelete(): void {
    const id = this.editingId();
    if (!id) return;
    const kind = this.deleteKind();
    if (kind === 'site') {
      this.sitesApi.delete(id).subscribe({
        next: () => {
          this.loadSitesFromApi();
          this.closeDetailIfDeleted(id, kind);
          this.deleteConfirmVisible.set(false);
        },
        error: (err) => {
          console.error('[SitesManagement] DELETE /sites failed', err);
          this.deleteConfirmVisible.set(false);
        }
      });
      return;
    }
    if (kind === 'geofence') {
      this.geofences.update((l) => l.filter((g) => g.id !== id));
    } else {
      this.contacts.update((l) => l.filter((c) => c.id !== id));
    }
    this.closeDetailIfDeleted(id, kind);
    this.deleteConfirmVisible.set(false);
  }

  openDetailSite(site: SiteRecord): void {
    this.detailKind.set('site');
    this.detailSite.set(site);
    this.detailVisible.set(true);
  }

  openDetailGeofence(row: GeofenceRecord): void {
    this.detailKind.set('geofence');
    this.detailGeofence.set(row);
    this.detailVisible.set(true);
  }

  openDetailContact(row: SiteContactRecord): void {
    this.detailKind.set('contact');
    this.detailContact.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  submitApproval(kind: EntityKind, id: string): void {
    this.updateApproval(kind, id, 'pending_approval', 'Submitted for approval', 'Site manager');
  }

  approveEntity(kind: EntityKind, id: string): void {
    this.updateApproval(kind, id, 'approved', 'Approved', 'Commercial director');
  }

  rejectEntity(kind: EntityKind, id: string): void {
    this.updateApproval(kind, id, 'rejected', 'Rejected — revise and resubmit', 'Commercial director');
  }

  exportCsv(): void {
    const tab = this.activeTab();
    let header: string[];
    let lines: string[];

    if (tab === 'hierarchy') {
      const rows = this.filteredSites();
      header = ['id', 'project', 'parentSiteId', 'name', 'location', 'superintendent', 'progressPct', 'approval'];
      lines = rows.map((s) =>
        [s.id, s.projectName, s.parentSiteId ?? '', s.name, s.location, s.superintendent, s.progressPct, s.approvalStatus].join(',')
      );
    } else if (tab === 'geofence') {
      const rows = this.filteredGeofences();
      header = ['id', 'site', 'name', 'zoneType', 'radiusM', 'active', 'approval'];
      lines = rows.map((g) =>
        [g.id, g.siteName, g.name, g.zoneType, g.radiusM ?? '', g.active, g.approvalStatus].join(',')
      );
    } else {
      const rows = this.filteredContacts();
      header = ['id', 'site', 'name', 'role', 'phone', 'email', 'primary', 'approval'];
      lines = rows.map((c) =>
        [c.id, c.siteName, c.name, c.role, c.phone, c.email, c.isPrimary, c.approvalStatus].join(',')
      );
    }

    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sites-${tab}-${Date.now()}.csv`;
    a.click();
  }

  private filterSites(list: SiteRecord[]): SiteRecord[] {
    return this.applyFilters(
      list,
      (s) => s.projectId,
      (s) => s.approvalStatus,
      (s) => [s.name, s.location, s.superintendent, s.id, s.projectName]
    ).sort((a, b) => a.projectName.localeCompare(b.projectName) || this.depth(a) - this.depth(b));
  }

  private filterGeofences(list: GeofenceRecord[]): GeofenceRecord[] {
    return this.applyFilters(
      list,
      (g) => g.projectId,
      (g) => g.approvalStatus,
      (g) => [g.name, g.siteName, g.id]
    );
  }

  private filterContacts(list: SiteContactRecord[]): SiteContactRecord[] {
    return this.applyFilters(
      list,
      (c) => c.projectId,
      (c) => c.approvalStatus,
      (c) => [c.name, c.role, c.email, c.siteName, c.phone]
    );
  }

  private applyFilters<T>(
    list: T[],
    projectFn: (row: T) => string,
    approvalFn: (row: T) => SiteApprovalStatus,
    searchFields: (row: T) => string[]
  ): T[] {
    const project = this.projectFilter();
    const approval = this.approvalFilter();
    const q = this.searchText().trim().toLowerCase();
    return list.filter((row) => {
      if (project !== 'all' && projectFn(row) !== project) return false;
      if (approval !== 'all' && approvalFn(row) !== approval) return false;
      if (!q) return true;
      return searchFields(row).some((f) => f.toLowerCase().includes(q));
    });
  }

  private updateApproval(
    kind: EntityKind,
    id: string,
    status: SiteApprovalStatus,
    action: string,
    by: string
  ): void {
    const entry = { at: auditTimestamp(), action, by };
    if (kind === 'site') {
      const site = this.sites().find((x) => x.id === id);
      if (!site) return;
      if (status === 'pending_approval' && !canSubmitForApproval(site.approvalStatus)) return;
      if (status !== 'pending_approval' && !canApproveOrReject(site.approvalStatus)) return;

      this.sitesApi
        .update(id, this.buildUpdateSiteRequest(this.siteRecordToFormValue(site), status))
        .subscribe({
          next: () => this.loadSitesFromApi(),
          error: (err) => console.error('[SitesManagement] approval update failed', err)
        });
      return;
    }
    if (kind === 'geofence') {
      const g = this.geofences().find((x) => x.id === id);
      if (!g) return;
      if (status === 'pending_approval' && !canSubmitForApproval(g.approvalStatus)) return;
      if (status !== 'pending_approval' && !canApproveOrReject(g.approvalStatus)) return;
      this.patchGeofence({ ...g, approvalStatus: status, audit: [entry, ...g.audit] });
      return;
    }
    const c = this.contacts().find((x) => x.id === id);
    if (!c) return;
    if (status === 'pending_approval' && !canSubmitForApproval(c.approvalStatus)) return;
    if (status !== 'pending_approval' && !canApproveOrReject(c.approvalStatus)) return;
    this.patchContact({ ...c, approvalStatus: status, audit: [entry, ...c.audit] });
  }

  private patchSite(updated: SiteRecord): void {
    this.sites.update((l) => l.map((s) => (s.id === updated.id ? updated : s)));
    if (this.detailSite()?.id === updated.id) this.detailSite.set(updated);
  }

  private patchGeofence(updated: GeofenceRecord): void {
    this.geofences.update((l) => l.map((g) => (g.id === updated.id ? updated : g)));
    if (this.detailGeofence()?.id === updated.id) this.detailGeofence.set(updated);
  }

  private patchContact(updated: SiteContactRecord): void {
    this.contacts.update((l) => l.map((c) => (c.id === updated.id ? updated : c)));
    if (this.detailContact()?.id === updated.id) this.detailContact.set(updated);
  }

  private syncGeofenceContactProjectNames(site: SiteRecord): void {
    this.geofences.update((list) =>
      list.map((g) =>
        g.siteId === site.id
          ? { ...g, siteName: site.name, projectId: site.projectId, projectName: site.projectName }
          : g
      )
    );
    this.contacts.update((list) =>
      list.map((c) =>
        c.siteId === site.id
          ? { ...c, siteName: site.name, projectId: site.projectId, projectName: site.projectName }
          : c
      )
    );
  }

  private closeDetailIfDeleted(id: string, kind: EntityKind): void {
    if (kind === 'site' && this.detailSite()?.id === id) this.closeDetail();
    if (kind === 'geofence' && this.detailGeofence()?.id === id) this.closeDetail();
    if (kind === 'contact' && this.detailContact()?.id === id) this.closeDetail();
  }
}
