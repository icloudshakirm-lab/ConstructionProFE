import type { GisLineLabel } from './gis-sketch.model';
import type { GeoJsonFeatureCollection } from './map-gis.service';

const GEOMETRY_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection'
]);

export class GisGeoJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GisGeoJsonParseError';
  }
}

/** Parse file text and normalize to a FeatureCollection. */
export function parseGeoJsonText(text: string): GeoJsonFeatureCollection {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new GisGeoJsonParseError('File is empty.');
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new GisGeoJsonParseError('File is not valid JSON.');
  }

  return normalizeGeoJson(data);
}

export function normalizeGeoJson(data: unknown): GeoJsonFeatureCollection {
  if (!data || typeof data !== 'object') {
    throw new GisGeoJsonParseError('Root value must be a GeoJSON object.');
  }

  const root = data as Record<string, unknown>;
  const type = root['type'];

  if (type === 'FeatureCollection') {
    if (!Array.isArray(root['features'])) {
      throw new GisGeoJsonParseError('FeatureCollection must include a features array.');
    }
    return root as unknown as GeoJsonFeatureCollection;
  }

  if (type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [root as unknown as GeoJSON.Feature]
    } as GeoJsonFeatureCollection;
  }

  if (typeof type === 'string' && GEOMETRY_TYPES.has(type)) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: root as unknown as GeoJSON.Geometry,
          properties: {}
        }
      ]
    } as GeoJsonFeatureCollection;
  }

  throw new GisGeoJsonParseError(
    'Expected FeatureCollection, Feature, or a geometry object (Point, LineString, Polygon, etc.).'
  );
}

export function labelsFromProperties(raw: unknown): GisLineLabel[] {
  if (!Array.isArray(raw)) return [];
  const labels: GisLineLabel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const text = typeof row['text'] === 'string' ? row['text'] : '';
    const lat = typeof row['lat'] === 'number' ? row['lat'] : NaN;
    const lng = typeof row['lng'] === 'number' ? row['lng'] : NaN;
    if (!text || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    labels.push({
      id: typeof row['id'] === 'string' ? row['id'] : `import-${labels.length}`,
      lat,
      lng,
      text,
      visible: row['visible'] === false ? false : true
    });
  }
  return labels;
}
