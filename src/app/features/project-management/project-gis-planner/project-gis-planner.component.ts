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
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { ThemeService } from '../../../core/services/theme.service';
import { LeafletGisService } from './leaflet-gis.service';
import {
  GIS_LINE_COLOR_PRESETS,
  GIS_LINE_WEIGHT_OPTIONS
} from './gis-sketch.model';
import {
  DEFAULT_GIS_VIEW,
  GIS_PROJECT_OPTIONS,
  GIS_PROJECT_VIEWS,
  GisDrawTool
} from './project-gis-planner.data';

@Component({
  selector: 'app-project-gis-planner',
  imports: [FormsModule, Breadcrumb, Button, Select, Tag, InputText, Checkbox],
  templateUrl: './project-gis-planner.component.html',
  styleUrl: './project-gis-planner.component.scss'
})
export class ProjectGisPlannerComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly mapGis = inject(LeafletGisService);
  readonly themeService = inject(ThemeService);

  readonly colorPresets = [...GIS_LINE_COLOR_PRESETS];
  readonly weightOptions = [...GIS_LINE_WEIGHT_OPTIONS];

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('gisFullscreenHost', { static: true }) gisFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly projectOptions = GIS_PROJECT_OPTIONS;
  readonly selectedProjectId = signal('');
  readonly activeTool = signal<GisDrawTool>(null);
  readonly graphicCount = signal(0);
  readonly lastAction = signal('Ready — set line style, draw, or place labels on lines.');
  readonly isFullscreen = signal(false);
  readonly exportPreview = signal<string | null>(null);
  readonly labelText = signal('');

  private readonly mapReady = signal(false);
  private readonly onFullscreenChange = (): void => {
    const host = this.gisFullscreenHost?.nativeElement;
    this.isFullscreen.set(!!host && document.fullscreenElement === host);
    requestAnimationFrame(() => this.mapGis.invalidateSize());
  };

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Project GIS Planner' });
    return items;
  });

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
    }

    effect(() => {
      if (!this.mapReady()) return;
      this.mapGis.setBasemap(this.themeService.theme() === 'dark');
    });
  }

  ngAfterViewInit(): void {
    this.mapGis.initialize(this.mapContainer.nativeElement, {
      center: DEFAULT_GIS_VIEW.center,
      zoom: DEFAULT_GIS_VIEW.zoom,
      dark: this.themeService.isDark(),
      onGeometryChange: () => this.refreshCount()
    });
    this.mapReady.set(true);
    this.refreshCount();
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.mapGis.destroy();
  }

  onLineColorChange(color: string): void {
    this.mapGis.setLineStyle({ color });
  }

  onLineWeightChange(weight: number): void {
    this.mapGis.setLineStyle({ weight });
  }

  onLockAnglesChange(lock: boolean): void {
    this.mapGis.setLockAngles(lock);
    this.lastAction.set(
      lock
        ? 'Lock angles on — lines snap to 45° / 90° while drawing.'
        : 'Lock angles off — draw freehand; bearing still shown.'
    );
  }

  onShowSegmentLengthsChange(show: boolean): void {
    this.mapGis.setShowSegmentLengths(show);
    this.lastAction.set(show ? 'Segment lengths shown on lines.' : 'Segment lengths hidden.');
  }

  onLabelTextChange(text: string): void {
    this.labelText.set(text);
    this.mapGis.setPendingLabelText(text);
  }

  startPlaceLabel(): void {
    const text = this.labelText().trim();
    if (!text) {
      this.lastAction.set('Enter label text first, then click Place on line.');
      return;
    }
    this.mapGis.setPendingLabelText(text);
    this.mapGis.startLabelPlacement();
    this.activeTool.set(null);
    this.lastAction.set('Click a line on the map to place the label.');
  }

  cancelPlaceLabel(): void {
    this.mapGis.stopLabelPlacement();
    this.lastAction.set('Label placement cancelled.');
  }

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    if (!projectId || !this.mapReady()) return;
    const view = GIS_PROJECT_VIEWS[projectId] ?? DEFAULT_GIS_VIEW;
    this.mapGis.goTo(view.center, view.zoom);
    this.lastAction.set('Map centered on project context.');
  }

  selectTool(tool: GisDrawTool): void {
    if (!tool) return;
    this.mapGis.stopLabelPlacement();
    this.activeTool.set(tool);
    this.mapGis.startDraw(tool);
    const angleHint =
      tool === 'polyline' || tool === 'polygon'
        ? this.mapGis.lockAngles()
          ? ' Lock angles on — snaps at 45° / 90°.'
          : ' Lock angles off — freehand.'
        : '';
    this.lastAction.set(`Drawing ${tool} — click on the map.${angleHint}`);
  }

  cancelDraw(): void {
    this.mapGis.cancelDraw();
    this.activeTool.set(null);
    this.lastAction.set('Draw cancelled.');
  }

  enableEdit(): void {
    this.mapGis.stopLabelPlacement();
    this.mapGis.enableEditMode();
    this.activeTool.set(null);
    this.lastAction.set('Edit mode — drag vertices; segment lengths update automatically.');
  }

  clearAll(): void {
    this.mapGis.clearAll();
    this.refreshCount();
    this.lastAction.set('All shapes cleared.');
    this.exportPreview.set(null);
  }

  deleteSelected(): void {
    this.mapGis.deleteSelected();
    this.refreshCount();
    this.lastAction.set('Removed last shape.');
  }

  exportGeoJson(): void {
    const collection = this.mapGis.exportToGeoJSON();
    const json = JSON.stringify(collection, null, 2);
    console.group('[Project GIS Planner] Export GeoJSON');
    console.log(collection);
    console.groupEnd();
    this.exportPreview.set(json);
    this.lastAction.set(`Exported ${collection.features.length} feature(s) — see console (F12) and preview below.`);
  }

  async toggleFullscreen(): Promise<void> {
    const host = this.gisFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      await host.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  private refreshCount(): void {
    this.graphicCount.set(this.mapGis.getGraphicCount());
  }
}
