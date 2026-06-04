import { Injectable, signal } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GisDrawPolygon, GisDrawPolyline } from './gis-draw-handlers';
import {
  applyStrokeStyle,
  buildSegmentLengthMarkers,
  buildUserLabelMarkers,
  findNearestSegment,
  getSketchMeta,
  layerStamp,
  newLabelId,
  setSketchMeta
} from './gis-line-decorations';
import { gisDrawAngleSettings } from './gis-draw-settings';
import {
  DEFAULT_GIS_LINE_STYLE,
  type GisLineStyle,
  type GisSketchMeta
} from './gis-sketch.model';
import { labelsFromProperties, metaFromGeoJsonProperties } from './gis-geojson-import';
import {
  DEFAULT_SITE_PROGRESS,
  SITE_PROGRESS_STATUSES,
  emptyLayerCounts,
  getProgressDefinition,
  initialLayerVisibility,
  type SiteProgressStatus
} from './site-progress.model';
import { MAP_TILES } from '../sites-map/sites-map.data';
import type { GeoJsonFeatureCollection } from './map-gis.service';

export type SketchEventAction = 'create' | 'update' | 'delete';

type LabelMarker = L.Marker & { gisParent?: number; gisRole?: string; gisLabelId?: string };

@Injectable({ providedIn: 'root' })
export class LeafletSiteStatusGisService {
  private map: L.DrawMap | null = null;
  private tileLayer: L.TileLayer | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private annotations: L.FeatureGroup | null = null;
  private drawControl: L.Control.Draw | null = null;
  private activeHandler: { enable: () => void; disable: () => void } | null = null;
  private onGeometryChange?: (action: SketchEventAction) => void;
  private labelClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

  readonly activeProgressStatus = signal<SiteProgressStatus>(DEFAULT_SITE_PROGRESS);
  readonly lineStyle = signal<GisLineStyle>({ ...DEFAULT_GIS_LINE_STYLE });
  readonly lockAngles = signal(gisDrawAngleSettings.lockAngles);
  readonly showSegmentLengths = signal(true);
  readonly showLineLabels = signal(true);
  readonly labelPlacementActive = signal(false);
  readonly pendingLabelText = signal('');
  readonly layerVisibility = signal<Record<SiteProgressStatus, boolean>>(initialLayerVisibility());
  readonly progressLayerCounts = signal<Record<SiteProgressStatus, number>>(emptyLayerCounts());

