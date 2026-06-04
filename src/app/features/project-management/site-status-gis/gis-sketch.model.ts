import type { SiteProgressStatus } from './site-progress.model';

/** Stroke + labels + road progress stored on each drawn vector layer. */
export interface GisSketchMeta {
  strokeColor: string;
  strokeWeight: number;
  labels: GisLineLabel[];
  progressStatus?: SiteProgressStatus;
}

export interface GisLineLabel {
  id: string;
  lat: number;
  lng: number;
  text: string;
  /** When false, only the on-line Show control is rendered. */
  visible?: boolean;
}

export interface GisLineStyle {
  color: string;
  weight: number;
}

export const GIS_LINE_COLOR_PRESETS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Black', value: '#0f172a' },
  { label: 'Cyan', value: '#0891b2' }
] as const;

export const GIS_LINE_WEIGHT_OPTIONS = [
  { label: 'Thin (2px)', value: 2 },
  { label: 'Normal (3px)', value: 3 },
  { label: 'Medium (5px)', value: 5 },
  { label: 'Thick (8px)', value: 8 }
] as const;

export const DEFAULT_GIS_LINE_STYLE: GisLineStyle = {
  color: '#2563eb',
  weight: 3
};
