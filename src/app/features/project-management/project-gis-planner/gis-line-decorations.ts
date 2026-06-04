import * as L from 'leaflet';
import type { GisGeometryKind } from './gis-selection.model';
import type { GisLineLabel, GisSketchMeta } from './gis-sketch.model';

type LabelMarker = L.Marker & { gisParent?: number; gisRole?: string; gisLabelId?: string };

export const GIS_META_KEY = 'gisMeta';

export type AnnotatedLayer = L.Layer & {
  [GIS_META_KEY]?: GisSketchMeta;
  setStyle?: (style: L.PathOptions) => AnnotatedLayer;
  getLatLngs?: () => L.LatLng[] | L.LatLng[][];
  toGeoJSON?: () => GeoJSON.Feature;
};

export function getSketchMeta(layer: L.Layer): GisSketchMeta | undefined {
  return (layer as AnnotatedLayer)[GIS_META_KEY];
}

export function setSketchMeta(layer: L.Layer, meta: GisSketchMeta): void {
  (layer as AnnotatedLayer)[GIS_META_KEY] = meta;
}

export function layerStamp(layer: L.Layer): number {
  return L.Util.stamp(layer);
}

/** Closed ring coordinates for polyline or polygon outline. */
export function outlineVertices(layer: L.Layer): L.LatLng[] {
  if (!(layer instanceof L.Polyline)) return [];
  const latlngs = layer.getLatLngs();
  if (!latlngs.length) return [];

  const first = latlngs[0];
  if (first instanceof L.LatLng) {
    const ring = latlngs as L.LatLng[];
    if (layer instanceof L.Polygon && ring.length > 2) {
      return [...ring, ring[0]];
    }
    return ring;
  }

  const ring = (latlngs as L.LatLng[][])[0] ?? [];
  if (layer instanceof L.Polygon && ring.length > 2) {
    return [...ring, ring[0]];
  }
  return ring;
}

export function segmentPairs(vertices: L.LatLng[]): [L.LatLng, L.LatLng][] {
  const pairs: [L.LatLng, L.LatLng][] = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    pairs.push([vertices[i], vertices[i + 1]]);
  }
  return pairs;
}

export function segmentLengthMeters(a: L.LatLng, b: L.LatLng, map: L.Map): number {
  return map.distance(a, b);
}

export function formatLengthMeters(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  if (meters >= 100) return `${Math.round(meters)} m`;
  return `${meters.toFixed(1)} m`;
}

export function segmentMidpoint(a: L.LatLng, b: L.LatLng): L.LatLng {
  return L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
}

export function createLengthMarker(
  latlng: L.LatLng,
  text: string,
  parentStamp: number,
  accentColor: string
): L.Marker {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'gis-segment-length',
      html: `<span style="border-color:${accentColor}">${text}</span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 14]
    }),
    interactive: false,
    zIndexOffset: 800
  });
}

export function createLabelMarker(
  latlng: L.LatLng,
  label: GisLineLabel,
  parentStamp: number,
  accentColor: string
): L.Marker {
  const visible = label.visible !== false;
  const marker = L.marker(latlng, {
    icon: L.divIcon({
      className: 'gis-line-label',
      html: `<div class="gis-line-label-wrap" data-label-id="${escapeHtml(label.id)}">
        ${
          visible
            ? `<span class="gis-line-label-text" style="border-color:${accentColor}">${escapeHtml(label.text)}</span>`
            : ''
        }
        <button type="button" class="gis-line-label-toggle" data-label-id="${escapeHtml(label.id)}">${
          visible ? 'Hide' : 'Show'
        }</button>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 18]
    }),
    interactive: true,
    zIndexOffset: 900
  });
  (marker as LabelMarker).gisParent = parentStamp;
  (marker as LabelMarker).gisRole = 'label';
  (marker as LabelMarker).gisLabelId = label.id;
  return marker;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function applyStrokeStyle(layer: L.Layer, meta: GisSketchMeta): void {
  if (!(layer instanceof L.Path)) return;
  const pathOpts: L.PathOptions = {
    color: meta.strokeColor,
    weight: meta.strokeWeight,
    lineCap: 'round',
    lineJoin: 'round'
  };
  if (layer instanceof L.Polygon) {
    pathOpts.fillColor = meta.strokeColor;
    pathOpts.fillOpacity = 0.2;
  }
  layer.setStyle(pathOpts);
}

export function buildSegmentLengthMarkers(
  layer: L.Layer,
  map: L.Map,
  meta: GisSketchMeta
): L.Marker[] {
  const vertices = outlineVertices(layer);
  if (vertices.length < 2) return [];

  const stamp = layerStamp(layer);
  return segmentPairs(vertices).map(([a, b]) => {
    const len = segmentLengthMeters(a, b, map);
    const text = formatLengthMeters(len);
    const mid = segmentMidpoint(a, b);
    const m = createLengthMarker(mid, text, stamp, meta.strokeColor);
    (m as LabelMarker).gisParent = stamp;
    (m as LabelMarker).gisRole = 'length';
    return m;
  });
}