  initialize(
    container: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      dark: boolean;
      onGeometryChange?: (action: SketchEventAction) => void;
    }
  ): void {
    this.destroy();
    this.onGeometryChange = options.onGeometryChange;

    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      scrollWheelZoom: true
    }) as L.DrawMap;

    this.tileLayer = this.createTileLayer(options.dark).addTo(this.map);

    this.drawnItems = new L.FeatureGroup();
    this.annotations = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);
    this.map.addLayer(this.annotations);

    this.drawControl = new L.Control.Draw({
      edit: { featureGroup: this.drawnItems },
      draw: {
        polygon: false,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false
      }
    });

    this.map.on(L.Draw.Event.CREATED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Created;
      this.attachSketchMeta(e.layer);
      this.drawnItems?.addLayer(e.layer);
      this.refreshLayerDecorations(e.layer);
      this.updateProgressLayerCounts();
      this.logLayer('create', e.layer);
      this.onGeometryChange?.('create');
    });

    this.map.on(L.Draw.Event.EDITED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Edited;
      e.layers.eachLayer((layer) => {
        this.refreshLayerDecorations(layer);
        this.logLayer('update', layer);
      });
      this.updateProgressLayerCounts();
      this.onGeometryChange?.('update');
    });

    this.map.on(L.Draw.Event.DELETED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Deleted;
      e.layers.eachLayer((layer) => {
        this.removeLayerDecorations(layer);
        this.logLayer('delete', layer);
      });
      this.updateProgressLayerCounts();
      this.onGeometryChange?.('delete');
    });
  }

  setLineStyle(style: Partial<GisLineStyle>): void {
    this.lineStyle.update((current) => ({ ...current, ...style }));
  }

  setActiveProgressStatus(status: SiteProgressStatus): void {
    this.activeProgressStatus.set(status);
    const def = getProgressDefinition(status);
    this.lineStyle.set({ color: def.color, weight: def.weight });
  }

  isProgressLayerVisible(status: SiteProgressStatus): boolean {
    return this.layerVisibility()[status] !== false;
  }

  setProgressLayerVisible(status: SiteProgressStatus, visible: boolean): void {
    this.layerVisibility.update((current) => ({ ...current, [status]: visible }));
    this.applyProgressLayerVisibility();
  }

  setAllProgressLayersVisible(visible: boolean): void {
    this.layerVisibility.set(
      SITE_PROGRESS_STATUSES.reduce(
        (acc, s) => {
          acc[s.id] = visible;
          return acc;
        },
        {} as Record<SiteProgressStatus, boolean>
      )
    );
    this.applyProgressLayerVisibility();
  }

  getProgressLayerCount(status: SiteProgressStatus): number {
    return this.progressLayerCounts()[status] ?? 0;
  }

  setLockAngles(lock: boolean): void {
    gisDrawAngleSettings.lockAngles = lock;
    this.lockAngles.set(lock);
  }

  setShowSegmentLengths(show: boolean): void {
    this.showSegmentLengths.set(show);
    this.redrawAllDecorations();
  }

  setShowLineLabels(show: boolean): void {
    this.showLineLabels.set(show);
    this.redrawAllDecorations();
  }

  toggleLineLabelVisibility(layer: L.Layer, labelId: string): void {
    const meta = getSketchMeta(layer);
    if (!meta) return;

    meta.labels = meta.labels.map((label) =>
      label.id === labelId ? { ...label, visible: label.visible === false } : label
    );
    setSketchMeta(layer, meta);
    this.refreshLayerDecorations(layer);
    this.onGeometryChange?.('update');
  }

  setPendingLabelText(text: string): void {
    this.pendingLabelText.set(text);
  }

  startLabelPlacement(): void {
    if (!this.map) return;
    this.cancelDraw();
    this.stopLabelPlacement();
    this.labelPlacementActive.set(true);

    this.labelClickHandler = (e: L.LeafletMouseEvent) => {
      const text = this.pendingLabelText().trim();
      if (!text) return;
      this.placeLabelAt(e.latlng, text);
    };
    this.map.on('click', this.labelClickHandler);
    this.map.getContainer().classList.add('gis-label-mode');
  }

  stopLabelPlacement(): void {
    if (this.map && this.labelClickHandler) {
      this.map.off('click', this.labelClickHandler);
      this.labelClickHandler = null;
    }
    this.map?.getContainer().classList.remove('gis-label-mode');
    this.labelPlacementActive.set(false);
  }

  placeLabelAt(latlng: L.LatLng, text: string): boolean {
    if (!this.drawnItems || !this.map) return false;

    const layers: L.Layer[] = [];
    this.drawnItems.eachLayer((l) => layers.push(l));
    const hit = findNearestSegment(latlng, this.map, layers);
    if (!hit) return false;

    const meta = getSketchMeta(hit.layer) ?? this.createDefaultMeta();
    meta.labels = [
      ...meta.labels,
      { id: newLabelId(), lat: hit.midpoint.lat, lng: hit.midpoint.lng, text, visible: true }
    ];
    setSketchMeta(hit.layer, meta);
    this.refreshLayerDecorations(hit.layer);
    this.onGeometryChange?.('update');
    return true;
  }

  setBasemap(dark: boolean): void {
    if (!this.map || !this.tileLayer) return;
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = this.createTileLayer(dark).addTo(this.map);
    this.tileLayer.bringToBack();
  }

  goTo(center: [number, number], zoom: number): void {
    this.map?.setView(center, zoom, { animate: true });
  }

  startDraw(tool: 'point' | 'polyline' | 'polygon'): void {
    if (!this.map || !this.drawnItems) return;
    this.stopLabelPlacement();
    this.cancelDraw();

    const style = this.lineStyle();
    const shapeOptions: L.PathOptions = {
      color: style.color,
      weight: style.weight,
      fillColor: style.color,
      fillOpacity: 0.25
    };

    switch (tool) {
      case 'point':
        this.activeHandler = new L.Draw.Marker(this.map, {
          icon: L.divIcon({
            className: 'gis-draw-marker',
            html: `<span style="background:${style.color}"></span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        });
        break;
      case 'polyline':
        this.activeHandler = new GisDrawPolyline(this.map, {
          shapeOptions,
          showLength: true,
          metric: true
        });
        break;
      case 'polygon':
        this.activeHandler = new GisDrawPolygon(this.map, {
          shapeOptions,
          showLength: false,
          showArea: false,
          metric: true
        });
        break;
    }

    this.activeHandler.enable();
  }

  cancelDraw(): void {
    this.activeHandler?.disable();
    this.activeHandler = null;
  }

  clearAll(): void {
    this.drawnItems?.clearLayers();
    this.annotations?.clearLayers();
    this.updateProgressLayerCounts();
    this.onGeometryChange?.('delete');
  }

  deleteSelected(): void {
    if (!this.drawnItems) return;
    const layers: L.Layer[] = [];
    this.drawnItems.eachLayer((layer) => layers.push(layer));
    const last = layers[layers.length - 1];
    if (last) {
      this.removeLayerDecorations(last);
      this.drawnItems.removeLayer(last);
      this.onGeometryChange?.('delete');
    }
  }

  enableEditMode(): void {
    if (!this.map || !this.drawnItems) return;
    this.stopLabelPlacement();
    this.cancelDraw();
    const Edit = (L as typeof L & { EditToolbar: { Edit: new (...args: unknown[]) => { enable: () => void } } })
      .EditToolbar.Edit;
    new Edit(this.map, { featureGroup: this.drawnItems }).enable();
  }

  getGraphicCount(): number {
    let count = 0;
    this.drawnItems?.eachLayer(() => count++);
    return count;
  }

  importGeoJSON(
    collection: GeoJsonFeatureCollection,
    options?: { replace?: boolean; fitBounds?: boolean }
  ): number {
    if (!this.map || !this.drawnItems) return 0;

    if (options?.replace) {
      this.drawnItems.clearLayers();
      this.annotations?.clearLayers();
    }

    const style = this.lineStyle();
    const geoLayer = L.geoJSON(collection as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const props = feature?.properties as Record<string, unknown> | undefined;
        const meta = metaFromGeoJsonProperties(props, {
          strokeColor: style.color,
          strokeWeight: style.weight
        });
        const progress = meta.progressStatus ? getProgressDefinition(meta.progressStatus) : undefined;
        return {
          color: meta.strokeColor,
          weight: meta.strokeWeight,
          dashArray: progress?.dashArray,
          fillColor: meta.strokeColor,
          fillOpacity: 0.28
        };
      },
      pointToLayer: (feature, latlng) => {
        const props = feature.properties as Record<string, unknown> | undefined;
        const color =
          typeof props?.['strokeColor'] === 'string' ? (props['strokeColor'] as string) : style.color;
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'gis-draw-marker',
            html: `<span style="background:${color}"></span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties as Record<string, unknown> | undefined;
        const meta = metaFromGeoJsonProperties(props, {
          strokeColor: style.color,
          strokeWeight: style.weight
        });
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
          setSketchMeta(layer, meta);
          applyStrokeStyle(layer, meta);
        }
      }
    });

    let added = 0;
    geoLayer.eachLayer((layer) => {
      this.drawnItems?.addLayer(layer);
      this.refreshLayerDecorations(layer);
      added++;
    });

    if (added > 0 && options?.fitBounds !== false) {
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
      }
    }

    if (added > 0) {
      this.applyProgressLayerVisibility();
      this.updateProgressLayerCounts();
      this.onGeometryChange?.('create');
    }

    return added;
  }

  exportToGeoJSON(): GeoJsonFeatureCollection {
    const features: GeoJSON.Feature[] = [];
    this.drawnItems?.eachLayer((layer) => {
      const gjFn = (layer as L.Layer & { toGeoJSON?: () => GeoJSON.Feature }).toGeoJSON;
      if (!gjFn) return;
      const feature = gjFn.call(layer);
      const meta = getSketchMeta(layer);
      if (meta) {
        feature.properties = {
          ...feature.properties,
          strokeColor: meta.strokeColor,
          strokeWeight: meta.strokeWeight,
          labels: meta.labels,
          ...(meta.progressStatus ? { progressStatus: meta.progressStatus } : {})
        };
      }
      features.push(feature);
    });
    return { type: 'FeatureCollection', features } as GeoJsonFeatureCollection;
  }

  invalidateSize(): void {
    this.map?.invalidateSize({ animate: false });
  }

  destroy(): void {
    this.stopLabelPlacement();
    this.cancelDraw();
    this.map?.remove();
    this.map = null;
    this.tileLayer = null;
    this.drawnItems = null;
    this.annotations = null;
    this.drawControl = null;
    this.onGeometryChange = undefined;
  }

  private createDefaultMeta(): GisSketchMeta {
    return this.metaForProgress(this.activeProgressStatus());
  }

  private metaForProgress(status: SiteProgressStatus): GisSketchMeta {
    const def = getProgressDefinition(status);
    return {
      strokeColor: def.color,
      strokeWeight: def.weight,
      labels: [],
      progressStatus: status
    };
  }

  private attachSketchMeta(layer: L.Layer): void {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
      const meta = this.createDefaultMeta();
      if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        const def = getProgressDefinition(meta.progressStatus ?? DEFAULT_SITE_PROGRESS);
        const vertices = layer.getLatLngs();
        if (vertices.length && vertices[0] instanceof L.LatLng) {
          const ring = vertices as L.LatLng[];
          const mid = ring[Math.floor(ring.length / 2)];
          meta.labels = [
            {
              id: newLabelId(),
              lat: mid.lat,
              lng: mid.lng,
              text: def.shortLabel,
              visible: true
            }
          ];
        }
      }
      setSketchMeta(layer, meta);
      applyStrokeStyle(layer, meta);
    }
  }

  private refreshLayerDecorations(layer: L.Layer): void {
    if (!this.map || !this.annotations) return;
    this.removeLayerDecorations(layer);

    if (!(layer instanceof L.Polyline)) return;
    const meta = getSketchMeta(layer);
    if (!meta) return;

    if (meta.progressStatus && !this.isProgressLayerVisible(meta.progressStatus)) {
      this.setLayerHidden(layer);
      return;
    }

    this.setLayerVisible(layer, meta);
    applyStrokeStyle(layer, meta);

    if (this.showSegmentLengths()) {
      for (const marker of buildSegmentLengthMarkers(layer, this.map, meta)) {
        this.annotations.addLayer(marker);
      }
    }

    if (this.showLineLabels()) {
      for (const marker of buildUserLabelMarkers(layer, meta)) {
        marker.on('click', (e: L.LeafletMouseEvent) => {
          const target = e.originalEvent.target as HTMLElement;
          if (!target.closest('.gis-line-label-toggle')) return;
          L.DomEvent.stopPropagation(e);
          const labelId = (marker as LabelMarker).gisLabelId;
          if (labelId) this.toggleLineLabelVisibility(layer, labelId);
        });
        this.annotations.addLayer(marker);
      }
    }
  }

  private removeLayerDecorations(layer: L.Layer): void {
    if (!this.annotations) return;
    const stamp = layerStamp(layer);
    const toRemove: L.Layer[] = [];
    this.annotations.eachLayer((m) => {
      const tagged = m as LabelMarker;
      if (tagged.gisParent === stamp) toRemove.push(m);
    });
    toRemove.forEach((m) => this.annotations?.removeLayer(m));
  }

  private redrawAllDecorations(): void {
    if (!this.drawnItems) return;
    this.annotations?.clearLayers();
    this.drawnItems.eachLayer((layer) => this.refreshLayerDecorations(layer));
  }

  private applyProgressLayerVisibility(): void {
    if (!this.drawnItems) return;
    this.drawnItems.eachLayer((layer) => this.refreshLayerDecorations(layer));
  }

  private pathElement(layer: L.Layer): HTMLElement | undefined {
    if (!(layer instanceof L.Path) && !(layer instanceof L.Marker)) return undefined;
    return layer.getElement() as HTMLElement | undefined;
  }

  private setLayerHidden(layer: L.Layer): void {
    const el = this.pathElement(layer);
    if (el) {
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  }

  private setLayerVisible(layer: L.Layer, meta: GisSketchMeta): void {
    if (layer instanceof L.Path) {
      applyStrokeStyle(layer, meta);
      return;
    }
    if (layer instanceof L.Marker) {
      const el = this.pathElement(layer);
      if (el) {
        el.style.display = '';
        el.style.pointerEvents = '';
      }
    }
  }

  private updateProgressLayerCounts(): void {
    const counts = emptyLayerCounts();
    this.drawnItems?.eachLayer((layer) => {
      const status = getSketchMeta(layer)?.progressStatus;
      if (status) counts[status]++;
    });
    this.progressLayerCounts.set(counts);
  }

  private createTileLayer(dark: boolean): L.TileLayer {
    const config = dark ? MAP_TILES.dark : MAP_TILES.light;
    return L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution
    });
  }

  private logLayer(action: SketchEventAction, layer: L.Layer): void {
    const gj = (layer as L.Layer & { toGeoJSON?: () => unknown }).toGeoJSON?.();
    if (!gj) return;
    console.group(`[Site Status GIS] ${action}`);
    console.log(JSON.stringify(gj, null, 2));
    console.groupEnd();
  }
}
