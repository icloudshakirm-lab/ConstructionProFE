import { DecimalPipe } from '@angular/common';
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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  DSR_APPROVAL_FILTER_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PROJECT_FORM_OPTIONS,
  SIGNOFF_FILTER_OPTIONS,
  WEATHER_OPTIONS,
  allSiteFormOptions,
  approvalStatusLabel,
  approvalStatusSeverity,
  auditTimestamp,
  boqLineOptions,
  canApproveOrReject,
  canSubmitForApproval,
  canSupervisorSignOff,
  initialDailyProgressRecords,
  newAttachmentId,
  newDsrId,
  newPhotoId,
  newQuantityId,
  projectLabel,
  siteLabel,
  todayIso,
  totalReportedQty,
  weatherSeverity,
  type DailyProgressFormValue,
  type DailyProgressRecord,
  type ProgressPhoto,
  type ProgressQuantityLine
} from './daily-progress.data';

type ChildKind = 'quantity' | 'photo';

@Component({
  selector: 'app-daily-progress',
  imports: [
    DecimalPipe,
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
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    Textarea
  ],
  templateUrl: './daily-progress.component.html',
  styleUrl: './daily-progress.component.scss'
})
export class DailyProgressComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly approvalFilterOptions = DSR_APPROVAL_FILTER_OPTIONS;
  readonly signoffFilterOptions = SIGNOFF_FILTER_OPTIONS;
  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly projectFormOptions = PROJECT_FORM_OPTIONS;
  readonly weatherOptions = WEATHER_OPTIONS;
  readonly boqOptions = boqLineOptions();
  readonly allSites = allSiteFormOptions();

  readonly records = signal<DailyProgressRecord[]>(initialDailyProgressRecords());

  readonly approvalFilter = signal<'all' | DailyProgressRecord['approvalStatus']>('all');
  readonly signoffFilter = signal<'all' | 'signed' | 'pending'>('all');
  readonly projectFilter = signal('all');
  readonly dateFilter = signal('');
  readonly searchText = signal('');
  readonly selectedId = signal<string | null>(this.records()[0]?.id ?? null);

  readonly detailVisible = signal(false);
  readonly detailRecord = signal<DailyProgressRecord | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly recordToDelete = signal<DailyProgressRecord | null>(null);

  readonly childFormVisible = signal(false);
  readonly childFormMode = signal<'create' | 'edit'>('create');
  readonly childFormKind = signal<ChildKind>('quantity');
  readonly childEditingId = signal<string | null>(null);
  readonly childFormError = signal<string | null>(null);

  readonly dsrForm = this.fb.nonNullable.group({
    dsrNumber: ['', [Validators.required, Validators.maxLength(24)]],
    reportDate: ['', Validators.required],
    projectId: ['', Validators.required],
    siteId: ['', Validators.required],
    submittedBy: ['', [Validators.required, Validators.maxLength(80)]],
    supervisorName: ['', [Validators.required, Validators.maxLength(80)]],
    weather: ['Clear' as DailyProgressRecord['weather'], Validators.required],
    temperatureC: [30, [Validators.required, Validators.min(-10), Validators.max(55)]],
    humidityPct: [50, [Validators.min(0), Validators.max(100)]],
    windSpeedKmh: [0, [Validators.min(0), Validators.max(200)]],
    manpowerCount: [0, [Validators.required, Validators.min(0)]],
    equipmentCount: [0, [Validators.min(0)]],
    workSummary: ['', [Validators.required, Validators.maxLength(1000)]],
    safetyNotes: ['', Validators.maxLength(500)],
    incidents: ['', Validators.maxLength(500)]
  });

  readonly quantityForm = this.fb.nonNullable.group({
    boqItemId: ['', Validators.required],
    reportedQty: [0, [Validators.required, Validators.min(0)]],
    cumulativeQty: [0, [Validators.required, Validators.min(0)]],
    remarks: ['', Validators.maxLength(200)]
  });

  readonly photoForm = this.fb.nonNullable.group({
    caption: ['', [Validators.required, Validators.maxLength(120)]],
    album: ['Progress', Validators.required],
    capturedAt: ['', Validators.required],
    gpsTag: ['', Validators.maxLength(80)]
  });

  readonly filteredRecords = computed(() => {
    const approval = this.approvalFilter();
    const signoff = this.signoffFilter();
    const project = this.projectFilter();
    const date = this.dateFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.records()
      .filter((r) => {
        if (approval !== 'all' && r.approvalStatus !== approval) return false;
        if (signoff === 'signed' && !r.supervisorSignOff) return false;
        if (signoff === 'pending' && r.supervisorSignOff) return false;
        if (project !== 'all' && r.projectId !== project) return false;
        if (date && r.reportDate !== date) return false;
        if (!q) return true;
        return (
          r.dsrNumber.toLowerCase().includes(q) ||
          r.submittedBy.toLowerCase().includes(q) ||
          r.supervisorName.toLowerCase().includes(q) ||
          r.workSummary.toLowerCase().includes(q) ||
          projectLabel(r.projectId).toLowerCase().includes(q) ||
          siteLabel(r.siteId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  });

  readonly siteFormOptions = computed(() => {
    const projectId = this.dsrForm.controls.projectId.value;
    if (!projectId) return this.allSites.map((s) => ({ label: s.label, value: s.value }));
    return this.allSites.filter((s) => s.projectId === projectId).map((s) => ({ label: s.label, value: s.value }));
  });

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Submit daily progress' : 'Edit daily progress'
  );

  readonly childFormHeader = computed(() => {
    const kind = this.childFormKind() === 'quantity' ? 'Quantity line' : 'Progress photo';
    return this.childFormMode() === 'create' ? `Add ${kind.toLowerCase()}` : `Edit ${kind.toLowerCase()}`;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Submit Daily Progress' });
    return items;
  });

  projectName(id: string | null): string {
    return projectLabel(id);
  }

  siteName(id: string | null): string {
    return siteLabel(id);
  }

  approvalLabel(status: DailyProgressRecord['approvalStatus']): string {
    return approvalStatusLabel(status);
  }

  approvalSeverity(status: DailyProgressRecord['approvalStatus']) {
    return approvalStatusSeverity(status);
  }

  weatherTagSeverity(weather: DailyProgressRecord['weather']) {
    return weatherSeverity(weather);
  }

  qtyTotal(r: DailyProgressRecord): number {
    return totalReportedQty(r);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    const date = todayIso();
    this.dsrForm.reset({
      dsrNumber: `DSR-${date.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
      reportDate: date,
      projectId: '',
      siteId: '',
      submittedBy: 'Eng. Ravi Menon',
      supervisorName: 'Ahmed Al Mansoori',
      weather: 'Clear',
      temperatureC: 35,
      humidityPct: 45,
      windSpeedKmh: 10,
      manpowerCount: 0,
      equipmentCount: 0,
      workSummary: '',
      safetyNotes: '',
      incidents: ''
    });
    this.formVisible.set(true);
  }

  openEdit(row: DailyProgressRecord): void {
    this.formMode.set('edit');
    this.editingId.set(row.id);
    this.formError.set(null);
    this.dsrForm.patchValue(row);
    this.formVisible.set(true);
  }

  openDetail(row: DailyProgressRecord): void {
    this.detailRecord.set(row);
    this.detailVisible.set(true);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
    this.detailRecord.set(null);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  onProjectChange(): void {
    const projectId = this.dsrForm.controls.projectId.value;
    const siteId = this.dsrForm.controls.siteId.value;
    const site = this.allSites.find((s) => s.value === siteId);
    if (site && site.projectId !== projectId) {
      this.dsrForm.controls.siteId.setValue('');
    }
  }

  saveDsr(): void {
    if (this.dsrForm.invalid) {
      this.dsrForm.markAllAsTouched();
      this.formError.set('Please complete all required fields.');
      return;
    }

    const value = this.dsrForm.getRawValue() as DailyProgressFormValue;

    if (this.formMode() === 'create') {
      const created: DailyProgressRecord = {
        id: newDsrId(),
        ...value,
        quantities: [],
        photos: [],
        supervisorSignOff: false,
        signOffAt: '',
        signOffBy: '',
        approvalStatus: 'draft',
        audit: [{ at: auditTimestamp(), action: 'DSR created from mobile', by: value.submittedBy }],
        attachments: []
      };
      this.records.update((list) => [created, ...list]);
      this.selectedId.set(created.id);
    } else {
      const id = this.editingId();
      if (!id) return;
      const existing = this.records().find((r) => r.id === id);
      if (!existing) return;
      const updated: DailyProgressRecord = {
        ...existing,
        ...value,
        audit: [{ at: auditTimestamp(), action: 'DSR updated', by: value.submittedBy }, ...existing.audit]
      };
      this.patchRecord(updated);
      if (this.detailRecord()?.id === id) {
        this.detailRecord.set(updated);
      }
    }

    this.closeForm();
  }

  requestDelete(row: DailyProgressRecord): void {
    this.recordToDelete.set(row);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.recordToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.recordToDelete();
    if (!target) return;
    const next = this.records().filter((r) => r.id !== target.id);
    this.records.set(next);
    if (this.selectedId() === target.id) {
      this.selectedId.set(next[0]?.id ?? null);
    }
    if (this.detailRecord()?.id === target.id) {
      this.closeDetail();
    }
    this.cancelDelete();
  }

  submitForApproval(record: DailyProgressRecord): void {
    if (!canSubmitForApproval(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'pending_approval',
      audit: [{ at: auditTimestamp(), action: 'Submitted for supervisor review', by: record.submittedBy }, ...record.audit]
    });
  }

  supervisorSignOff(record: DailyProgressRecord): void {
    if (!canSupervisorSignOff(record)) return;
    this.patchRecord({
      ...record,
      supervisorSignOff: true,
      signOffAt: auditTimestamp(),
      signOffBy: record.supervisorName,
      audit: [
        { at: auditTimestamp(), action: 'Supervisor sign-off recorded', by: record.supervisorName },
        ...record.audit
      ]
    });
  }

  approveDsr(record: DailyProgressRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'approved',
      audit: [{ at: auditTimestamp(), action: 'DSR approved — quantities locked for billing', by: 'Project manager' }, ...record.audit]
    });
  }

  rejectDsr(record: DailyProgressRecord): void {
    if (!canApproveOrReject(record)) return;
    this.patchRecord({
      ...record,
      approvalStatus: 'rejected',
      supervisorSignOff: false,
      signOffAt: '',
      signOffBy: '',
      audit: [
        { at: auditTimestamp(), action: 'DSR rejected — revise quantities or attach photos', by: 'Project manager' },
        ...record.audit
      ]
    });
  }

  canSubmit(r: DailyProgressRecord): boolean {
    return canSubmitForApproval(r);
  }

  canSignOff(r: DailyProgressRecord): boolean {
    return canSupervisorSignOff(r);
  }

  canApprove(r: DailyProgressRecord): boolean {
    return canApproveOrReject(r);
  }

  mockAddAttachment(record: DailyProgressRecord): void {
    const attachment = {
      id: newAttachmentId(),
      name: `DSR-${record.dsrNumber}-attachment.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };
    this.patchRecord({
      ...record,
      attachments: [attachment, ...record.attachments],
      audit: [{ at: auditTimestamp(), action: `Attachment added: ${attachment.name}`, by: record.submittedBy }, ...record.audit]
    });
  }

  mockCapturePhoto(record: DailyProgressRecord): void {
    const photo: ProgressPhoto = {
      id: newPhotoId(),
      caption: `Field capture ${new Date().toLocaleTimeString()}`,
      album: 'Progress',
      capturedAt: new Date().toISOString(),
      gpsTag: '25.2048° N, 55.2708° E (GPS verified)'
    };
    this.patchRecord({
      ...record,
      photos: [photo, ...record.photos],
      audit: [{ at: auditTimestamp(), action: `Photo captured: ${photo.caption}`, by: record.submittedBy }, ...record.audit]
    });
  }

  openAddQuantity(): void {
    this.childFormKind.set('quantity');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.quantityForm.reset({ boqItemId: '', reportedQty: 0, cumulativeQty: 0, remarks: '' });
    this.childFormVisible.set(true);
  }

  openEditQuantity(row: ProgressQuantityLine): void {
    this.childFormKind.set('quantity');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.quantityForm.patchValue({
      boqItemId: row.boqItemId,
      reportedQty: row.reportedQty,
      cumulativeQty: row.cumulativeQty,
      remarks: row.remarks
    });
    this.childFormVisible.set(true);
  }

  openAddPhoto(): void {
    this.childFormKind.set('photo');
    this.childFormMode.set('create');
    this.childEditingId.set(null);
    this.childFormError.set(null);
    this.photoForm.reset({
      caption: '',
      album: 'Progress',
      capturedAt: new Date().toISOString().slice(0, 16),
      gpsTag: '25.2048° N, 55.2708° E'
    });
    this.childFormVisible.set(true);
  }

  openEditPhoto(row: ProgressPhoto): void {
    this.childFormKind.set('photo');
    this.childFormMode.set('edit');
    this.childEditingId.set(row.id);
    this.childFormError.set(null);
    this.photoForm.patchValue({ ...row, capturedAt: row.capturedAt.slice(0, 16) });
    this.childFormVisible.set(true);
  }

  closeChildForm(): void {
    this.childFormVisible.set(false);
    this.childFormError.set(null);
  }

  saveChildRecord(): void {
    const record = this.detailRecord();
    if (!record) return;
    if (this.childFormKind() === 'quantity') {
      this.saveQuantity(record);
    } else {
      this.savePhoto(record);
    }
  }

  deleteQuantity(row: ProgressQuantityLine): void {
    const record = this.detailRecord();
    if (!record) return;
    this.patchRecord({
      ...record,
      quantities: record.quantities.filter((q) => q.id !== row.id),
      audit: [{ at: auditTimestamp(), action: `Quantity removed: ${row.itemCode}`, by: record.submittedBy }, ...record.audit]
    });
  }

  deletePhoto(row: ProgressPhoto): void {
    const record = this.detailRecord();
    if (!record) return;
    this.patchRecord({
      ...record,
      photos: record.photos.filter((p) => p.id !== row.id),
      audit: [{ at: auditTimestamp(), action: `Photo removed: ${row.caption}`, by: record.submittedBy }, ...record.audit]
    });
  }

  onBoqItemChange(): void {
    const id = this.quantityForm.controls.boqItemId.value;
    const item = this.boqOptions.find((o) => o.value === id);
    if (item && this.childFormMode() === 'create') {
      this.quantityForm.controls.cumulativeQty.setValue(item.plannedQty * 0.5);
    }
  }

  exportCsv(): void {
    const rows = this.filteredRecords();
    const header = [
      'id',
      'dsrNumber',
      'reportDate',
      'projectId',
      'siteId',
      'submittedBy',
      'supervisorName',
      'weather',
      'manpowerCount',
      'equipmentCount',
      'qtyLines',
      'photoCount',
      'supervisorSignOff',
      'approvalStatus'
    ];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.dsrNumber,
          r.reportDate,
          r.projectId,
          r.siteId,
          `"${r.submittedBy.replace(/"/g, '""')}"`,
          `"${r.supervisorName.replace(/"/g, '""')}"`,
          r.weather,
          r.manpowerCount,
          r.equipmentCount,
          r.quantities.length,
          r.photos.length,
          r.supervisorSignOff,
          r.approvalStatus
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-progress-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private saveQuantity(record: DailyProgressRecord): void {
    if (this.quantityForm.invalid) {
      this.quantityForm.markAllAsTouched();
      this.childFormError.set('Please complete all required quantity fields.');
      return;
    }
    const raw = this.quantityForm.getRawValue();
    const boq = this.boqOptions.find((o) => o.value === raw.boqItemId);
    if (!boq) return;

    const line: ProgressQuantityLine = {
      id: this.childFormMode() === 'create' ? newQuantityId() : this.childEditingId()!,
      boqItemId: raw.boqItemId,
      itemCode: boq.itemCode,
      description: boq.description,
      unit: boq.unit,
      plannedQty: boq.plannedQty,
      reportedQty: raw.reportedQty,
      cumulativeQty: raw.cumulativeQty,
      remarks: raw.remarks
    };

    const quantities =
      this.childFormMode() === 'create'
        ? [...record.quantities, line]
        : record.quantities.map((q) => (q.id === line.id ? line : q));

    this.patchRecord({
      ...record,
      quantities,
      audit: [
        {
          at: auditTimestamp(),
          action: this.childFormMode() === 'create' ? `Quantity added: ${line.itemCode}` : `Quantity updated: ${line.itemCode}`,
          by: record.submittedBy
        },
        ...record.audit
      ]
    });
    this.closeChildForm();
  }

  private savePhoto(record: DailyProgressRecord): void {
    if (this.photoForm.invalid) {
      this.photoForm.markAllAsTouched();
      this.childFormError.set('Please complete all required photo fields.');
      return;
    }
    const value = this.photoForm.getRawValue();
    const photo: ProgressPhoto = {
      id: this.childFormMode() === 'create' ? newPhotoId() : this.childEditingId()!,
      ...value,
      capturedAt: value.capturedAt.length === 16 ? `${value.capturedAt}:00` : value.capturedAt
    };

    const photos =
      this.childFormMode() === 'create'
        ? [...record.photos, photo]
        : record.photos.map((p) => (p.id === photo.id ? photo : p));

    this.patchRecord({
      ...record,
      photos,
      audit: [
        {
          at: auditTimestamp(),
          action: this.childFormMode() === 'create' ? `Photo added: ${photo.caption}` : `Photo updated: ${photo.caption}`,
          by: record.submittedBy
        },
        ...record.audit
      ]
    });
    this.closeChildForm();
  }

  private patchRecord(updated: DailyProgressRecord): void {
    this.records.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    if (this.detailRecord()?.id === updated.id) {
      this.detailRecord.set(updated);
    }
  }
}
