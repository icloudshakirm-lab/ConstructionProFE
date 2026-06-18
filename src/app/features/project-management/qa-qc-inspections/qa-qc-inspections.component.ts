import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import { QaInspectionsApiService } from '../../../core/api/project-planning';
import {
  BOQ_PROJECTS,
  DEMO_QA_QC_INSPECTIONS,
  FlowNodeId,
  INSPECTION_STATUS_LABELS,
  InspectionStatus,
  QA_ENGINEER_OPTIONS,
  QaQcInspection,
  SITE_TEAM_OPTIONS,
  WBS_TASK_OPTIONS,
  actionLabel,
  availableActions,
  formatDateTime,
  nextStatus,
  statusToFlowNode
} from './qa-qc-inspections.data';

@Component({
  selector: 'app-qa-qc-inspections',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    InputText,
    Select,
    Tag,
    Textarea
  ],
  templateUrl: './qa-qc-inspections.component.html',
  styleUrl: './qa-qc-inspections.component.scss'
})
export class QaQcInspectionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly qaInspectionsApi = inject(QaInspectionsApiService);

  readonly projectOptions = BOQ_PROJECTS;
  readonly siteTeamOptions = SITE_TEAM_OPTIONS;
  readonly qaEngineerOptions = QA_ENGINEER_OPTIONS;
  readonly wbsTaskOptions = WBS_TASK_OPTIONS;
  readonly statusLabels = INSPECTION_STATUS_LABELS;

  readonly selectedProjectId = signal('tower-a');
  readonly inspections = signal<QaQcInspection[]>([]);
  readonly selectedId = signal('insp-1');
  readonly flowchartExpanded = signal(true);

  readonly createDialogVisible = signal(false);
  readonly actionDialogVisible = signal(false);
  readonly pendingActionId = signal<string | null>(null);
  readonly actionNote = signal('');

  readonly createDraft = signal({
    siteName: '',
    wbsTask: '',
    workPackage: '',
    description: '',
    siteTeamAssignee: null as string | null
  });

  readonly assignQaDialogVisible = signal(false);
  readonly assignQaEngineer = signal<string | null>(null);
  readonly assignTeamDialogVisible = signal(false);
  readonly assignTeamPick = signal<string | null>(null);

  ngOnInit(): void {
    this.qaInspectionsApi.list().subscribe({
      next: (data) => console.log('[QaQcInspections] GET /qa-inspections', data),
      error: (err) => console.error('[QaQcInspections] GET /qa-inspections failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'QA/QC Inspections' });
    return items;
  });

  readonly projectInspections = computed(() => {
    const pid = this.selectedProjectId();
    return [...this.inspections()]
      .filter((i) => i.projectId === pid)
      .sort((a, b) => (b.requestedAt ?? b.history[0]?.at ?? '').localeCompare(a.requestedAt ?? a.history[0]?.at ?? ''));
  });

  readonly selectedInspection = computed(() =>
    this.inspections().find((i) => i.id === this.selectedId()) ?? null
  );

  readonly activeFlowNode = computed((): FlowNodeId | null => {
    const insp = this.selectedInspection();
    return insp ? statusToFlowNode(insp.status) : null;
  });

  readonly pendingInspectionCount = computed(
    () =>
      this.projectInspections().filter((i) =>
        ['inspection-requested', 'under-inspection', 're-inspection-requested', 'under-re-inspection'].includes(
          i.status
        )
      ).length
  );

  readonly reworkCount = computed(
    () => this.projectInspections().filter((i) => ['rework-required', 'rejected'].includes(i.status)).length
  );

  readonly approvedCount = computed(
    () => this.projectInspections().filter((i) => i.status === 'approved').length
  );

  readonly actions = computed(() => {
    const insp = this.selectedInspection();
    return insp ? availableActions(insp.status) : [];
  });

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    const first = this.projectInspections()[0];
    if (first) this.selectedId.set(first.id);
  }

  selectInspection(id: string): void {
    this.selectedId.set(id);
  }

  isFlowActive(node: FlowNodeId): boolean {
    return this.activeFlowNode() === node;
  }

  isFlowPast(node: FlowNodeId): boolean {
    const insp = this.selectedInspection();
    if (!insp) return false;
    const order: FlowNodeId[] = [
      'task-assigned',
      'work-completed',
      'inspection-requested',
      'under-inspection',
      'approved'
    ];
    const reworkOrder: FlowNodeId[] = [
      'rework-required',
      'corrective-action-done',
      're-inspection-requested',
      'under-re-inspection',
      'approved'
    ];
    const current = statusToFlowNode(insp.status);
    const mainIdx = order.indexOf(current);
    const nodeMainIdx = order.indexOf(node);
    if (nodeMainIdx >= 0 && mainIdx >= 0) return nodeMainIdx < mainIdx;

    const reworkIdx = reworkOrder.indexOf(current);
    const nodeReworkIdx = reworkOrder.indexOf(node);
    if (nodeReworkIdx >= 0 && reworkIdx >= 0) return nodeReworkIdx < reworkIdx;

    if (insp.status === 'approved') return node !== 'rework-required' && node !== 'rejected';
    return false;
  }

  statusSeverity(
    status: InspectionStatus
  ): 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast' {
    switch (status) {
      case 'approved':
        return 'success';
      case 'under-inspection':
      case 'under-re-inspection':
        return 'info';
      case 'rework-required':
      case 'rejected':
        return 'danger';
      case 'inspection-requested':
      case 're-inspection-requested':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  formatDateTime(iso: string | null): string {
    return formatDateTime(iso);
  }

  updateCreateDraft(
    patch: Partial<{
      siteName: string;
      wbsTask: string;
      workPackage: string;
      description: string;
      siteTeamAssignee: string | null;
    }>
  ): void {
    this.createDraft.update((d) => ({ ...d, ...patch }));
  }

  openCreate(): void {
    this.createDraft.set({
      siteName: '',
      wbsTask: '',
      workPackage: '',
      description: '',
      siteTeamAssignee: null
    });
    this.createDialogVisible.set(true);
  }

  saveCreate(): void {
    const d = this.createDraft();
    if (!d.workPackage.trim() || !d.siteName.trim()) return;

    const insp: QaQcInspection = {
      id: `insp-${Date.now()}`,
      refNo: `IR-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      projectId: this.selectedProjectId(),
      siteName: d.siteName.trim(),
      wbsTask: d.wbsTask || '—',
      workPackage: d.workPackage.trim(),
      description: d.description.trim() || '—',
      status: d.siteTeamAssignee ? 'task-assigned' : 'draft',
      siteTeamAssignee: d.siteTeamAssignee,
      qaEngineer: null,
      requestedAt: null,
      inspectedAt: null,
      approvedAt: null,
      reworkCount: 0,
      correctiveActionNote: null,
      history: [
        {
          id: `log-${Date.now()}`,
          at: new Date().toISOString(),
          by: 'Current user',
          action: d.siteTeamAssignee ? 'Task assigned to site team' : 'Inspection created (draft)'
        }
      ]
    };

    this.inspections.update((list) => [insp, ...list]);
    this.selectedId.set(insp.id);
    this.createDialogVisible.set(false);
  }

  runAction(actionId: string): void {
    const insp = this.selectedInspection();
    if (!insp) return;

    if (actionId === 'assign-task') {
      this.pendingActionId.set(actionId);
      this.assignTeamPick.set(insp.siteTeamAssignee);
      this.assignTeamDialogVisible.set(true);
      return;
    }

    if (actionId === 'start-inspection' || actionId === 'start-reinspection') {
      if (!insp.qaEngineer) {
        this.pendingActionId.set(actionId);
        this.assignQaEngineer.set(null);
        this.assignQaDialogVisible.set(true);
        return;
      }
    }

    if (actionId === 'fail' || actionId === 'reject' || actionId === 'corrective-done') {
      this.pendingActionId.set(actionId);
      this.actionNote.set(insp.correctiveActionNote ?? '');
      this.actionDialogVisible.set(true);
      return;
    }

    this.applyAction(insp.id, actionId);
  }

  confirmActionNote(): void {
    const actionId = this.pendingActionId();
    const insp = this.selectedInspection();
    if (!actionId || !insp) return;
    this.applyAction(insp.id, actionId, this.actionNote().trim() || undefined);
    this.actionDialogVisible.set(false);
    this.pendingActionId.set(null);
  }

  confirmAssignTeam(): void {
    const team = this.assignTeamPick();
    const insp = this.selectedInspection();
    if (!team || !insp) return;

    this.updateInspection(
      insp.id,
      { siteTeamAssignee: team, status: 'task-assigned' },
      `Task assigned to site team — ${team}`
    );
    this.assignTeamDialogVisible.set(false);
    this.pendingActionId.set(null);
  }

  confirmAssignQa(): void {
    const engineer = this.assignQaEngineer();
    const actionId = this.pendingActionId();
    const insp = this.selectedInspection();
    if (!engineer || !actionId || !insp) return;

    const newStatus = nextStatus(insp.status, actionId);
    if (!newStatus) return;

    const now = new Date().toISOString();
    this.updateInspection(
      insp.id,
      {
        qaEngineer: engineer,
        status: newStatus,
        inspectedAt: now
      },
      `QA/QC assigned (${engineer}); ${actionLabel(actionId)}`
    );
    this.assignQaDialogVisible.set(false);
    this.pendingActionId.set(null);
  }

  private applyAction(id: string, actionId: string, note?: string): void {
    const insp = this.inspections().find((i) => i.id === id);
    if (!insp) return;

    const newStatus = nextStatus(insp.status, actionId);
    if (!newStatus) return;

    const now = new Date().toISOString();
    const patch: Partial<QaQcInspection> = { status: newStatus };
    const by = 'Current user';

    if (actionId === 'request-inspection') patch.requestedAt = now;
    if (actionId === 'start-inspection' || actionId === 'start-reinspection') patch.inspectedAt = now;
    if (actionId === 'pass') patch.approvedAt = now;
    if (actionId === 'fail' || actionId === 'reject') {
      patch.reworkCount = insp.reworkCount + 1;
    }
    if (actionId === 'corrective-done' && note) {
      patch.correctiveActionNote = note;
    }

    this.updateInspection(id, patch, actionLabel(actionId), note);
  }

  private updateInspection(
    id: string,
    patch: Partial<QaQcInspection>,
    action: string,
    note?: string
  ): void {
    const entry = {
      id: `log-${Date.now()}`,
      at: new Date().toISOString(),
      by: 'Current user',
      action,
      note
    };

    this.inspections.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch, history: [...i.history, entry] } : i))
    );
  }
}
