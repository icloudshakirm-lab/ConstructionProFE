import { Injectable, signal } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GisDrawPolygon, GisDrawPolyline } from './gis-draw-handlers';
import {
  applyStrokeStyle,
  buildSegmentLengthMarkers,
  buildUserLabelMarkers,
  findNearestSegment,
  findNearestVertex,
  getSketchMeta,
  layerStamp,
  newLabelId,
  setSketchMeta,
  sketchVertices
} from './gis-line-decorations';
import {
  type GisVertexSelection,
  gisVertexFeatureLabel
} from './gis-selection.model';
import { gisDrawAngleSettings } from './gis-draw-settings';
import {
  DEFAULT_GIS_LINE_STYLE,
  type GisLineStyle,
  type GisSketchMeta
} from './gis-sketch.model';
import { labelsFromProperties } from './gis-geojson-import';
import { MAP_TILES } from '../sites-map/sites-map.data';
import type { GeoJsonFeatureCollection } from './map-gis.service';

export type SketchEventAction = 'create' | 'update' | 'delete';

type LabelMarker = L.Marker & { gisParent?: number; gisRole?: string; gisLabelId?: string };

@Injectable({ providedIn: 'root' })
export class LeafletGisService {
  private map: L.DrawMap | null = null;
  private tileLayer: L.TileLayer | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private annotations: L.FeatureGroup | null = null;
  private drawControl: L.Control.Draw | null = null;
  private activeHandler: { enable: () => void; disable: () => void } | null = null;
  private activeEditHandler: { disable: () => void } | null = null;
  private onGeometryChange?: (action: SketchEventAction) => void;
  private labelClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  private pickClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
  private selectionHighlight: L.CircleMarker | null = null;
  private editLiveRefreshBound = false;

  private readonly onSketchLayerClick = (e: L.LeafletMouseEvent): void => {
    if (this.labelPlacementActive() || this.activeHandler) return;
    this.pickVertexAt(e.latlng);
    L.DomEvent.stopPropagation(e);
  };

  private readonly onPolyEditDrag = (e: L.LeafletEvent): void => {
    const layer = e.target;
    if (!(layer instanceof L.Polyline)) return;
    this.refreshLayerDecorations(layer);
    this.syncSelectionFromLayer(layer);
  };

  private readonly onMarkerDrag = (e: L.LeafletEvent): void => {
    const layer = e.target;
    if (!(layer instanceof L.Marker)) return;
    this.syncSelectionFromLayer(layer);
  };

