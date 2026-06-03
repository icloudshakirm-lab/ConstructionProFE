import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { MAP_TILES } from '../sites-map/sites-map.data';
import type { GeoJsonFeatureCollection } from './map-gis.service';

export type SketchEventAction = 'create' | 'update' | 'delete';

@Injectable({ providedIn: 'root' })
export class LeafletGisService {
  private map: L.DrawMap | null = null;
  private tileLayer: L.TileLayer | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private drawControl: L.Control.Draw | null = null;
  private activeHandler: L.Draw.Marker | L.Draw.Polyline | L.Draw.Polygon | null = null;
  private onGeometryChange?: (action: SketchEventAction) => void;

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
    this.map.addLayer(this.drawnItems);

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
      this.drawnItems?.addLayer(e.layer);
      this.logLayer('create', e.layer);
      this.onGeometryChange?.('create');
    });

    this.map.on(L.Draw.Event.EDITED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Edited;
      e.layers.eachLayer((layer) => this.logLayer('update', layer));
      this.onGeometryChange?.('update');
    });

    this.map.on(L.Draw.Event.DELETED, (event: L.LeafletEvent) => {
      const e = event as L.DrawEvents.Deleted;
      e.layers.eachLayer((layer) => this.logLayer('delete', layer));
      this.onGeometryChange?.('delete');
    });
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
    this.cancelDraw();

    const shapeOptions: L.PathOptions = {
      color: '#2563eb',
      weight: 3,
      fillColor: '#3b82f6',
      fillOpacity: 0.25
    };

    switch (tool) {
      case 'point':
        this.activeHandler = new L.Draw.Marker(this.map, {
          icon: L.divIcon({
            className: 'gis-draw-marker',
            html: '<span></span>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        });
        break;
      case 'polyline':
        this.activeHandler = new L.Draw.Polyline(this.map, { shapeOptions });
        break;
      case 'polygon':
        this.activeHandler = new L.Draw.Polygon(this.map, { shapeOptions });
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
    this.onGeometryChange?.('delete');
  }

  deleteSelected(): void {
    if (!this.drawnItems) return;
    const layers: L.Layer[] = [];
    this.drawnItems.eachLayer((layer) => layers.push(layer));
    const last = layers[layers.length - 1];
    if (last) {
      this.drawnItems.removeLayer(last);
      this.onGeometryChange?.('delete');
    }
  }

  enableEditMode(): void {
    if (!this.map || !this.drawnItems) return;
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

  exportToGeoJSON(): GeoJsonFeatureCollection {
    const raw = this.drawnItems?.toGeoJSON() ?? { type: 'FeatureCollection', features: [] };
    return raw as GeoJsonFeatureCollection;
  }

  invalidateSize(): void {
    this.map?.invalidateSize({ animate: false });
  }

  destroy(): void {
    this.cancelDraw();
    this.map?.remove();
    this.map = null;
    this.tileLayer = null;
    this.drawnItems = null;
    this.drawControl = null;
    this.onGeometryChange = undefined;
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
