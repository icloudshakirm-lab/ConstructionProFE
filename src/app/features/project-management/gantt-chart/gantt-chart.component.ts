import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  signal
} from '@angular/core';
import Gantt from 'frappe-gantt';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import {
  CONSTRUCTION_GANTT_TASKS,
  GANTT_VIEW_MODES,
  GanttViewMode
} from './gantt-chart.data';

type ActivityStatus = 'done' | 'active' | 'planned' | 'milestone';

interface ActivityDraft {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  status: ActivityStatus;
}

@Component({
  selector: 'app-gantt-chart',
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    DialogModule,
    SelectButtonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss'
})
export class GanttChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ganttContainer', { static: true }) ganttContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fullscreenHost', { static: true }) fullscreenHost!: ElementRef<HTMLDivElement>;

  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Project Management', routerLink: '/projects' },
    { label: 'Gantt Chart' }
  ];

  readonly viewModes = GANTT_VIEW_MODES;
  readonly selectedView = signal<GanttViewMode>('Week');
  readonly projectLabel = 'Tower Block A — Main Contract';

  readonly tasks = signal<Gantt.Task[]>([...CONSTRUCTION_GANTT_TASKS]);

  readonly chartJson = computed(() =>
    JSON.stringify(
      {
        library: 'frappe-gantt',
        component: 'Gantt',
        container: '#ganttContainer',
        viewMode: this.selectedView(),
        project: this.projectLabel,
        tasks: this.tasks()
      },
      null,
      2
    )
  );

  readonly activityDialogVisible = signal(false);
  readonly activityDraft = signal<ActivityDraft>(this.newDraft());
  readonly editingExisting = signal(false);

  readonly isFullscreen = signal(false);

  private gantt?: Gantt;

  ngAfterViewInit(): void {
    this.initGantt();

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
      this.onFullscreenChange();
    }

    effect(() => {
      const tasks = this.tasks();
      if (this.gantt) {
        this.gantt.refresh(tasks);
      }
    });
  }

  ngOnDestroy(): void {
    this.gantt?.clear();
    this.gantt = undefined;

    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    }
  }

  onViewChange(mode: GanttViewMode): void {
    this.selectedView.set(mode);
    this.gantt?.change_view_mode(mode);
  }

  scrollToToday(): void {
    this.gantt?.clear();
    this.renderGantt('today');
  }

  openAddActivity(): void {
    this.editingExisting.set(false);
    this.activityDraft.set(this.newDraft());
    this.activityDialogVisible.set(true);
  }

  closeActivityDialog(): void {
    this.activityDialogVisible.set(false);
  }

  openEditActivity(task: Gantt.Task): void {
    this.editingExisting.set(true);
    this.activityDraft.set(this.taskToDraft(task));
    this.activityDialogVisible.set(true);
  }

  saveActivity(): void {
    const draft = this.activityDraft();
    const normalized = this.draftToTask(draft);

    this.tasks.update((existing) => {
      const idx = existing.findIndex((t) => t.id === normalized.id);
      if (idx === -1) {
        return [...existing, normalized];
      }
      const copy = [...existing];
      copy[idx] = normalized;
      return copy;
    });

    this.activityDialogVisible.set(false);
  }

  deleteActivity(): void {
    const id = this.activityDraft().id;
    if (!id) return;

    this.tasks.update((existing) => existing.filter((t) => t.id !== id));
    this.activityDialogVisible.set(false);
  }

  async toggleFullscreen(): Promise<void> {
    const host = this.fullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      await host.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  }

  private renderGantt(scrollTo: 'today' | 'start' = 'today'): void {
    const el = this.ganttContainer.nativeElement;
    el.innerHTML = '';

    this.gantt = new Gantt(el, this.tasks(), {
      view_mode: this.selectedView(),
      bar_height: 28,
      padding: 18,
      date_format: 'YYYY-MM-DD',
      scroll_to: scrollTo,
      today_button: true,
      popup: (task: Gantt.Task) => `
        <div class="gantt-popup">
          <strong>${task.name}</strong>
          <p>Progress: ${task.progress}%</p>
        </div>
      `,
      on_click: (task: Gantt.Task) => this.openEditActivity(task)
    });
  }

  private initGantt(): void {
    this.renderGantt();
  }

  private readonly onFullscreenChange = (): void => {
    if (typeof document === 'undefined') return;
    this.isFullscreen.set(!!document.fullscreenElement);
  };

  private newDraft(): ActivityDraft {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `act-${crypto.randomUUID().slice(0, 8)}`
        : `act-${Date.now()}`;
    const today = new Date();
    const start = toISODate(today);
    const end = toISODate(addDays(today, 7));

    return {
      id,
      name: '',
      start,
      end,
      progress: 0,
      dependencies: '',
      status: 'planned'
    };
  }

  private taskToDraft(task: Gantt.Task): ActivityDraft {
    const status = classToStatus(task.custom_class);
    return {
      id: task.id ?? '',
      name: task.name,
      start: task.start,
      end: task.end ?? task.start,
      progress: task.progress,
      dependencies: Array.isArray(task.dependencies)
        ? task.dependencies.join(',')
        : (task.dependencies ?? ''),
      status
    };
  }

  private draftToTask(draft: ActivityDraft): Gantt.Task {
    return {
      id: draft.id.trim(),
      name: draft.name.trim() || 'New activity',
      start: draft.start,
      end: draft.end,
      progress: clamp(draft.progress, 0, 100),
      dependencies: normalizeDeps(draft.dependencies),
      custom_class: statusToClass(draft.status)
    };
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeDeps(raw: string): string | undefined {
  const deps = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return deps.length ? deps.join(',') : undefined;
}

function statusToClass(status: ActivityStatus): string {
  switch (status) {
    case 'done':
      return 'bar-done';
    case 'active':
      return 'bar-active';
    case 'milestone':
      return 'bar-milestone';
    default:
      return 'bar-planned';
  }
}

function classToStatus(cls?: string): ActivityStatus {
  switch (cls) {
    case 'bar-done':
      return 'done';
    case 'bar-active':
      return 'active';
    case 'bar-milestone':
      return 'milestone';
    default:
      return 'planned';
  }
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
