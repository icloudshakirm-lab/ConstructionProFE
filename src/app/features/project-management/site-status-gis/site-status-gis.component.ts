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
import { GisGeoJsonParseError, parseGeoJsonText } from './gis-geojson-import';
import { LeafletSiteStatusGisService } from './leaflet-site-status-gis.service';
import { GIS_LINE_WEIGHT_OPTIONS } from './gis-sketch.model';
import {
  DEFAULT_SITE_PROGRESS,
  SITE_PROGRESS_STATUSES,
  getProgressDefinition,
  type SiteProgressStatus
} from './site-progress.model';
import { loadSeoulRoadsProgressCollection, SEOUL_SITE_STATUS_VIEW } from './site-status-seoul.data';
import {
  DEFAULT_GIS_VIEW,
  GIS_PROJECT_OPTIONS,
  GIS_PROJECT_VIEWS,
  GisDrawTool
} from './site-status-gis.data';

@Component({
  selector: 'app-site-status-gis',
  imports: [FormsModule, Breadcrumb, Button, Select, Tag, InputText, Checkbox],
  templateUrl: './site-status-gis.component.html',
  styleUrl: './site-status-gis.component.scss'
})
export class SiteStatusGisComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly mapGis = inject(LeafletSiteStatusGisService);
  readonly themeService = inject(ThemeService);

  readonly progressOptions = SITE_PROGRESS_STATUSES.map((s) => ({
    label: s.label,
    value: s.id
  }));
  readonly progressLegend = [...SITE_PROGRESS_STATUSES];
  readonly weightOptions = [...GIS_LINE_WEIGHT_OPTIONS];
  readonly activeProgressDef = computed(() =>
    getProgressDefinition(this.mapGis.activeProgressStatus())
  );

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('gisFullscreenHost', { static: true }) gisFullscreenHost!: ElementRef<HTMLDivElement>;
  @ViewChild('geoJsonFileInput') geoJsonFileInput?: ElementRef<HTMLInputElement>;

  readonly projectOptions = GIS_PROJECT_OPTIONS;
  readonly selectedProjectId = signal('');
  readonly activeTool = signal<GisDrawTool>(null);
  readonly graphicCount = signal(0);
  readonly lastAction = signal(
    'Choose a progress type, then draw a line along the road to mark from–to reach.'
  );
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
    items.push({ label: 'Site Status by GIS' });
    return items;
  });

  constructor() {
    this.mapGis.setActiveProgressStatus(DEFAULT_SITE_PROGRESS);

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
      center: SEOUL_SITE_STATUS_VIEW.center,
      zoom: SEOUL_SITE_STATUS_VIEW.zoom,
      dark: this.themeService.isDark(),
      onGeometryChange: () => this.refreshCount()
    });
    this.mapReady.set(true);
    void this.loadSeoulRoads();
  }

  private async loadSeoulRoads(): Promise<void> {
    try {
      const collection = await loadSeoulRoadsProgressCollection();
      const count = this.mapGis.importGeoJSON(collection, { fitBounds: true });
      this.refreshCount();
      this.lastAction.set(
        `Loaded ${count} Seoul road segments across ${this.progressLegend.length} progress layers — use Layers on the right to show or hide each stage.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load Seoul road data.';
      this.lastAction.set(msg);
    }
  }

  onLayerVisibilityChange(status: SiteProgressStatus, visible: boolean): void {
    this.mapGis.setProgressLayerVisible(status, visible);
    const def = getProgressDefinition(status);
    this.lastAction.set(
      visible ? `${def.label} layer shown on the map.` : `${def.label} layer hidden.`
    );
  }

  showAllLayers(): void {
    this.mapGis.setAllProgressLayersVisible(true);
    this.lastAction.set('All progress layers shown.');
  }

  hideAllLayers(): void {
    this.mapGis.setAllProgressLayersVisible(false);
    this.lastAction.set('All progress layers hidden — check layers on the right to show again.');
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.mapGis.destroy();
  }

  onProgressStatusChange(status: SiteProgressStatus): void {
    this.mapGis.setActiveProgressStatus(status);
    const def = getProgressDefinition(status);
    this.lastAction.set(`${def.label} — draw a line on the map for this progress reach.`);
  }

  onLineWeightChange(weight: number): void {
    this.mapGis.setLineStyle({ weight });
  }

  onLockAnglesChange(lock: boolean): void {
    this.mapGis.setLockAngles(lock);
    this.lastAction.set(
      lock
        ? 'Lock angles on — lines snap to 45° / 90° along the corridor.'
        : 'Lock angles off — freehand along the road.'
    );
  }

  onShowSegmentLengthsChange(show: boolean): void {
    this.mapGis.setShowSegmentLengths(show);
    this.lastAction.set(show ? 'Segment lengths shown (metres along reach).' : 'Segment lengths hidden.');
  }

  onShowLineLabelsChange(show: boolean): void {
    this.mapGis.setShowLineLabels(show);
    this.lastAction.set(
      show ? 'Progress labels shown on the map.' : 'Progress labels hidden on the map.'
    );
  }

  onLabelTextChange(text: string): void {
    this.labelText.set(text);
    this.mapGis.setPendingLabelText(text);
  }

  startPlaceLabel(): void {
    const text = this.labelText().trim();
    if (!text) {
      this.lastAction.set('Enter extra label text, then click Place on line.');
      return;
    }
    this.mapGis.setPendingLabelText(text);
    this.mapGis.startLabelPlacement();
    this.activeTool.set(null);
    this.lastAction.set('Click a reach on the map to place the label.');
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
    this.lastAction.set('Map centered on project / road corridor.');
  }

  selectTool(tool: GisDrawTool): void {
    if (!tool) return;
    this.mapGis.stopLabelPlacement();
    this.activeTool.set(tool);
    this.mapGis.startDraw(tool);
    const def = getProgressDefinition(this.mapGis.activeProgressStatus());
    const angleHint =
      tool === 'polyline' || tool === 'polygon'
        ? this.mapGis.lockAngles()
          ? ' Snap 45° / 90°.'
          : ''
        : '';
    this.lastAction.set(
      tool === 'polyline'
        ? `Drawing ${def.shortLabel} reach — click road alignment, double-click to finish.${angleHint}`
        : `Drawing ${tool} — click on the map.${angleHint}`
    );
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
    this.lastAction.set('Edit mode — drag vertices; lengths and labels update.');
  }

  clearAll(): void {
    this.mapGis.clearAll();
    this.refreshCount();
    this.lastAction.set('All progress reaches cleared.');
    this.exportPreview.set(null);
  }

  deleteSelected(): void {
    this.mapGis.deleteSelected();
    this.refreshCount();
    this.lastAction.set('Removed last shape.');
  }

  triggerGeoJsonUpload(): void {
    this.geoJsonFileInput?.nativeElement.click();
  }

  onGeoJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const collection = parseGeoJsonText(String(reader.result ?? ''));
        const count = this.mapGis.importGeoJSON(collection, { fitBounds: true });
        this.refreshCount();
        this.lastAction.set(
          count > 0
            ? `Imported ${count} progress feature(s) from “${file.name}”.`
            : `No features found in “${file.name}”.`
        );
      } catch (err) {
        const msg =
          err instanceof GisGeoJsonParseError ? err.message : 'Could not import GeoJSON file.';
        this.lastAction.set(msg);
      }
      input.value = '';
    };
    reader.onerror = () => {
      this.lastAction.set('Failed to read the selected file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  exportGeoJson(): void {
    const collection = this.mapGis.exportToGeoJSON();
    const json = JSON.stringify(collection, null, 2);
    console.group('[Site Status GIS] Export GeoJSON');
    console.log(collection);
    console.groupEnd();
    this.exportPreview.set(json);
    this.lastAction.set(
      `Exported ${collection.features.length} progress feature(s) — see console (F12) and preview below.`
    );
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
