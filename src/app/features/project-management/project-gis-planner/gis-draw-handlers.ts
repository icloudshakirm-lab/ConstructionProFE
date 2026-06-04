import * as L from 'leaflet';
import 'leaflet-draw';
import {
  buildAngleTooltipSubtext,
  getDrawAngleInfo,
  guideBearingsFromVertex,
  snapDrawLatLng
} from './gis-draw-angle.util';
import { gisDrawAngleSettings } from './gis-draw-settings';

/** leaflet-draw handlers use private methods not in @types/leaflet-draw */
type DrawHandlerInternal = {
  _markers: L.Marker[];
  _map: L.DrawMap;
  _currentLatLng?: L.LatLng;
  _mouseMarker: L.Marker;
  _angleGuides?: L.LayerGroup;
  _angleLabel?: L.Marker;
  _updateTooltip: (latlng: L.LatLng) => void;
  _updateGuide: (pos: L.Point) => void;
  _getTooltipText: () => { text: string; subtext?: string };
  _getMeasurementString?: () => string;
  addHooks: () => void;
  removeHooks: () => void;
  _onMouseMove: (e: L.LeafletMouseEvent) => void;
};

type DrawHandlerClass = {
  extend: (props: Record<string, unknown>) => DrawHandlerConstructor;
  prototype: DrawHandlerInternal;
};

type DrawHandlerConstructor = new (
  map: L.DrawMap,
  options?: L.PolylineOptions & {
    shapeOptions?: L.PathOptions;
    showLength?: boolean;
    showArea?: boolean;
    metric?: boolean;
  }
) => { enable: () => void; disable: () => void };

function asDrawClass(handler: typeof L.Draw.Polyline): DrawHandlerClass {
  return handler as unknown as DrawHandlerClass;
}

function markerLatLngs(handler: DrawHandlerInternal): L.LatLng[] {
  return handler._markers.map((m) => m.getLatLng());
}

function updateAngleGuides(handler: DrawHandlerInternal, cursor: L.LatLng): void {
  if (!handler._map || !handler._angleGuides || handler._markers.length === 0) return;

  handler._angleGuides.clearLayers();
  const lockAngles = gisDrawAngleSettings.lockAngles;
  const last = handler._markers[handler._markers.length - 1].getLatLng();
  const origin = handler._map.latLngToLayerPoint(last);
  const guideLenPx = 72;

  const prev =
    handler._markers.length >= 2
      ? handler._markers[handler._markers.length - 2].getLatLng()
      : undefined;
  if (lockAngles) {
    const bearings = guideBearingsFromVertex(prev, last, handler._map);
    for (const bearing of bearings) {
    const rad = (bearing * Math.PI) / 180;
    const end = L.point(
      origin.x + Math.sin(rad) * guideLenPx,
      origin.y - Math.cos(rad) * guideLenPx
    );
    const endLatLng = handler._map.layerPointToLatLng(end);
    L.polyline([last, endLatLng], {
      color: '#38bdf8',
      weight: 1,
      opacity: 0.5,
      dashArray: '4,6',
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(handler._angleGuides);
    }
  }

  const info = getDrawAngleInfo(markerLatLngs(handler), cursor, handler._map, lockAngles);
  if (info && handler._angleLabel) {
    const label = info.deflectionLabel
      ? `${info.deflectionLabel} · ${info.bearingLabel}`
      : info.bearingLabel;
    handler._angleLabel.setLatLng(cursor);
    handler._angleLabel.setIcon(
      L.divIcon({
        className: 'gis-angle-label',
        html: `<span>${label}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 28]
      })
    );
  }
}

function appendAngleSubtext(
  handler: DrawHandlerInternal,
  base: { text: string; subtext?: string }
): { text: string; subtext?: string } {
  if (!handler._map || !handler._currentLatLng || handler._markers.length === 0) {
    return base;
  }
  const angleSub = buildAngleTooltipSubtext(
    getDrawAngleInfo(
      markerLatLngs(handler),
      handler._currentLatLng,
      handler._map,
      gisDrawAngleSettings.lockAngles
    )
  );
  if (!angleSub) return base;
  const parts = [base.subtext, angleSub].filter((p) => p && p.length > 0);
  return { ...base, subtext: parts.join('<br/>') };
}

function angleDrawExtensions(Base: DrawHandlerClass): DrawHandlerClass {
  return Base.extend({
    addHooks(this: DrawHandlerInternal) {
      Base.prototype.addHooks.call(this);
      if (this._map) {
        this._map.dragging.disable();
        this._map.getContainer().classList.add('gis-draw-active');
        this._angleGuides = L.layerGroup().addTo(this._map);
        this._angleLabel = L.marker(this._map.getCenter(), {
          icon: L.divIcon({ className: 'gis-angle-label', html: '' }),
          interactive: false,
          zIndexOffset: 2500
        }).addTo(this._map);
      }
    },

    removeHooks(this: DrawHandlerInternal) {
      Base.prototype.removeHooks.call(this);
      if (this._map) {
        this._map.getContainer().classList.remove('gis-draw-active');
        if (!this._map.dragging.enabled()) {
          this._map.dragging.enable();
        }
      }
      if (this._angleGuides) {
        this._map?.removeLayer(this._angleGuides);
        this._angleGuides = undefined;
      }
      if (this._angleLabel) {
        this._map?.removeLayer(this._angleLabel);
        this._angleLabel = undefined;
      }
    },

    _onMouseMove(this: DrawHandlerInternal, e: L.LeafletMouseEvent) {
      if (!this._map || this._markers.length === 0) {
        Base.prototype._onMouseMove.call(this, e);
        return;
      }

      const newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
      let latlng = this._map.layerPointToLatLng(newPos);
      const prev =
        this._markers.length >= 2
          ? this._markers[this._markers.length - 2].getLatLng()
          : undefined;
      if (gisDrawAngleSettings.lockAngles) {
        latlng = snapDrawLatLng(
          this._markers[this._markers.length - 1].getLatLng(),
          latlng,
          this._map,
          prev,
          true
        );
      }

      this._currentLatLng = latlng;
      this._updateTooltip(latlng);
      this._updateGuide(this._map.latLngToLayerPoint(latlng));
      this._mouseMarker.setLatLng(latlng);
      updateAngleGuides(this, latlng);
    },

    _getTooltipText(this: DrawHandlerInternal) {
      const base = Base.prototype._getTooltipText.call(this);
      return appendAngleSubtext(this, base);
    }
  }) as unknown as DrawHandlerClass;
}

const GisDrawPolylineClass = angleDrawExtensions(asDrawClass(L.Draw.Polyline));
const GisDrawPolygonClass = angleDrawExtensions(asDrawClass(L.Draw.Polygon)).extend({
  _getTooltipText(this: DrawHandlerInternal) {
    let text: string;
    let subtext: string | undefined;

    if (this._markers.length === 0) {
      text = L.drawLocal.draw.handlers.polygon.tooltip.start;
    } else if (this._markers.length < 3) {
      text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
      subtext = this._getMeasurementString?.() ?? '';
    } else {
      text = L.drawLocal.draw.handlers.polygon.tooltip.end;
      subtext = this._getMeasurementString?.() ?? '';
    }

    return appendAngleSubtext(this, { text, subtext });
  }
}) as unknown as DrawHandlerClass;

/** Polyline draw with angle labels, guide rays, and 45°/90° snapping. */
export const GisDrawPolyline = GisDrawPolylineClass as unknown as DrawHandlerConstructor;

/** Polygon draw with the same angle assistance as lines. */
export const GisDrawPolygon = GisDrawPolygonClass as unknown as DrawHandlerConstructor;
