import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { ThemeService } from '../../../core/services/theme.service';
import { CadViewerService } from './cad-viewer.service';
import { DEMO_DRAWINGS, DrawingRecord } from './drawings.data';
import { MODEL3D_COMMANDS, MODEL3D_MOUSE_HINTS } from './model3d-commands.data';
import { Model3dViewerService } from './model3d-viewer.service';

@Component({
  selector: 'app-drawing-viewer',
  imports: [
    FormsModule,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    Divider,
    InputText,
    TableModule,
    Tag,
    Toast,
    Tooltip
  ],
  providers: [MessageService],
  templateUrl: './drawing-viewer.component.html',
  styleUrl: './drawing-viewer.component.scss'
})
export class DrawingViewerComponent implements AfterViewInit, OnDestroy {
  private readonly cadViewer = inject(CadViewerService);
  private readonly model3dViewer = inject(Model3dViewerService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly themeService = inject(ThemeService);

  @ViewChild('cadHost', { static: true }) cadHost!: ElementRef<HTMLDivElement>;
  @ViewChild('viewerFullscreenHost', { static: true })
  viewerFullscreenHost!: ElementRef<HTMLDivElement>;
  @ViewChild('model3dHost') model3dHost?: ElementRef<HTMLDivElement>;

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

  readonly model3dVisible = signal(false);
  readonly model3dLoading = signal(false);
  readonly model3dWireframe = signal(false);
  readonly model3dGrid = signal(true);
  readonly model3dAxes = signal(true);
  readonly model3dLastCommand = signal('Ready — select a command or use the mouse.');
  readonly model3dCommands = MODEL3D_COMMANDS;
  readonly model3dMouseHints = MODEL3D_MOUSE_HINTS;

  constructor() {
    effect(() => {
      this.themeService.theme();
      if (this.cadHost?.nativeElement) {
        this.scheduleLayoutRefresh();
      }
      if (this.model3dVisible()) {
        this.model3dViewer.applyTheme(this.themeService.isDark());
      }
    });
  }

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
    void this.model3dViewer.dispose();
  }

  openModel3d(drawing?: DrawingRecord): void {
    const target = drawing ?? this.selected();
    if (!target) {
      this.messages.add({
        severity: 'warn',
        summary: 'No drawing selected',
        detail: 'Select a sheet from the register or open a DWG/DXF file first.'
      });
      return;
    }
    this.selected.set(target);
    this.model3dVisible.set(true);
  }

  async onModel3dDialogShow(): Promise<void> {
    const drawing = this.selected();
    const host = this.model3dHost?.nativeElement;
    if (!drawing || !host) {
      return;
    }

    this.model3dLoading.set(true);
    this.model3dLastCommand.set(`3DOPEN — Loading preview for ${drawing.sheet}…`);
    try {
      await this.model3dViewer.mount(host, this.themeService.isDark());
      this.model3dViewer.loadDrawingModel(drawing);
      this.model3dWireframe.set(this.model3dViewer.isWireframe());
      this.model3dGrid.set(this.model3dViewer.isGridVisible());
      this.model3dAxes.set(this.model3dViewer.isAxesVisible());
      this.model3dLastCommand.set(`3DOPEN — ${drawing.sheet} · ${drawing.title}`);
      this.scheduleModel3dLayoutRefresh();
    } catch (err) {
      this.messages.add({
        severity: 'error',
        summary: '3D viewer failed',
        detail: err instanceof Error ? err.message : 'Could not initialize 3D preview.'
      });
      this.model3dVisible.set(false);
    } finally {
      this.model3dLoading.set(false);
    }
  }

  onModel3dDialogHide(): void {
    void this.model3dViewer.dispose();
    this.model3dLastCommand.set('Ready — select a command or use the mouse.');
  }

  runModel3dCommand(commandId: string): void {
    const drawing = this.selected();
    const label = this.model3dCommands.find((c) => c.id === commandId)?.label ?? commandId.toUpperCase();

    switch (commandId) {
      case 'fit':
        this.model3dViewer.fitAll();
        this.model3dLastCommand.set(`${label} — Zoom extents`);
        break;
      case 'top':
        this.model3dViewer.setView('top');
        this.model3dLastCommand.set(`${label} — Top view`);
        break;
      case 'front':
        this.model3dViewer.setView('front');
        this.model3dLastCommand.set(`${label} — Front view`);
        break;
      case 'right':
        this.model3dViewer.setView('right');
        this.model3dLastCommand.set(`${label} — Right view`);
        break;
      case 'iso':
        this.model3dViewer.setView('iso');
        this.model3dLastCommand.set(`${label} — Isometric view`);
        break;
      case 'wireframe': {
        const on = this.model3dViewer.toggleWireframe();
        this.model3dWireframe.set(on);
        this.model3dLastCommand.set(`${label} — Wireframe ${on ? 'ON' : 'OFF'}`);
        break;
      }
      case 'grid': {
        const on = this.model3dViewer.toggleGrid();
        this.model3dGrid.set(on);
        this.model3dLastCommand.set(`${label} — Grid ${on ? 'ON' : 'OFF'}`);
        break;
      }
      case 'axes': {
        const on = this.model3dViewer.toggleAxes();
        this.model3dAxes.set(on);
        this.model3dLastCommand.set(`${label} — Axes ${on ? 'ON' : 'OFF'}`);
        break;
      }
      case 'regen':
        if (drawing) {
          this.model3dViewer.loadDrawingModel(drawing);
          this.model3dLastCommand.set(`${label} — Model regenerated`);
        }
        break;
      default:
        break;
    }
    this.scheduleModel3dLayoutRefresh();
  }

  model3dDialogTitle(): string {
    const d = this.selected();
    if (!d) {
      return '3D model preview';
    }
    return `3D preview — ${d.sheet} · ${d.title}`;
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

  private scheduleModel3dLayoutRefresh(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.requestAnimationFrame(() => {
      this.model3dViewer.refreshLayout();
      this.cdr.detectChanges();
    });
    window.setTimeout(() => this.model3dViewer.refreshLayout(), 120);
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
