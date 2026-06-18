import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  CreateProjectsRequest,
  ProjectsApiService,
  SitesApiService,
  UpdateProjectsRequest,
  countSitesByProject,
  projectDtoToRegister
} from '../../../core/api/project-planning';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  PROJECT_APPROVAL_FILTER_OPTIONS,
  PROJECT_CURRENCY_OPTIONS,
  PROJECT_FORM_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  approvalStatusLabel,
  approvalStatusSeverity,
  canApproveOrReject,
  canSubmitForApproval,
  formatContractValue,
  newProjectId,
  projectStatusSeverity,
  type ProjectApprovalStatus,
  type ProjectFormValue,
  type ProjectLifecycleStatus,
  type ProjectRegister
} from './projects-register.data';

@Component({
  selector: 'app-projects-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Select,
    TableModule,
    Tag,
    Textarea
  ],
  templateUrl: './projects-register.component.html',
  styleUrl: './projects-register.component.scss'
})
export class ProjectsRegisterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly sitesApi = inject(SitesApiService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly statusFilterOptions = PROJECT_STATUS_OPTIONS;
  readonly approvalFilterOptions = PROJECT_APPROVAL_FILTER_OPTIONS;
  readonly formStatusOptions = PROJECT_FORM_STATUS_OPTIONS;
  readonly currencyOptions = PROJECT_CURRENCY_OPTIONS;

  /** Loaded from GET /projects (+ site counts). */
  readonly projects = signal<ProjectRegister[]>([]);

  readonly statusFilter = signal('all');
  readonly approvalFilter = signal<ProjectApprovalStatus | 'all'>('all');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.projects()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailProject = signal<ProjectRegister | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly projectToDelete = signal<ProjectRegister | null>(null);
  readonly formError = signal<string | null>(null);

  readonly projectForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    client: ['', [Validators.required, Validators.maxLength(80)]],
    status: ['Active' as ProjectLifecycleStatus, Validators.required],
    contractValue: [0, [Validators.required, Validators.min(1)]],
    currency: ['AED', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    projectManager: ['', [Validators.required, Validators.maxLength(80)]],
    scopeSummary: ['', Validators.maxLength(2000)]
  });

  readonly filteredProjects = computed(() => {
    const status = this.statusFilter();
    const approval = this.approvalFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.projects()
      .filter((p) => {
        if (status !== 'all' && p.status !== status) return false;
        if (approval !== 'all' && p.approvalStatus !== approval) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.projectManager.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly selectedProject = computed(
    () => this.projects().find((p) => p.id === this.selectedId()) ?? null
  );

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Add project' : 'Edit project'
  );

  ngOnInit(): void {
    this.loadProjectsFromApi();
  }

  private loadProjectsFromApi(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      projects: this.projectsApi.list(),
      sites: this.sitesApi.list()
    }).subscribe({
      next: ({ projects, sites }) => {
        const siteCounts = countSitesByProject(sites);
        const mapped = projects.map((p) => projectDtoToRegister(p, siteCounts[p.id] ?? 0));
        this.projects.set(mapped);
        const detailId = this.detailProject()?.id;
        if (detailId) {
          const refreshed = mapped.find((p) => p.id === detailId) ?? null;
          this.detailProject.set(refreshed);
          if (!refreshed) this.detailVisible.set(false);
        }
        if (!this.selectedId() && mapped.length > 0) {
          this.selectedId.set(mapped[0].id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[ProjectsRegister] load failed', err);
        this.loadError.set('Could not load projects from the server.');
        this.loading.set(false);
      }
    });
  }

  private buildCreateRequest(id: string, raw: ProjectFormValue): CreateProjectsRequest {
    return {
      id,
      code: id,
      name: raw.name.trim(),
      clientName: raw.client.trim(),
      status: raw.status,
      approvalStatus: 'draft',
      contractValue: raw.contractValue,
      currency: raw.currency,
      startDate: raw.startDate,
      endDate: raw.endDate,
      projectManager: raw.projectManager.trim(),
      scopeSummary: raw.scopeSummary.trim(),
      legacyBoqSlug: null,
      clientId: null,
      erpCostCenterId: null
    };
  }

  private buildUpdateRequest(
    raw: ProjectFormValue,
    approvalStatus: string
  ): UpdateProjectsRequest {
    const id = this.editingId() ?? newProjectId();
    return {
      ...this.buildCreateRequest(id, raw),
      approvalStatus
    };
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Projects' });
    return items;
  });

  statusSeverity(status: ProjectLifecycleStatus) {
    return projectStatusSeverity(status);
  }

  approvalSeverity(status: ProjectApprovalStatus) {
    return approvalStatusSeverity(status);
  }

  approvalLabel(status: ProjectApprovalStatus) {
    return approvalStatusLabel(status);
  }

  contractDisplay(p: ProjectRegister): string {
    return formatContractValue(p.contractValue, p.currency);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.projectForm.reset({
      name: '',
      client: '',
      status: 'Planned',
      contractValue: 0,
      currency: 'AED',
      startDate: '',
      endDate: '',
      projectManager: '',
      scopeSummary: ''
    });
    this.formVisible.set(true);
  }

  openEdit(project: ProjectRegister): void {
    this.formMode.set('edit');
    this.editingId.set(project.id);
    this.formError.set(null);
    this.projectForm.patchValue({
      name: project.name,
      client: project.client,
      status: project.status,
      contractValue: project.contractValue,
      currency: project.currency,
      startDate: project.startDate,
      endDate: project.endDate,
      projectManager: project.projectManager,
      scopeSummary: project.scopeSummary
    });
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  saveProject(): void {
    this.projectForm.markAllAsTouched();
    if (this.projectForm.invalid) {
      this.formError.set('Fix the highlighted fields before saving.');
      return;
    }

    const raw = this.projectForm.getRawValue() as ProjectFormValue;
    if (raw.endDate < raw.startDate) {
      this.formError.set('End date must be on or after start date.');
      return;
    }

    if (this.formMode() === 'create') {
      const id = newProjectId();
      const body = this.buildCreateRequest(id, raw);
      this.projectsApi.create(body).subscribe({
        next: (res) => {
          console.log('[ProjectsRegister] POST /projects', res);
          this.loadProjectsFromApi();
          this.formVisible.set(false);
        },
        error: (err) => {
          console.error('[ProjectsRegister] POST /projects failed', err);
          this.formError.set('Failed to create project — see console.');
        }
      });
      return;
    }

    const id = this.editingId();
    if (!id) return;
    const existing = this.projects().find((p) => p.id === id);
    const approvalStatus = existing?.approvalStatus ?? 'draft';

    this.projectsApi.update(id, this.buildUpdateRequest(raw, approvalStatus)).subscribe({
      next: (res) => {
        console.log('[ProjectsRegister] PUT /projects/' + id, res);
        this.loadProjectsFromApi();
        this.formVisible.set(false);
      },
      error: (err) => {
        console.error('[ProjectsRegister] PUT /projects failed', err);
        this.formError.set('Failed to update project — see console.');
      }
    });
  }

  requestDelete(project: ProjectRegister): void {
    this.projectToDelete.set(project);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.projectToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.projectToDelete();
    if (!target) return;
    this.projectsApi.delete(target.id).subscribe({
      next: () => {
        console.log('[ProjectsRegister] DELETE /projects/' + target.id);
        this.loadProjectsFromApi();
        if (this.selectedId() === target.id) {
          this.selectedId.set(null);
        }
        if (this.detailProject()?.id === target.id) {
          this.detailVisible.set(false);
          this.detailProject.set(null);
        }
        this.cancelDelete();
      },
      error: (err) => {
        console.error('[ProjectsRegister] DELETE /projects failed', err);
        this.cancelDelete();
      }
    });
  }

  openDetail(project: ProjectRegister): void {
    this.detailProject.set(project);
    this.selectedId.set(project.id);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  editFromDetail(): void {
    const p = this.detailProject();
    if (!p) return;
    this.detailVisible.set(false);
    this.openEdit(p);
  }

  submitForApproval(project: ProjectRegister): void {
    if (!canSubmitForApproval(project)) return;
    this.persistApprovalStatus(project, 'pending_approval');
  }

  approveProject(project: ProjectRegister): void {
    if (!canApproveOrReject(project)) return;
    this.persistApprovalStatus(project, 'approved');
  }

  rejectProject(project: ProjectRegister): void {
    if (!canApproveOrReject(project)) return;
    this.persistApprovalStatus(project, 'rejected');
  }

  private persistApprovalStatus(
    project: ProjectRegister,
    approvalStatus: ProjectApprovalStatus
  ): void {
    const body = this.buildUpdateRequest(
      {
        name: project.name,
        client: project.client,
        status: project.status,
        contractValue: project.contractValue,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        projectManager: project.projectManager,
        scopeSummary: project.scopeSummary
      },
      approvalStatus
    );
    this.projectsApi.update(project.id, body).subscribe({
      next: () => this.loadProjectsFromApi(),
      error: (err) => console.error('[ProjectsRegister] approval update failed', err)
    });
  }

  canSubmit(p: ProjectRegister): boolean {
    return canSubmitForApproval(p);
  }

  canApprove(p: ProjectRegister): boolean {
    return canApproveOrReject(p);
  }

  exportCsv(): void {
    const rows = this.filteredProjects();
    const header = [
      'id',
      'name',
      'client',
      'status',
      'approvalStatus',
      'contractValue',
      'currency',
      'startDate',
      'endDate',
      'projectManager',
      'linkedSiteCount'
    ];
    const lines = [
      header.join(','),
      ...rows.map((p) =>
        [
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.client.replace(/"/g, '""')}"`,
          p.status,
          p.approvalStatus,
          p.contractValue,
          p.currency,
          p.startDate,
          p.endDate,
          `"${p.projectManager.replace(/"/g, '""')}"`,
          p.linkedSiteCount
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-register-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  fieldInvalid(name: keyof ProjectFormValue): boolean {
    const c = this.projectForm.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }
}
