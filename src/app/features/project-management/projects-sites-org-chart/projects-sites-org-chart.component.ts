import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { PrimeTemplate, TreeNode } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tooltip } from 'primeng/tooltip';
import { OrganizationChart } from 'primeng/organizationchart';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import {
  DEMO_PROJECTS,
  MILESTONE_STATUS_OPTIONS,
  MilestoneStatus,
  ProjectSummary,
  buildProjectsSitesOrgChart,
  serializeOrgChartNodes
} from './projects-sites-org-chart.data';

type ScopeMode = 'all' | 'single';

@Component({
  selector: 'app-projects-sites-org-chart',
  imports: [
    NgClass,
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    OrganizationChart,
    Select,
    Tag,
    Tooltip
  ],
  templateUrl: './projects-sites-org-chart.component.html',
  styleUrl: './projects-sites-org-chart.component.scss'
})
export class ProjectsSitesOrgChartComponent implements OnDestroy {
  @ViewChild('chartFullscreenHost', { static: true })
  chartFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly isFullscreen = signal(false);
  readonly breadcrumbs = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Project Management', routerLink: '/projects' },
    { label: 'Projects → Sites Chart' }
  ];

  readonly milestoneStatusOptions = MILESTONE_STATUS_OPTIONS;

  readonly scope = signal<ScopeMode>('all');
  readonly projects = signal<ProjectSummary[]>(structuredClone(DEMO_PROJECTS));
  readonly selectedProjectId = signal<string>(DEMO_PROJECTS[0]?.id ?? '');

  readonly visibleProjects = computed(() => {
    const all = this.projects();
    if (this.scope() === 'all') return all;
    const id = this.selectedProjectId();
    const found = all.find((p) => p.id === id);
    return found ? [found] : all;
  });

  readonly nodes = computed<TreeNode[]>(() => buildProjectsSitesOrgChart(this.visibleProjects()));

  readonly chartJson = computed(() =>
    JSON.stringify(
      {
        component: 'p-organizationChart',
        builder: 'buildProjectsSitesOrgChart(visibleProjects)',
        scope: this.scope(),
        selectedProjectId: this.scope() === 'single' ? this.selectedProjectId() : null,
        sourceProjects: this.visibleProjects(),
        value: serializeOrgChartNodes(this.nodes())
      },
      null,
      2
    )
  );

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
      this.onFullscreenChange();
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    }
  }

  async toggleFullscreen(): Promise<void> {
    const host = this.chartFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      await host.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  }

  /** Prime overlays must mount inside the fullscreen element, not `body`. */
  overlayAppendTarget(): HTMLElement | 'body' {
    if (this.isFullscreen() && this.chartFullscreenHost?.nativeElement) {
      return this.chartFullscreenHost.nativeElement;
    }
    return 'body';
  }

  readonly kpi = computed(() => {
    const projects = this.visibleProjects();
    let sites = 0;
    let milestones = 0;
    let progressSum = 0;

    for (const p of projects) {
      for (const s of p.sites) {
        sites++;
        milestones += s.milestones.length;
        progressSum += s.progressPct;
      }
    }

    return {
      projects: projects.length,
      sites,
      milestones,
      avgProgress: sites === 0 ? 0 : Math.round(progressSum / sites)
    };
  });

  updateMilestoneStatus(
    projectId: string,
    siteId: string,
    milestoneId: string,
    status: MilestoneStatus
  ): void {
    this.projects.update((projects) =>
      projects.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          sites: project.sites.map((site) => {
            if (site.id !== siteId) return site;
            return {
              ...site,
              milestones: site.milestones.map((m) =>
                m.id === milestoneId ? { ...m, status } : m
              )
            };
          })
        };
      })
    );
  }

  milestoneStatusClass(status: MilestoneStatus): string {
    switch (status) {
      case 'Completed':
        return 'milestone-status milestone-status--completed';
      case 'In Progress':
        return 'milestone-status milestone-status--in-progress';
      case 'At Risk':
        return 'milestone-status milestone-status--at-risk';
      case 'Delayed':
        return 'milestone-status milestone-status--delayed';
      default:
        return 'milestone-status milestone-status--not-started';
    }
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  private readonly onFullscreenChange = (): void => {
    if (typeof document === 'undefined') return;
    const host = this.chartFullscreenHost?.nativeElement;
    this.isFullscreen.set(!!host && document.fullscreenElement === host);
  };
}
