import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CadViewerService } from './cad-viewer.service';
import { DEMO_DRAWINGS, DrawingRecord } from './drawings.data';

@Component({
  selector: 'app-drawing-viewer',
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './drawing-viewer.component.html',
  styleUrl: './drawing-viewer.component.scss'
})
export class DrawingViewerComponent implements AfterViewInit, OnDestroy {
  private readonly cadViewer = inject(CadViewerService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('cadHost', { static: true }) cadHost!: ElementRef<HTMLDivElement>;
  @ViewChild('viewerFullscreenHost', { static: true })
  viewerFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Document Management', routerLink: '/documents' },
    { label: 'Drawings' }
  ];

  readonly drawings = DEMO_DRAWINGS;
  readonly selected = signal<DrawingRecord | null>(DEMO_DRAWINGS[0] ?? null);
  readonly loading = signal(false);
  readonly filterText = signal('');
  readonly filteredDrawings = signal(DEMO_DRAWINGS);
  readonly inAppExpanded = signal(false);
  readonly isBrowserFullscreen = signal(false);
  /** Bumped after layout changes so toolbar buttons re-render reliably. */
  readonly toolbarKey = signal(0);

  ngAfterViewInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
      this.onFullscreenChange();
    }
    void this.bootstrapViewer();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      if (document.fullscreenElement === this.viewerFullscreenHost?.nativeElement) {
        void document.exitFullscreen();
      }
    }
    void this.cadViewer.destroy();
  }

  onFilterChange(value: string): void {
    this.filterText.set(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      this.filteredDrawings.set(this.drawings);
      return;
    }
    this.filteredDrawings.set(
      this.drawings.filter(
        (d) =>
          d.sheet.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.discipline.toLowerCase().includes(q)
      )
    );
  }

  async selectDrawing(drawing: DrawingRecord): Promise<void> {
    this.selected.set(drawing);
    await this.loadDrawing(drawing.fileUrl, `${drawing.sheet} — ${drawing.title}`);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'dwg' && ext !== 'dxf') {
      this.messages.add({
        severity: 'warn',
        summary: 'Unsupported file',
        detail: 'Only AutoCAD DWG and DXF files can be opened.'
      });
      return;
    }

    this.selected.set(null);
    this.loading.set(true);
    try {
      await this.cadViewer.mount(this.cadHost.nativeElement);
      const ok = await this.cadViewer.openFile(file);
      if (!ok) {
        throw new Error('Parser could not open this drawing.');
      }
      this.cadViewer.zoomExtents();
    } catch (err) {
      this.messages.add({
        severity: 'error',
        summary: 'Could not open drawing',
        detail: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      this.loading.set(false);
    }
  }

  zoomExtents(): void {
    this.cadViewer.zoomExtents();
  }

  toggleInAppExpanded(): void {
    if (this.isBrowserFullscreen()) {
      void this.exitBrowserFullscreen();
    }
    const wasExpanded = this.inAppExpanded();
    this.inAppExpanded.update((v) => !v);
    this.bumpToolbar();
    if (wasExpanded) {
      void this.restoreViewerAfterCollapse();
    } else {
      this.scheduleLayoutRefresh();
    }
  }

  async toggleBrowserFullscreen(): Promise<void> {
    const host = this.viewerFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') {
      return;
    }

    if (document.fullscreenElement === host) {
      await this.exitBrowserFullscreen();
      return;
    }

    try {
      await host.requestFullscreen();
    } catch (err) {
      this.messages.add({
        severity: 'warn',
        summary: 'Full screen unavailable',
        detail: err instanceof Error ? err.message : 'Your browser blocked full screen.'
      });
    }
  }

  viewerTitle(): string {
    const d = this.selected();
    if (!d) {
      return 'Drawing viewer';
    }
    return `${d.sheet} — ${d.title} (Rev ${d.revision})`;
  }

  private async bootstrapViewer(): Promise<void> {
    const first = this.selected();
    if (!first) {
      return;
    }
    await this.loadDrawing(first.fileUrl, `${first.sheet} — ${first.title}`);
  }

  private async loadDrawing(url: string, label: string): Promise<void> {
    this.loading.set(true);
    try {
      await this.cadViewer.mount(this.cadHost.nativeElement);
      const ok = await this.cadViewer.openUrl(url);
      if (!ok) {
        throw new Error(`Failed to load "${label}".`);
      }
      this.cadViewer.zoomExtents();
    } catch (err) {
      this.messages.add({
        severity: 'error',
        summary: 'Drawing load failed',
        detail: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      this.loading.set(false);
    }
  }

  private async exitBrowserFullscreen(): Promise<void> {
    if (typeof document === 'undefined' || !document.fullscreenElement) {
      return;
    }
    await document.exitFullscreen();
  }

  private readonly onFullscreenChange = (): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const host = this.viewerFullscreenHost?.nativeElement;
    const active = !!host && document.fullscreenElement === host;
    this.isBrowserFullscreen.set(active);
    this.bumpToolbar();
    this.cdr.detectChanges();
    this.scheduleLayoutRefresh();
  };

  private bumpToolbar(): void {
    this.toolbarKey.update((k) => k + 1);
  }

  /** Remount CAD after leaving expanded layout so canvas cannot cover the toolbar. */
  private async restoreViewerAfterCollapse(): Promise<void> {
    this.scheduleLayoutRefresh();
    if (typeof window === 'undefined') {
      return;
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, 150));
    const drawing = this.selected();
    if (!drawing) {
      this.cadViewer.refreshLayout();
      this.cdr.detectChanges();
      return;
    }
    await this.cadViewer.remount(this.cadHost.nativeElement);
    const ok = await this.cadViewer.openUrl(drawing.fileUrl);
    if (ok) {
      this.cadViewer.zoomExtents();
    }
    this.bumpToolbar();
    this.cdr.detectChanges();
  }

  private scheduleLayoutRefresh(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const run = (): void => {
      this.cadViewer.refreshLayout();
      this.cadViewer.zoomExtents();
      this.cdr.detectChanges();
    };
    window.requestAnimationFrame(() => {
      run();
      window.setTimeout(run, 120);
      window.setTimeout(run, 320);
    });
  }
}
