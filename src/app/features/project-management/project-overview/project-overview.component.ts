import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import {
  DEMO_OVERVIEW_PROJECTS,
  DiagramConnector,
  ProjectOverviewDemo,
  StakeholderEntity,
  StakeholderGroup,
  StakeholderKind,
  buildBentConnectorPath,
  buildOverviewDiagramPayload,
  getStakeholderGroupsForProject,
  layoutStakeholderGroups
} from './project-overview.data';
import { rectBorderToward, rectRelativeToHost } from './project-overview.geometry';
import { generateStakeholderGroupsForProject } from './project-overview.stakeholders';
import {
  EntityContext,
  OverviewContextTarget,
  buildContextMenuItems
} from './project-overview.actions';

type ConnectorStyle = 'curved' | 'orthogonal';

@Component({
  selector: 'app-project-overview',
  imports: [
    FormsModule,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    InputText,
    Menu,
    Select,
    Tag,
    Toast,
    Tooltip
  ],
  providers: [MessageService],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.scss'
})
export class ProjectOverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diagramHost', { static: true }) diagramHost!: ElementRef<HTMLElement>;
  @ViewChild('centerNode') centerNode!: ElementRef<HTMLElement>;
  @ViewChild('contextMenu') contextMenu!: Menu;
  @ViewChildren('groupNode') groupNodes!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('childrenWrap') childrenWraps!: QueryList<ElementRef<HTMLElement>>;

  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly breadcrumbs = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Project Management', routerLink: '/projects' },
    { label: 'Project Overview' }
  ];

  readonly projects = DEMO_OVERVIEW_PROJECTS;
  readonly projectStatuses: ProjectOverviewDemo['status'][] = ['Active', 'Planned', 'Completed', 'On Hold'];
  readonly selectedProjectId = signal(DEMO_OVERVIEW_PROJECTS[0]?.id ?? '');
  readonly projectOverrides = signal<Record<string, Partial<ProjectOverviewDemo>>>({});
  readonly stakeholderGroups = signal<StakeholderGroup[]>([]);

  readonly contextTarget = signal<OverviewContextTarget | null>(null);
  readonly contextMenuItems = signal<MenuItem[]>([]);

  readonly editDialogVisible = signal(false);
  readonly editDialogTitle = signal('Edit');
  readonly editMode = signal<'project' | 'entity'>('entity');
  readonly entityDraft = signal({ label: '', detail: '' });
  readonly projectDraft = signal({
    name: '',
    client: '',
    location: '',
    contractRef: '',
    status: 'Active' as ProjectOverviewDemo['status']
  });

  readonly selectedProject = computed(() => {
    const base = this.projects.find((p) => p.id === this.selectedProjectId()) ?? this.projects[0];
    const patch = this.projectOverrides()[base.id] ?? {};
    return { ...base, ...patch };
  });

  readonly groups = computed(() => this.stakeholderGroups());

  readonly omittedGroupsLabel = computed(() => {
    const present = new Set(this.groups().map((g) => g.id));
    const labels: Record<string, string> = {
      finance: 'Finance & insurance',
      consultants: 'Consultants',
      authorities: 'Authorities',
      'site-support': 'Site support',
      commercial: 'Commercial',
      hseq: 'HSEQ',
      client: 'Client',
      contractors: 'Contractors',
      leadership: 'Project team'
    };
    const omitted = ['finance', 'consultants', 'authorities', 'site-support', 'commercial', 'hseq', 'client']
      .filter((id) => !present.has(id))
      .map((id) => labels[id] ?? id);
    return omitted.length ? omitted.join(', ') : 'None — full stakeholder set';
  });

  readonly connectorStyle = signal<ConnectorStyle>('curved');

  readonly layoutGroups = computed(() => layoutStakeholderGroups(this.groups()));

  readonly connectorPaths = signal<DiagramConnector[]>([]);
  readonly svgSize = signal({ w: 800, h: 600 });

  readonly svgViewBox = computed(() => `0 0 ${this.svgSize().w} ${this.svgSize().h}`);

  private resizeObserver?: ResizeObserver;
  private measureQueued = false;

  constructor() {
    effect(() => {
      const id = this.selectedProjectId();
      this.stakeholderGroups.set(structuredClone(getStakeholderGroupsForProject(id)));
      this.scheduleMeasure();
    });

    effect(() => {
      this.stakeholderGroups();
      this.connectorStyle();
      this.layoutGroups();
      this.scheduleMeasure();
    });
  }

  openProjectMenu(event: Event): void {
    event.stopPropagation();
    this.contextTarget.set({ scope: 'project' });
    this.contextMenuItems.set(
      buildContextMenuItems({ scope: 'project' }, {
        onEdit: () => this.openProjectEdit(),
        onView: () => this.viewProjectDetails(),
        onRegenerate: () => this.regenerateStakeholders(),
        onOpenSites: () => this.openSitesChart()
      })
    );
    this.contextMenu.show(event);
  }

  openEntityMenu(event: Event, groupId: string, entity: StakeholderEntity, parentEntityId?: string): void {
    event.stopPropagation();
    const ctx: EntityContext = { scope: 'entity', groupId, entity, parentEntityId };
    this.contextTarget.set(ctx);
    this.contextMenuItems.set(
      buildContextMenuItems(ctx, {
        onEdit: () => this.openEntityEdit(),
        onView: () => this.viewEntityDetails(),
        onDuplicate: () => this.duplicateEntity(),
        onRemove: () => this.removeEntity(),
        onAddSub: () => this.addSubContractor(),
        onAssign: () => this.toastAction('Contact assigned (demo)'),
        onDocuments: () => this.toastAction('Documents folder opened (demo)')
      })
    );
    this.contextMenu.show(event);
  }

  private openProjectEdit(): void {
    const p = this.selectedProject();
    this.projectDraft.set({
      name: p.name,
      client: p.client,
      location: p.location,
      contractRef: p.contractRef,
      status: p.status
    });
    this.editMode.set('project');
    this.editDialogTitle.set('Edit project');
    this.editDialogVisible.set(true);
  }

  private openEntityEdit(): void {
    const ctx = this.contextTarget();
    if (ctx?.scope !== 'entity') return;
    this.entityDraft.set({ label: ctx.entity.label, detail: ctx.entity.detail ?? '' });
    this.editMode.set('entity');
    this.editDialogTitle.set(`Edit — ${ctx.entity.label}`);
    this.editDialogVisible.set(true);
  }

  saveEdit(): void {
    if (this.editMode() === 'project') {
      const id = this.selectedProjectId();
      const draft = this.projectDraft();
      this.projectOverrides.update((m) => ({ ...m, [id]: { ...m[id], ...draft } }));
      this.toastAction('Project updated');
    } else {
      const ctx = this.contextTarget();
      if (ctx?.scope !== 'entity') return;
      const draft = this.entityDraft();
      this.stakeholderGroups.update((groups) =>
        this.mapGroups(groups, ctx, (e) => ({
          ...e,
          label: draft.label.trim() || e.label,
          detail: draft.detail.trim() || undefined
        }))
      );
      this.toastAction('Stakeholder updated');
    }
    this.editDialogVisible.set(false);
    this.scheduleMeasure();
  }

  private viewProjectDetails(): void {
    const p = this.selectedProject();
    this.messages.add({
      severity: 'info',
      summary: p.name,
      detail: `${p.client} · ${p.status} · ${p.location} · ${p.contractRef}`,
      life: 5000
    });
  }

  private viewEntityDetails(): void {
    const ctx = this.contextTarget();
    if (ctx?.scope !== 'entity') return;
    this.messages.add({
      severity: 'info',
      summary: ctx.entity.label,
      detail: `${this.kindLabel(ctx.entity.kind)}${ctx.entity.detail ? ' — ' + ctx.entity.detail : ''} · ID ${ctx.entity.id}`,
      life: 4000
    });
  }

  private regenerateStakeholders(): void {
    this.stakeholderGroups.set(
      structuredClone(generateStakeholderGroupsForProject(this.selectedProject()))
    );
    this.toastAction('Stakeholders regenerated from sample rules');
    this.scheduleMeasure();
  }

  private openSitesChart(): void {
    void this.router.navigate(['/projects/projects-sites-org-chart']);
  }

  private duplicateEntity(): void {
    const ctx = this.contextTarget();
    if (ctx?.scope !== 'entity' || ctx.parentEntityId) return;
    const copy: StakeholderEntity = {
      ...structuredClone(ctx.entity),
      id: `${ctx.entity.id}-copy-${Date.now()}`,
      label: `${ctx.entity.label} (copy)`
    };
    this.stakeholderGroups.update((groups) =>
      groups.map((g) =>
        g.id === ctx.groupId ? { ...g, entities: [...g.entities, copy] } : g
      )
    );
    this.toastAction('Entity duplicated');
    this.scheduleMeasure();
  }

  private removeEntity(): void {
    const ctx = this.contextTarget();
    if (ctx?.scope !== 'entity') return;
    this.stakeholderGroups.update((groups) =>
      groups
        .map((g) => {
          if (g.id !== ctx.groupId) return g;
          if (ctx.parentEntityId) {
            return {
              ...g,
              entities: g.entities.map((e) =>
                e.id === ctx.parentEntityId
                  ? {
                      ...e,
                      children: e.children?.filter((c) => c.id !== ctx.entity.id)
                    }
                  : e
              )
            };
          }
          return { ...g, entities: g.entities.filter((e) => e.id !== ctx.entity.id) };
        })
        .filter((g) => g.entities.length > 0)
    );
    this.toastAction('Removed from chart');
    this.scheduleMeasure();
  }

  private addSubContractor(): void {
    const ctx = this.contextTarget();
    if (ctx?.scope !== 'entity' || ctx.entity.kind !== 'contractor') return;
    const sub: StakeholderEntity = {
      id: `sub-${Date.now()}`,
      label: 'New sub-contractor',
      kind: 'subcontractor',
      icon: 'pi pi-wrench'
    };
    this.stakeholderGroups.update((groups) =>
      groups.map((g) =>
        g.id === ctx.groupId
          ? {
              ...g,
              entities: g.entities.map((e) =>
                e.id === ctx.entity.id
                  ? { ...e, children: [...(e.children ?? []), sub] }
                  : e
              )
            }
          : g
      )
    );
    this.toastAction('Sub-contractor added — use menu to edit');
    this.scheduleMeasure();
  }

  private mapGroups(
    groups: StakeholderGroup[],
    ctx: EntityContext,
    mapEntity: (e: StakeholderEntity) => StakeholderEntity
  ): StakeholderGroup[] {
    return groups.map((g) => {
      if (g.id !== ctx.groupId) return g;
      if (ctx.parentEntityId) {
        return {
          ...g,
          entities: g.entities.map((e) =>
            e.id === ctx.parentEntityId
              ? {
                  ...e,
                  children: e.children?.map((c) => (c.id === ctx.entity.id ? mapEntity(c) : c))
                }
              : e
          )
        };
      }
      return {
        ...g,
        entities: g.entities.map((e) => (e.id === ctx.entity.id ? mapEntity(e) : e))
      };
    });
  }

  private toastAction(detail: string): void {
    this.messages.add({ severity: 'success', summary: 'Project Overview', detail, life: 2800 });
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
    this.resizeObserver.observe(this.diagramHost.nativeElement);
    this.groupNodes.changes.subscribe(() => this.scheduleMeasure());
    this.childrenWraps.changes.subscribe(() => this.scheduleMeasure());
    this.scheduleMeasure();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  scheduleMeasure(): void {
    if (this.measureQueued) return;
    this.measureQueued = true;
    requestAnimationFrame(() => {
      this.updateConnectors();
      requestAnimationFrame(() => {
        this.measureQueued = false;
        this.updateConnectors();
      });
    });
  }

  private updateConnectors(): void {
    const host = this.diagramHost?.nativeElement;
    const centerEl = this.centerNode?.nativeElement;
    if (!host || !centerEl) return;

    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 1 || h < 1) return;

    this.svgSize.set({ w, h });

    const center = rectRelativeToHost(centerEl, host);
    const style = this.connectorStyle();
    const connectors: DiagramConnector[] = [];

    for (const ref of this.groupNodes ?? []) {
      const groupEl = ref.nativeElement;
      const id = groupEl.dataset['groupId'];
      if (!id) continue;

      const group = rectRelativeToHost(groupEl, host);
      const start = rectBorderToward(center.cx, center.cy, center.width, center.height, group.cx, group.cy);
      const end = rectBorderToward(group.cx, group.cy, group.width, group.height, center.cx, center.cy);

      connectors.push({
        id,
        variant: 'hub',
        path: buildBentConnectorPath(start.x, start.y, end.x, end.y, style)
      });
    }

    for (const wrapRef of this.childrenWraps ?? []) {
      const wrap = wrapRef.nativeElement;
      const parentId = wrap.dataset['parentId'];
      if (!parentId) continue;

      const contractor = wrap.closest('.shape--contractor') as HTMLElement | null;
      if (!contractor) continue;

      const parent = rectRelativeToHost(contractor, host);
      const childEls = wrap.querySelectorAll<HTMLElement>('.shape--child');

      childEls.forEach((childEl, index) => {
        const child = rectRelativeToHost(childEl, host);
        const start = rectBorderToward(
          parent.cx,
          parent.cy,
          parent.width,
          parent.height,
          child.cx,
          child.cy
        );
        const end = rectBorderToward(
          child.cx,
          child.cy,
          child.width,
          child.height,
          parent.cx,
          parent.cy
        );
        connectors.push({
          id: `${parentId}-trade-${index}`,
          variant: 'trade',
          path: buildBentConnectorPath(start.x, start.y, end.x, end.y, style)
        });
      });
    }

    this.connectorPaths.set(connectors);
  }

  readonly entityCount = computed(() => {
    let count = 0;
    const walk = (entities: StakeholderEntity[]) => {
      for (const e of entities) {
        count++;
        if (e.children?.length) walk(e.children);
      }
    };
    for (const g of this.groups()) walk(g.entities);
    return count;
  });

  readonly chartJson = computed(() =>
    JSON.stringify(buildOverviewDiagramPayload(this.selectedProject(), this.groups()), null, 2)
  );

  kindLabel(kind: StakeholderKind): string {
    const labels: Record<StakeholderKind, string> = {
      role: 'Team role',
      contractor: 'Contractor',
      subcontractor: 'Sub-contractor',
      consultant: 'Consultant',
      client: 'Client',
      supplier: 'Supplier',
      authority: 'Authority',
      vendor: 'Vendor',
      labor: 'Labor',
      finance: 'Finance'
    };
    return labels[kind];
  }
}
