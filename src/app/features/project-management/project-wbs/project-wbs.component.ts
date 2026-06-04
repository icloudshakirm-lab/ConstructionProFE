import { Component, computed, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { OrganizationChart } from 'primeng/organizationchart';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { buildWbsHierarchyChart } from './project-wbs-hierarchy';
import {
  ProjectWbs,
  RESPONSIBLE_PERSON_OPTIONS,
  WBS_PRIORITY_OPTIONS,
  WBS_PROJECT_OPTIONS,
  WbsPriority,
  buildInitialWbsStore,
  responsibleLabel
} from './project-wbs.data';
import {
  formatDisplayDate,
  priorityBarClass,
  priorityTagSeverity
} from './project-wbs-priority';

export type WbsViewMode = 'hierarchy' | 'editor';
export type WbsHierarchyOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'app-project-wbs',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    InputText,
    OrganizationChart,
    Select,
    Tag
  ],
  templateUrl: './project-wbs.component.html',
  styleUrl: './project-wbs.component.scss'
})
export class ProjectWbsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);

  readonly projectOptions = WBS_PROJECT_OPTIONS;
  readonly responsibleOptions = [
    { label: '— Unassigned —', value: null as string | null },
    ...RESPONSIBLE_PERSON_OPTIONS.map((p) => ({ label: p.label, value: p.id }))
  ];
  readonly priorityOptions = WBS_PRIORITY_OPTIONS;

  readonly selectedProjectId = signal('P-001');
  readonly viewMode = signal<WbsViewMode>('hierarchy');
  readonly hierarchyOrientation = signal<WbsHierarchyOrientation>('horizontal');
  readonly isChartExpanded = signal(false);
  readonly wbsStore = signal<Record<string, ProjectWbs>>(buildInitialWbsStore());
  readonly expandedSites = signal<Set<string>>(new Set());
  readonly expandedMilestones = signal<Set<string>>(new Set());

  readonly currentWbs = computed(() => {
    const id = this.selectedProjectId();
    return id ? this.wbsStore()[id] : null;
  });

  readonly hierarchyNodes = computed(() => {
    const wbs = this.currentWbs();
    return wbs ? buildWbsHierarchyChart(wbs) : [];
  });

  readonly hierarchySubtitle = computed(() =>
    this.hierarchyOrientation() === 'horizontal'
      ? 'Left to right: project → site → milestone → tasks. Use chevrons to collapse branches.'
      : 'Top to bottom: project → site → milestone → tasks. Use node toggles to collapse branches.'
  );

  readonly stats = computed(() => {
    const wbs = this.currentWbs();
    if (!wbs) {
      return { sites: 0, milestones: 0, tasks: 0, unassigned: 0 };
    }
    let milestones = 0;
    let tasks = 0;
    let unassigned = 0;
    for (const site of wbs.sites) {
      milestones += site.milestones.length;
      for (const ms of site.milestones) {
        tasks += ms.tasks.length;
        unassigned += ms.tasks.filter((t) => !t.responsiblePersonId).length;
      }
    }
    return { sites: wbs.sites.length, milestones, tasks, unassigned };
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Work Breakdown Structure' });
    return items;
  });

  responsibleLabel = responsibleLabel;
  formatDisplayDate = formatDisplayDate;
  priorityBarClass = priorityBarClass;
  priorityTagSeverity = priorityTagSeverity;

  ngOnDestroy(): void {
    this.setChartExpanded(false);
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  setViewMode(mode: WbsViewMode): void {
    if (mode !== 'hierarchy') {
      this.setChartExpanded(false);
    }
    this.viewMode.set(mode);
  }

  setHierarchyOrientation(orientation: WbsHierarchyOrientation): void {
    this.hierarchyOrientation.set(orientation);
  }

  toggleChartExpanded(): void {
    this.setChartExpanded(!this.isChartExpanded());
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isChartExpanded()) {
      this.setChartExpanded(false);
    }
  }

  private setChartExpanded(expanded: boolean): void {
    this.isChartExpanded.set(expanded);
    if (typeof document === 'undefined') return;
    const overflow = expanded ? 'hidden' : '';
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = overflow;
  }

  scrollToEditor(siteId: string, milestoneId: string): void {
    this.viewMode.set('editor');
    this.expandedSites.update((set) => new Set(set).add(siteId));
    this.expandedMilestones.update((set) => new Set(set).add(milestoneId));
    requestAnimationFrame(() => {
      document.getElementById(`wbs-ms-${milestoneId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    if (projectId) {
      const sites = this.wbsStore()[projectId]?.sites ?? [];
      this.expandedSites.set(new Set(sites.map((s) => s.id)));
      const msIds = sites.flatMap((s) => s.milestones.map((m) => m.id));
      this.expandedMilestones.set(new Set(msIds));
    }
  }

  isSiteExpanded(siteId: string): boolean {
    return this.expandedSites().has(siteId);
  }

  isMilestoneExpanded(milestoneId: string): boolean {
    return this.expandedMilestones().has(milestoneId);
  }

  toggleSite(siteId: string): void {
    this.expandedSites.update((set) => {
      const next = new Set(set);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  toggleMilestone(milestoneId: string): void {
    this.expandedMilestones.update((set) => {
      const next = new Set(set);
      if (next.has(milestoneId)) next.delete(milestoneId);
      else next.add(milestoneId);
      return next;
    });
  }

  updateTaskName(siteId: string, milestoneId: string, taskId: string, name: string): void {
    this.patchTask(siteId, milestoneId, taskId, { name });
  }

  updateTaskResponsible(
    siteId: string,
    milestoneId: string,
    taskId: string,
    responsiblePersonId: string | null
  ): void {
    this.patchTask(siteId, milestoneId, taskId, { responsiblePersonId });
  }

  updateTaskPriority(
    siteId: string,
    milestoneId: string,
    taskId: string,
    priority: WbsPriority
  ): void {
    this.patchTask(siteId, milestoneId, taskId, { priority });
  }

  updateTaskDueDate(
    siteId: string,
    milestoneId: string,
    taskId: string,
    dueDate: string
  ): void {
    this.patchTask(siteId, milestoneId, taskId, { dueDate });
  }

  updateMilestoneTargetDate(siteId: string, milestoneId: string, targetDate: string): void {
    this.patchMilestone(siteId, milestoneId, { targetDate });
  }

  updateMilestonePriority(siteId: string, milestoneId: string, priority: WbsPriority): void {
    this.patchMilestone(siteId, milestoneId, { priority });
  }

  addTask(siteId: string, milestoneId: string): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    this.wbsStore.update((store) => {
      const wbs = store[projectId];
      if (!wbs) return store;

      const taskId = `T-${Date.now()}`;
      const sites = wbs.sites.map((site) => {
        if (site.id !== siteId) return site;
        return {
          ...site,
          milestones: site.milestones.map((ms) => {
            if (ms.id !== milestoneId) return ms;
            return {
              ...ms,
              tasks: [
                ...ms.tasks,
                {
                  id: taskId,
                  name: 'New task',
                  responsiblePersonId: null,
                  priority: 'medium' as WbsPriority,
                  dueDate: ms.targetDate ?? new Date().toISOString().slice(0, 10)
                }
              ]
            };
          })
        };
      });

      return { ...store, [projectId]: { ...wbs, sites } };
    });
  }

  removeTask(siteId: string, milestoneId: string, taskId: string): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    this.wbsStore.update((store) => {
      const wbs = store[projectId];
      if (!wbs) return store;

      const sites = wbs.sites.map((site) => {
        if (site.id !== siteId) return site;
        return {
          ...site,
          milestones: site.milestones.map((ms) => {
            if (ms.id !== milestoneId) return ms;
            return {
              ...ms,
              tasks: ms.tasks.filter((t) => t.id !== taskId)
            };
          })
        };
      });

      return { ...store, [projectId]: { ...wbs, sites } };
    });
  }

  private patchTask(
    siteId: string,
    milestoneId: string,
    taskId: string,
    patch: Partial<{
      name: string;
      responsiblePersonId: string | null;
      priority: WbsPriority;
      dueDate: string;
    }>
  ): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    this.wbsStore.update((store) => {
      const wbs = store[projectId];
      if (!wbs) return store;

      const sites = wbs.sites.map((site) => {
        if (site.id !== siteId) return site;
        return {
          ...site,
          milestones: site.milestones.map((ms) => {
            if (ms.id !== milestoneId) return ms;
            return {
              ...ms,
              tasks: ms.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
            };
          })
        };
      });

      return { ...store, [projectId]: { ...wbs, sites } };
    });
  }

  private patchMilestone(
    siteId: string,
    milestoneId: string,
    patch: Partial<{ targetDate: string; priority: WbsPriority }>
  ): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    this.wbsStore.update((store) => {
      const wbs = store[projectId];
      if (!wbs) return store;

      const sites = wbs.sites.map((site) => {
        if (site.id !== siteId) return site;
        return {
          ...site,
          milestones: site.milestones.map((ms) =>
            ms.id === milestoneId ? { ...ms, ...patch } : ms
          )
        };
      });

      return { ...store, [projectId]: { ...wbs, sites } };
    });
  }
}
