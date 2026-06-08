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
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { ThemeService } from '../../../core/services/theme.service';
import { CadViewerService } from './cad-viewer.service';
import { DEMO_DRAWINGS, DrawingRecord } from './drawings.data';
import { MODEL3D_COMMANDS, MODEL3D_MOUSE_HINTS } from './model3d-commands.data';
import { Model3dViewerService } from './model3d-viewer.service';

export type DrawingViewerMode = '2d' | '3d';

@Component({
  selector: 'app-drawing-viewer',
  imports: [
    FormsModule,
    Breadcrumb,
    Button,
    Card,
    Divider,
    InputText,
    SelectButton,
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
  @ViewChild('model3dHost', { static: true }) model3dHost!: ElementRef<HTMLDivElement>;
  @ViewChild('viewerFullscreenHost', { static: true })
  viewerFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Document Management', routerLink: '/documents' },
    { label: 'Drawings' }
  ];

  readonly viewerModeOptions = [
    { label: '2D', value: '2d' as DrawingViewerMode, icon: 'pi pi-file' },
    { label: '3D', value: '3d' as DrawingViewerMode, icon: 'pi pi-box' }
  ];

  readonly drawings = DEMO_DRAWINGS;
  readonly selected = signal<DrawingRecord | null>(DEMO_DRAWINGS[0] ?? null);
  readonly viewerMode = signal<DrawingViewerMode>('2d');
  readonly loading = signal(false);
  readonly filterText = signal('');
  readonly filteredDrawings = signal(DEMO_DRAWINGS);
  readonly inAppExpanded = signal(false);
  readonly isBrowserFullscreen = signal(false);
  readonly toolbarKey = signal(0);

  readonly model3dLoading = signal(false);
  readonly model3dWireframe = signal(false);
  readonly model3dGrid = signal(true);
  readonly model3dAxes = signal(true);
  readonly model3dLastCommand = signal('Ready — select a command or use the mouse.');
  readonly model3dCommands = MODEL3D_COMMANDS;
  readonly model3dMouseHints = MODEL3D_MOUSE_HINTS;

  private model3dActive = false;

  constructor() {
    effect(() => {
      this.themeService.theme();
      if (this.viewerMode() === '2d' && this.cadHost?.nativeElement) {
        this.scheduleLayoutRefresh();
      }
      if (this.viewerMode() === '3d' && this.model3dActive) {
        this.model3dViewer.applyTheme(this.themeService.isDark());
        this.scheduleModel3dLayoutRefresh();
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

  async onViewerModeChange(mode: DrawingViewerMode): Promise<void> {
    if (mode === this.viewerMode()) {
      return;
    }
    if (mode === '3d') {
      await this.activate3dMode();
      return;
    }
    await this.activate2dMode();
  }

  show3dForDrawing(drawing: DrawingRecord): void {
    this.selected.set(drawing);
    void this.onViewerModeChange('3d');
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
    if (this.viewerMode() === '3d') {
      await this.loadModel3d(drawing);
      return;
    }
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

    if (this.viewerMode() === '3d') {
      this.viewerMode.set('2d');
      void this.model3dViewer.dispose();
      this.model3dActive = false;
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
    if (this.viewerMode() === '3d') {
      this.runModel3dCommand('fit');
      return;
    }
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
      this.scheduleActiveViewerLayout();
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
    const mode = this.viewerMode() === '3d' ? '3D' : '2D';
    if (!d) {
      return `${mode} viewer`;
    }
    return `${mode} · ${d.sheet} — ${d.title} (Rev ${d.revision})`;
  }

  private async bootstrapViewer(): Promise<void> {
    const first = this.selected();
    if (!first) {
      return;
    }
    await this.loadDrawing(first.fileUrl, `${first.sheet} — ${first.title}`);
  }

  private async activate3dMode(): Promise<void> {
    const drawing = this.selected();
    if (!drawing) {
      this.messages.add({
        severity: 'warn',
        summary: 'No drawing selected',
        detail: 'Select a sheet from the register first.'
      });
      return;
    }

    this.viewerMode.set('3d');
    this.bumpToolbar();
    await this.cadViewer.destroy();
    await this.loadModel3d(drawing);
  }

  private async activate2dMode(): Promise<void> {
    this.viewerMode.set('2d');
    this.bumpToolbar();
    void this.model3dViewer.dispose();
    this.model3dActive = false;
    this.model3dLastCommand.set('Ready — select a command or use the mouse.');

    const drawing = this.selected();
    if (drawing) {
      await this.loadDrawing(drawing.fileUrl, `${drawing.sheet} — ${drawing.title}`);
    } else {
      this.scheduleLayoutRefresh();
    }
  }

  private async loadModel3d(drawing: DrawingRecord): Promise<void> {
    this.model3dLoading.set(true);
    this.model3dLastCommand.set(`3DOPEN — Loading preview for ${drawing.sheet}…`);
    try {
      await this.model3dViewer.mount(this.model3dHost.nativeElement, this.themeService.isDark());
      this.model3dViewer.loadDrawingModel(drawing);
      this.model3dActive = true;
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
      this.viewerMode.set('2d');
      const d = this.selected();
      if (d) {
        await this.loadDrawing(d.fileUrl, `${d.sheet} — ${d.title}`);
      }
    } finally {
      this.model3dLoading.set(false);
    }
  }

  private async loadDrawing(url: string, label: string): Promise<void> {
    this.loading.set(true);
    try {
      await this.waitForCadHost();
      await this.cadViewer.mount(this.cadHost.nativeElement);
      const ok = await this.cadViewer.openUrl(url);
      if (!ok) {
        throw new Error(
          `The CAD parser could not open "${label}". Try Open DWG/DXF with another file, or check /cad-workers in the network tab.`
        );
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
      if (this.viewerMode() === '2d') {
        this.scheduleLayoutRefresh();
      }
    }
  }

  private async waitForCadHost(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    for (let i = 0; i < 20; i++) {
      const el = this.cadHost?.nativeElement;
      if (el && el.getBoundingClientRect().width > 0) {
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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
    this.scheduleActiveViewerLayout();
  };

  private bumpToolbar(): void {
    this.toolbarKey.update((k) => k + 1);
  }

  private scheduleActiveViewerLayout(): void {
    if (this.viewerMode() === '3d') {
      this.scheduleModel3dLayoutRefresh();
    } else {
      this.scheduleLayoutRefresh();
    }
  }

  private async restoreViewerAfterCollapse(): Promise<void> {
    this.scheduleActiveViewerLayout();
    if (typeof window === 'undefined') {
      return;
    }
    await new Promise<void>((resolve) => window.setTimeout(resolve, 150));

    if (this.viewerMode() === '3d') {
      const drawing = this.selected();
      if (drawing) {
        await this.loadModel3d(drawing);
      } else {
        this.model3dViewer.refreshLayout();
      }
      this.bumpToolbar();
      this.cdr.detectChanges();
      return;
    }

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
    const run = (): void => {
      this.model3dViewer.refreshLayout();
      this.cdr.detectChanges();
    };
    window.requestAnimationFrame(run);
    window.setTimeout(run, 120);
    window.setTimeout(run, 320);
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
