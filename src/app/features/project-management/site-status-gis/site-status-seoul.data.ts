import type { GeoJsonFeatureCollection } from './map-gis.service';
import {
  SITE_PROGRESS_STATUSES,
  getProgressDefinition,
  type SiteProgressStatus
} from './site-progress.model';

const SEOUL_ROADS_URL = '/data/site-status-gis/roads-seoul.geojson';

/** Seoul road sample (OpenStreetMap) — Yongsan / Itaewon area. */
export const SEOUL_SITE_STATUS_VIEW = {
  center: [37.5262, 126.9855] as [number, number],
  zoom: 15
};

type RawFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: { type: string; coordinates?: number[][] };
};

type RawCollection = {
  type: string;
  features?: RawFeature[];
};

function lineMidpoint(coords: number[][]): { lat: number; lng: number } | null {
  if (!coords.length) return null;
  const [lng, lat] = coords[Math.floor(coords.length / 2)];
  return { lat, lng };
}

function assignStatus(index: number): SiteProgressStatus {
  return SITE_PROGRESS_STATUSES[index % SITE_PROGRESS_STATUSES.length].id;
}

/** Turn OSM road LineStrings into progress-layer features (excavation, backfill, pipe, etc.). */
export function enrichSeoulRoadFeatures(raw: RawCollection): GeoJsonFeatureCollection {
  const lineFeatures = (raw.features ?? []).filter(
    (f) => f.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)
  );

  const features = lineFeatures.map((feature, index) => {
    const status = assignStatus(index);
    const def = getProgressDefinition(status);
    const coords = feature.geometry!.coordinates as number[][];
    const mid = lineMidpoint(coords);
    const props = feature.properties ?? {};
    const roadName =
      typeof props['name'] === 'string' && props['name'].trim()
        ? props['name'].trim()
        : typeof props['@id'] === 'string'
          ? props['@id']
          : `Road ${index + 1}`;
    const highway = typeof props['highway'] === 'string' ? props['highway'] : '';

    return {
      type: 'Feature',
      properties: {
        ...props,
        progressStatus: status,
        strokeColor: def.color,
        strokeWeight: def.weight,
        roadName,
        highway,
        demo: true,
        source: 'roads-seoul',
        labels: mid
          ? [
              {
                id: `seoul-${index}-${status}`,
                lat: mid.lat,
                lng: mid.lng,
                text: def.shortLabel,
                visible: true
              }
            ]
          : []
      },
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    };
  });

  return { type: 'FeatureCollection', features } as GeoJsonFeatureCollection;
}

export async function loadSeoulRoadsProgressCollection(): Promise<GeoJsonFeatureCollection> {
  const response = await fetch(SEOUL_ROADS_URL);
  if (!response.ok) {
    throw new Error(`Could not load Seoul roads (${response.status}).`);
  }
  const raw = (await response.json()) as RawCollection;
  return enrichSeoulRoadFeatures(raw);
}