  readonly lineStyle = signal<GisLineStyle>({ ...DEFAULT_GIS_LINE_STYLE });
  readonly selection = signal<GisVertexSelection | null>(null);
  readonly coordinateDecimals = signal(6);
  readonly lockAngles = signal(gisDrawAngleSettings.lockAngles);
  readonly showSegmentLengths = signal(true);
  readonly showLineLabels = signal(true);
  readonly labelPlacementActive = signal(false);
  readonly pendingLabelText = signal('');

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
      this.registerSketchLayer(e.layer);
      this.drawnItems?.addLayer(e.layer);
      this.refreshLayerDecorations(e.layer);
      this.logLayer('create', e.layer);
      this.onGeometryChange?.('create');
    });

    this.map.on(L.Draw.Event.EDITED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Edited;
      e.layers.eachLayer((layer) => {
        this.refreshLayerDecorations(layer);
        this.syncSelectionFromLayer(layer);
        this.logLayer('update', layer);
      });
      this.onGeometryChange?.('update');
    });

    this.map.on(L.Draw.Event.DELETED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Deleted;
      e.layers.eachLayer((layer) => {
        if (this.selection()?.layerStamp === layerStamp(layer)) {
          this.clearSelection();
        }
        this.removeLayerDecorations(layer);
        this.logLayer('delete', layer);
      });
      this.onGeometryChange?.('delete');
    });

    this.map.on(L.Draw.Event.EDITSTART, () => {
      this.setEditCursorActive(true);
      this.bindEditLiveRefresh();
    });
    this.map.on(L.Draw.Event.EDITSTOP, () => {
      this.setEditCursorActive(false);
      this.unbindEditLiveRefresh();
    });

    this.map.on(L.Draw.Event.EDITVERTEX, (event: L.LeafletEvent) => {
      const poly = (event as L.DrawEvents.EditVertex).poly;
      if (poly instanceof L.Polyline) {
        this.refreshLayerDecorations(poly);
        this.syncSelectionFromLayer(poly);
      }
    });

    this.map.on(L.Draw.Event.EDITMOVE, (event: L.LeafletEvent) => {
      const layer = (event as L.DrawEvents.EditMove).layer;
      if (layer) {
        this.syncSelectionFromLayer(layer);
      }
    });

    this.pickClickHandler = (e: L.LeafletMouseEvent) => {
      if (this.labelPlacementActive() || this.activeHandler) return;
      this.pickVertexAt(e.latlng);
    };
    this.map.on('click', this.pickClickHandler);
  }

  setCoordinateDecimals(decimals: number): void {
    this.coordinateDecimals.set(Math.max(4, Math.min(12, decimals)));
  }

  clearSelection(): void {
    this.selection.set(null);
    this.removeSelectionHighlight();
  }

  pickVertexAt(latlng: L.LatLng): boolean {
    if (!this.map || !this.drawnItems) return false;

    const layers: L.Layer[] = [];
    this.drawnItems.eachLayer((l) => layers.push(l));
    const hit = findNearestVertex(latlng, this.map, layers);
    if (!hit) {
      this.clearSelection();
      return false;
    }

    const stamp = layerStamp(hit.layer);
    const sel: GisVertexSelection = {
      layerStamp: stamp,
      kind: hit.kind,
      vertexIndex: hit.vertexIndex,
      lat: hit.latlng.lat,
      lng: hit.latlng.lng,
      featureLabel: gisVertexFeatureLabel(hit.kind, hit.vertexIndex)
    };
    this.selection.set(sel);
    this.showSelectionHighlight(hit.latlng);
    return true;
  }

  updateSelectionCoordinates(lat: number, lng: number): boolean {
    const sel = this.selection();
    if (!sel || !this.drawnItems) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

    const layer = this.findLayerByStamp(sel.layerStamp);
    if (!layer) {
      this.clearSelection();
      return false;
    }

    const latlng = L.latLng(lat, lng);
    if (layer instanceof L.Marker) {
      layer.setLatLng(latlng);
    } else if (layer instanceof L.Polyline) {
      const verts = sketchVertices(layer).map((v, i) =>
        i === sel.vertexIndex ? latlng : L.latLng(v.lat, v.lng)
      );
      if (layer instanceof L.Polygon) {
        layer.setLatLngs([verts]);
      } else {
        layer.setLatLngs(verts);
      }
    } else {
      return false;
    }

    this.selection.set({ ...sel, lat, lng });
    this.showSelectionHighlight(latlng);
    this.refreshLayerDecorations(layer);
    this.onGeometryChange?.('update');
    return true;
  }

  private findLayerByStamp(stamp: number): L.Layer | null {
    if (!this.drawnItems) return null;
    let found: L.Layer | null = null;
    this.drawnItems.eachLayer((layer) => {
      if (layerStamp(layer) === stamp) found = layer;
    });
    return found;
  }

  private showSelectionHighlight(latlng: L.LatLng): void {
    if (!this.map || !this.annotations) return;
    this.removeSelectionHighlight();
    this.selectionHighlight = L.circleMarker(latlng, {
      radius: 10,
      color: '#22d3ee',
      weight: 3,
      fillColor: '#06b6d4',
      fillOpacity: 0.35,
      className: 'gis-selection-highlight',
      interactive: false
    }).addTo(this.annotations);
    this.selectionHighlight.bringToFront();
  }

  private removeSelectionHighlight(): void {
    if (this.selectionHighlight && this.annotations) {
      this.annotations.removeLayer(this.selectionHighlight);
    }
    this.selectionHighlight = null;
  }

  private setEditCursorActive(active: boolean): void {
    this.map?.getContainer().classList.toggle('gis-edit-active', active);
  }

  stopEditMode(): void {
    this.unbindEditLiveRefresh();
    this.activeEditHandler?.disable();
    this.activeEditHandler = null;
    this.setEditCursorActive(false);
  }

  setLineStyle(style: Partial<GisLineStyle>): void {
    this.lineStyle.update((current) => ({ ...current, ...style }));
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
    this.stopEditMode();
    this.cancelDraw();

    const style = this.lineStyle();
    const shapeOptions: L.PathOptions = {
      color: style.color,
      weight: style.weight,
      fillColor: style.color,
      fillOpacity: 0.25,
      lineCap: 'round',
      lineJoin: 'round'
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
    this.map.getContainer().classList.add('gis-draw-active');
  }

  cancelDraw(): void {
    this.activeHandler?.disable();
    this.activeHandler = null;
    this.map?.getContainer().classList.remove('gis-draw-active');
  }

  clearAll(): void {
    this.clearSelection();
    this.drawnItems?.clearLayers();
    this.annotations?.clearLayers();
    this.onGeometryChange?.('delete');
  }

  deleteSelected(): void {
    if (!this.drawnItems) return;
    const layers: L.Layer[] = [];
    this.drawnItems.eachLayer((layer) => layers.push(layer));
    const last = layers[layers.length - 1];
    if (last) {
      if (this.selection()?.layerStamp === layerStamp(last)) {
        this.clearSelection();
      }
      this.removeLayerDecorations(last);
      this.drawnItems.removeLayer(last);
      this.onGeometryChange?.('delete');
    }
  }

  enableEditMode(): void {
    if (!this.map || !this.drawnItems) return;
    this.stopLabelPlacement();
    this.activeHandler?.disable();
    this.activeHandler = null;
    this.stopEditMode();
    const Edit = (L as typeof L & { EditToolbar: { Edit: new (...args: unknown[]) => { enable: () => void } } })
      .EditToolbar.Edit;
    const handler = new Edit(this.map, { featureGroup: this.drawnItems });
    handler.enable();
    this.activeEditHandler = handler;
    this.setEditCursorActive(true);
    this.bindEditLiveRefresh();
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
        const color =
          typeof props?.['strokeColor'] === 'string' ? (props['strokeColor'] as string) : style.color;
        const weight =
          typeof props?.['strokeWeight'] === 'number' ? (props['strokeWeight'] as number) : style.weight;
        return {
          color,
          weight,
          fillColor: color,
          fillOpacity: 0.25
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
        const meta: GisSketchMeta = {
          strokeColor:
            typeof props?.['strokeColor'] === 'string' ? (props['strokeColor'] as string) : style.color,
          strokeWeight:
            typeof props?.['strokeWeight'] === 'number' ? (props['strokeWeight'] as number) : style.weight,
          labels: labelsFromProperties(props?.['labels'])
        };
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
          setSketchMeta(layer, meta);
          applyStrokeStyle(layer, meta);
          this.bindLayerPick(layer);
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
          labels: meta.labels
        };
      }
      features.push(feature);
    });
    return { type: 'FeatureCollection', features } as GeoJsonFeatureCollection;
  }

  invalidateSize(): void {
    this.map?.invalidateSize({ animate: false });
  }

  private syncSelectionFromLayer(layer: L.Layer): void {
    const sel = this.selection();
    if (!sel || layerStamp(layer) !== sel.layerStamp) return;
    const verts = sketchVertices(layer);
    const v = verts[sel.vertexIndex];
    if (!v) {
      this.clearSelection();
      return;
    }
    this.selection.set({ ...sel, lat: v.lat, lng: v.lng });
    this.showSelectionHighlight(v);
  }

  destroy(): void {
    this.stopLabelPlacement();
    this.clearSelection();
    this.unbindEditLiveRefresh();
    if (this.map && this.pickClickHandler) {
      this.map.off('click', this.pickClickHandler);
      this.pickClickHandler = null;
    }
    this.stopEditMode();
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
    const style = this.lineStyle();
    return {
      strokeColor: style.color,
      strokeWeight: style.weight,
      labels: []
    };
  }

  private registerSketchLayer(layer: L.Layer): void {
    this.attachSketchMeta(layer);
    this.bindLayerPick(layer);
  }

  private attachSketchMeta(layer: L.Layer): void {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
      const meta = this.createDefaultMeta();
      setSketchMeta(layer, meta);
      applyStrokeStyle(layer, meta);
    }
  }

  private bindLayerPick(layer: L.Layer): void {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      layer.off('click', this.onSketchLayerClick);
      layer.on('click', this.onSketchLayerClick);
    }
  }

  private bindEditLiveRefresh(): void {
    if (this.editLiveRefreshBound || !this.drawnItems) return;
    this.editLiveRefreshBound = true;
    this.drawnItems.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        layer.off('editdrag', this.onPolyEditDrag);
        layer.on('editdrag', this.onPolyEditDrag);
      }
      if (layer instanceof L.Marker) {
        layer.off('drag', this.onMarkerDrag);
        layer.on('drag', this.onMarkerDrag);
      }
    });
  }

  private unbindEditLiveRefresh(): void {
    if (!this.editLiveRefreshBound || !this.drawnItems) return;
    this.editLiveRefreshBound = false;
    this.drawnItems.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        layer.off('editdrag', this.onPolyEditDrag);
      }
      if (layer instanceof L.Marker) {
        layer.off('drag', this.onMarkerDrag);
      }
    });
  }

  private refreshLayerDecorations(layer: L.Layer): void {
    if (!this.map || !this.annotations) return;
    this.removeLayerDecorations(layer);

    if (!(layer instanceof L.Polyline)) return;
    const meta = getSketchMeta(layer);
    if (!meta) return;

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
    console.group(`[Project GIS Planner] ${action}`);
    console.log(JSON.stringify(gj, null, 2));
    console.groupEnd();
  }
}
