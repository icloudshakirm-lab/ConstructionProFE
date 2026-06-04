/** GeoJSON types shared by GIS planner (Leaflet export). */
export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{ type: string; geometry: unknown; properties?: Record<string, unknown> }>;
}
