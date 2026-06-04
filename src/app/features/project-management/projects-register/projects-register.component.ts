import { Component, computed, inject, signal } from '@angular/core';
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
  auditTimestamp,
  canApproveOrReject,
  canSubmitForApproval,
  formatContractValue,
  initialProjectRegister,
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
export class ProjectsRegisterComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly statusFilterOptions = PROJECT_STATUS_OPTIONS;
  readonly approvalFilterOptions = PROJECT_APPROVAL_FILTER_OPTIONS;
  readonly formStatusOptions = PROJECT_FORM_STATUS_OPTIONS;
  readonly currencyOptions = PROJECT_CURRENCY_OPTIONS;

  readonly projects = signal<ProjectRegister[]>(initialProjectRegister());

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

    const payload = {
      name: raw.name.trim(),
      client: raw.client.trim(),
      status: raw.status,
      contractValue: raw.contractValue,
      currency: raw.currency,
      startDate: raw.startDate,
      endDate: raw.endDate,
      projectManager: raw.projectManager.trim(),
      scopeSummary: raw.scopeSummary.trim()
    };

    if (this.formMode() === 'create') {
      const created: ProjectRegister = {
        id: newProjectId(),
        ...payload,
        approvalStatus: 'draft',
        linkedSiteCount: 0,
        audit: [{ at: auditTimestamp(), action: 'Project created', by: 'Project admin' }],
        attachments: []
      };
      this.projects.update((list) => [...list, created]);
      this.selectedId.set(created.id);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    if (!id) return;
    const existing = this.projects().find((p) => p.id === id);
    if (!existing) return;

    const updated: ProjectRegister = {
      ...existing,
      ...payload,
      audit: [
        { at: auditTimestamp(), action: 'Project record updated', by: 'Project admin' },
        ...existing.audit
      ]
    };
    this.patchProject(updated);
    this.formVisible.set(false);
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
    const next = this.projects().filter((p) => p.id !== target.id);
    this.projects.set(next);
    if (this.selectedId() === target.id) {
      this.selectedId.set(next[0]?.id ?? null);
    }
    if (this.detailProject()?.id === target.id) {
      this.detailVisible.set(false);
      this.detailProject.set(null);
    }
    this.cancelDelete();
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
    this.patchProject({
      ...project,
      approvalStatus: 'pending_approval',
      audit: [
        { at: auditTimestamp(), action: 'Submitted for approval', by: 'Project manager' },
        ...project.audit
      ]
    });
  }

  approveProject(project: ProjectRegister): void {
    if (!canApproveOrReject(project)) return;
    this.patchProject({
      ...project,
      approvalStatus: 'approved',
      audit: [
        { at: auditTimestamp(), action: 'Project charter approved', by: 'Commercial director' },
        ...project.audit
      ]
    });
  }

  rejectProject(project: ProjectRegister): void {
    if (!canApproveOrReject(project)) return;
    this.patchProject({
      ...project,
      approvalStatus: 'rejected',
      audit: [
        { at: auditTimestamp(), action: 'Approval rejected — revise contract summary', by: 'Commercial director' },
        ...project.audit
      ]
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

  private patchProject(updated: ProjectRegister): void {
    this.projects.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    if (this.detailProject()?.id === updated.id) {
      this.detailProject.set(updated);
    }
  }
}