export function buildUserLabelMarkers(layer: L.Layer, meta: GisSketchMeta): L.Marker[] {
  const stamp = layerStamp(layer);
  return meta.labels.map((label) =>
    createLabelMarker(L.latLng(label.lat, label.lng), label, stamp, meta.strokeColor)
  );
}

/** Vertices used for editing (no duplicate closing point on polygons). */
export function sketchVertices(layer: L.Layer): L.LatLng[] {
  if (layer instanceof L.Marker) {
    return [layer.getLatLng()];
  }
  if (!(layer instanceof L.Polyline)) return [];
  const latlngs = layer.getLatLngs();
  if (!latlngs.length) return [];
  const first = latlngs[0];
  if (first instanceof L.LatLng) {
    return latlngs as L.LatLng[];
  }
  return (latlngs as L.LatLng[][])[0] ?? [];
}

export function sketchGeometryKind(layer: L.Layer): GisGeometryKind | null {
  if (layer instanceof L.Marker) return 'point';
  if (layer instanceof L.Polygon) return 'polygon';
  if (layer instanceof L.Polyline) return 'polyline';
  return null;
}

export type VertexHit = {
  layer: L.Layer;
  vertexIndex: number;
  latlng: L.LatLng;
  kind: GisGeometryKind;
  distPx: number;
};

/** Closest point on segment ab to p (planar lat/lng). */
export function closestLatLngOnSegment(p: L.LatLng, a: L.LatLng, b: L.LatLng): L.LatLng {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = p.lng;
  const py = p.lat;
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return a;
  let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  return L.latLng(ay + t * aby, ax + t * abx);
}

function nearestVertexIndexToClick(verts: L.LatLng[], clickPt: L.Point, map: L.Map): number {
  let idx = 0;
  let min = Infinity;
  verts.forEach((v, i) => {
    const d = map.latLngToLayerPoint(v).distanceTo(clickPt);
    if (d < min) {
      min = d;
      idx = i;
    }
  });
  return idx;
}

/** Nearest marker or vertex; clicks on a line body snap to the closest vertex. */
export function findNearestVertex(
  latlng: L.LatLng,
  map: L.Map,
  layers: L.Layer[],
  options?: { maxVertexPx?: number; maxLinePx?: number }
): VertexHit | null {
  const maxVertexPx = options?.maxVertexPx ?? 44;
  const maxLinePx = options?.maxLinePx ?? 56;
  const clickPt = map.latLngToLayerPoint(latlng);
  let best: VertexHit | undefined;

  const consider = (hit: VertexHit): void => {
    if (best === undefined || hit.distPx < best.distPx) {
      best = hit;
    }
  };

  for (const layer of layers) {
    const kind = sketchGeometryKind(layer);
    if (!kind) continue;
    const verts = sketchVertices(layer);
    if (!verts.length) continue;

    verts.forEach((v, vertexIndex) => {
      const d = map.latLngToLayerPoint(v).distanceTo(clickPt);
      if (d <= maxVertexPx) {
        consider({ layer, vertexIndex, latlng: v, kind, distPx: d });
      }
    });

    if (kind !== 'point' && verts.length >= 2) {
      for (const [a, b] of segmentPairs(verts)) {
        const onLine = closestLatLngOnSegment(latlng, a, b);
        const d = map.latLngToLayerPoint(onLine).distanceTo(clickPt);
        if (d > maxLinePx) continue;
        const vertexIndex = nearestVertexIndexToClick(verts, clickPt, map);
        const v = verts[vertexIndex];
        consider({ layer, vertexIndex, latlng: v, kind, distPx: d });
      }
    }
  }

  return best ?? null;
}

/** Nearest segment across polyline/polygon layers for label placement. */
export function findNearestSegment(
  latlng: L.LatLng,
  map: L.Map,
  layers: L.Layer[]
): { layer: L.Layer; midpoint: L.LatLng; segmentIndex: number } | null {
  type SegmentHit = { layer: L.Layer; midpoint: L.LatLng; segmentIndex: number; dist: number };
  let best: SegmentHit | undefined;

  for (const layer of layers) {
    if (!(layer instanceof L.Polyline)) continue;
    const pairs = segmentPairs(outlineVertices(layer));
    pairs.forEach(([a, b], index) => {
      const mid = segmentMidpoint(a, b);
      const midPt = map.latLngToLayerPoint(mid);
      const clickPt = map.latLngToLayerPoint(latlng);
      const d = midPt.distanceTo(clickPt);
      if (best === undefined || d < best.dist) {
        best = { layer, midpoint: mid, segmentIndex: index, dist: d };
      }
    });
  }

  if (best === undefined || best.dist > 80) return null;
  return { layer: best.layer, midpoint: best.midpoint, segmentIndex: best.segmentIndex };
}

export function newLabelId(): string {
  return `lbl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
