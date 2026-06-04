export type GisGeometryKind = 'point' | 'polyline' | 'polygon';

export interface GisVertexSelection {
  layerStamp: number;
  kind: GisGeometryKind;
  vertexIndex: number;
  lat: number;
  lng: number;
  featureLabel: string;
}

export const GIS_COORD_PRECISION_OPTIONS: { label: string; value: number; hint: string }[] = [
  { label: 'Standard (~1 m)', value: 5, hint: '5 decimal places' },
  { label: 'High (~0.1 m)', value: 6, hint: '6 decimal places' },
  { label: 'Survey (~1 cm)', value: 7, hint: '7 decimal places' },
  { label: 'Maximum (~1 mm)', value: 8, hint: '8 decimal places' }
];

export function formatGisCoordinate(value: number, decimals: number): string {
  return value.toFixed(Math.max(0, Math.min(12, decimals)));
}

export function gisVertexFeatureLabel(kind: GisGeometryKind, vertexIndex: number): string {
  switch (kind) {
    case 'point':
      return 'Point';
    case 'polyline':
      return `Line · vertex ${vertexIndex + 1}`;
    case 'polygon':
      return `Polygon · vertex ${vertexIndex + 1}`;
  }
}
