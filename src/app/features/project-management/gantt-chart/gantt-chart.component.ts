import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import Gantt from 'frappe-gantt';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { SelectButton } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import {
  CONSTRUCTION_GANTT_TASKS,
  GANTT_VIEW_MODES,
  GanttViewMode
} from './gantt-chart.data';
import { ThemeService } from '../../../core/services/theme.service';

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
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    SelectButton,
    Tag,
    Tooltip
  ],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss'
})
export class GanttChartComponent implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);

  @ViewChild('ganttContainer', { static: true }) ganttContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('ganttFullscreenHost', { static: true }) ganttFullscreenHost!: ElementRef<HTMLDivElement>;

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
  readonly panReady = signal(false);
  readonly isResizing = signal(false);
  readonly panelHeight = signal(520);

  private static readonly MIN_PANEL_HEIGHT = 360;
  private static readonly MAX_PANEL_HEIGHT = 1200;

  private gantt?: Gantt;
  private panCleanup?: () => void;
  private resizeCleanup?: () => void;
  private fullscreenResizeListener?: () => void;
  private resizeRaf = 0;

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

    effect(() => {
      this.themeService.theme();
      if (this.gantt) {
        this.renderGantt();
      }
    });
  }

  ngOnDestroy(): void {
    this.teardownChartPan();
    this.teardownResize();
    this.detachFullscreenResizeListener();
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
    const host = this.ganttFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      await host.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  }

  overlayAppendTarget(): HTMLElement | 'body' {
    if (this.isFullscreen() && this.ganttFullscreenHost?.nativeElement) {
      return this.ganttFullscreenHost.nativeElement;
    }
    return 'body';
  }

  startResize(event: MouseEvent): void {
    if (this.isFullscreen() || typeof window === 'undefined') return;

    event.preventDefault();
    event.stopPropagation();
    this.teardownResize();

    const host = this.ganttFullscreenHost.nativeElement;
    const startY = event.clientY;
    const startHeight = host.offsetHeight;

    this.isResizing.set(true);
    document.body.classList.add('gantt-page--resizing');

    const onMove = (moveEvent: MouseEvent): void => {
      const maxHeight = Math.min(
        GanttChartComponent.MAX_PANEL_HEIGHT,
        window.innerHeight - 120
      );

      this.panelHeight.set(
        clamp(startHeight + (moveEvent.clientY - startY), GanttChartComponent.MIN_PANEL_HEIGHT, maxHeight)
      );

      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.applyChartDimensions(false));
    };

    const onUp = (): void => {
      this.teardownResize();
      this.applyChartDimensions(true);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this.resizeCleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }

  private teardownResize(): void {
    cancelAnimationFrame(this.resizeRaf);
    this.resizeCleanup?.();
    this.resizeCleanup = undefined;
    this.isResizing.set(false);
    document.body.classList.remove('gantt-page--resizing');
  }

  private renderGantt(scrollTo: 'today' | 'start' = 'today'): void {
    const el = this.ganttContainer.nativeElement;
    el.innerHTML = '';

    this.gantt = new Gantt(el, this.tasks(), {
      view_mode: this.selectedView(),
      bar_height: 28,
      padding: 18,
      container_height: this.getChartContainerHeight(),
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

    queueMicrotask(() => this.setupChartPan());
  }

  private setupChartPan(): void {
    this.teardownChartPan();

    const scrollEl = this.ganttContainer.nativeElement.querySelector(
      '.gantt-container'
    ) as HTMLElement | null;

    if (!scrollEl) {
      this.panReady.set(false);
      return;
    }

    let panning = false;
    let startX = 0;
    let startY = 0;
    let originScrollLeft = 0;
    let originScrollTop = 0;

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(
        '.bar-wrapper, .handle, .bar, .popup-wrapper, .gantt-page__resize-handle, button, a, input, select, textarea, label'
      );
    };

    const onMouseDown = (event: MouseEvent): void => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;

      panning = true;
      scrollEl.classList.add('gantt-page__chart--panning');
      startX = event.clientX;
      startY = event.clientY;
      originScrollLeft = scrollEl.scrollLeft;
      originScrollTop = scrollEl.scrollTop;
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent): void => {
      if (!panning) return;
      scrollEl.scrollLeft = originScrollLeft - (event.clientX - startX);
      scrollEl.scrollTop = originScrollTop - (event.clientY - startY);
    };

    const endPan = (): void => {
      if (!panning) return;
      panning = false;
      scrollEl.classList.remove('gantt-page__chart--panning');
    };

    scrollEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endPan);
    scrollEl.addEventListener('mouseleave', endPan);

    this.panReady.set(true);
    this.panCleanup = () => {
      scrollEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endPan);
      scrollEl.removeEventListener('mouseleave', endPan);
      scrollEl.classList.remove('gantt-page__chart--panning');
    };
  }

  private teardownChartPan(): void {
    this.panCleanup?.();
    this.panCleanup = undefined;
    this.panReady.set(false);
  }

  private initGantt(): void {
    this.renderGantt();
  }

  /** Frappe sets container height from row count; use panel / viewport height when set. */
  private getChartContainerHeight(): number | 'auto' {
    const host = this.ganttFullscreenHost?.nativeElement;
    if (!host) return 'auto';

    const toolbar = host.querySelector('.gantt-page__chart-toolbar') as HTMLElement | null;
    const toolbarHeight = toolbar?.offsetHeight ?? 0;
    const available = host.clientHeight - toolbarHeight;

    if (this.isFullscreen()) {
      return Math.max(available, GanttChartComponent.MIN_PANEL_HEIGHT);
    }

    return Math.max(available, 280);
  }

  private applyChartDimensions(rerender = true): void {
    if (!this.gantt || this.isFullscreen()) return;

    const height = this.getChartContainerHeight();
    if (typeof height !== 'number') return;

    const scrollEl = this.ganttContainer.nativeElement.querySelector(
      '.gantt-container'
    ) as HTMLElement | null;

    if (scrollEl) {
      scrollEl.style.setProperty('height', `${height}px`, 'important');
      scrollEl.style.setProperty('min-height', `${height}px`, 'important');
    }

    if (rerender) {
      const scrollLeft = scrollEl?.scrollLeft ?? 0;
      const scrollTop = scrollEl?.scrollTop ?? 0;
      this.renderGantt('start');
      queueMicrotask(() => {
        const nextScrollEl = this.ganttContainer.nativeElement.querySelector(
          '.gantt-container'
        ) as HTMLElement | null;
        if (!nextScrollEl) return;
        nextScrollEl.scrollLeft = scrollLeft;
        nextScrollEl.scrollTop = scrollTop;
      });
    }
  }

  private syncChartViewport(): void {
    if (!this.gantt) return;

    const scrollEl = this.ganttContainer.nativeElement.querySelector(
      '.gantt-container'
    ) as HTMLElement | null;
    const scrollLeft = scrollEl?.scrollLeft ?? 0;
    const scrollTop = scrollEl?.scrollTop ?? 0;

    this.renderGantt('start');

    queueMicrotask(() => {
      const nextScrollEl = this.ganttContainer.nativeElement.querySelector(
        '.gantt-container'
      ) as HTMLElement | null;
      if (!nextScrollEl) return;
      nextScrollEl.scrollLeft = scrollLeft;
      nextScrollEl.scrollTop = scrollTop;
    });
  }

  private attachFullscreenResizeListener(): void {
    if (typeof window === 'undefined' || this.fullscreenResizeListener) return;
    this.fullscreenResizeListener = () => this.syncChartViewport();
    window.addEventListener('resize', this.fullscreenResizeListener, { passive: true });
  }

  private detachFullscreenResizeListener(): void {
    if (typeof window === 'undefined' || !this.fullscreenResizeListener) return;
    window.removeEventListener('resize', this.fullscreenResizeListener);
    this.fullscreenResizeListener = undefined;
  }

  private readonly onFullscreenChange = (): void => {
    if (typeof document === 'undefined') return;
    const host = this.ganttFullscreenHost?.nativeElement;
    const active = !!host && document.fullscreenElement === host;
    const wasFullscreen = this.isFullscreen();

    if (wasFullscreen === active) return;

    this.isFullscreen.set(active);

    if (active) {
      this.attachFullscreenResizeListener();
    } else {
      this.detachFullscreenResizeListener();
    }

    if (!this.gantt) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.syncChartViewport());
    });
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
