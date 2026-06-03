import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  ALL_SITE_MARKERS,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  PROJECT_FILTER_OPTIONS,
  SiteMapMarker,
  progressMarkerColor,
  projectStatusSeverity
} from './sites-map.data';

@Component({
  selector: 'app-sites-map',
  imports: [FormsModule, Breadcrumb, Button, Card, Select, Tag],
  templateUrl: './sites-map.component.html',
  styleUrl: './sites-map.component.scss'
})
export class SitesMapComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly projectFilter = signal('all');
  readonly selectedMarkerId = signal<string | null>(ALL_SITE_MARKERS[0]?.id ?? null);

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mapReady = false;

  readonly filteredMarkers = computed(() => {
    const filter = this.projectFilter();
    if (filter === 'all') return ALL_SITE_MARKERS;
    return ALL_SITE_MARKERS.filter((m) => m.projectId === filter);
  });

  readonly selectedMarker = computed(() => {
    const id = this.selectedMarkerId();
    return ALL_SITE_MARKERS.find((m) => m.id === id) ?? null;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Construction Sites Map' });
    return items;
  });

  constructor() {
    effect(() => {
      const markers = this.filteredMarkers();
      if (this.mapReady) {
        this.renderMarkers(markers);
      }
      const selected = this.selectedMarkerId();
      if (selected && !markers.some((m) => m.id === selected)) {
        this.selectedMarkerId.set(markers[0]?.id ?? null);
      }
    });
  }

  ngAfterViewInit(): void {
    this.fixDefaultIcons();
    this.initMap();
    this.mapReady = true;
    this.renderMarkers(this.filteredMarkers());

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
    this.map = null;
  }

  statusSeverity(status: SiteMapMarker['projectStatus']) {
    return projectStatusSeverity(status);
  }

  selectMarker(marker: SiteMapMarker): void {
    this.selectedMarkerId.set(marker.id);
    if (!this.map) return;
    this.map.setView([marker.lat, marker.lng], 14, { animate: true });
    this.openPopupFor(marker.id);
  }

  fitAllSites(): void {
    const markers = this.filteredMarkers();
    if (!this.map || !markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    this.map.fitBounds(bounds.pad(0.15));
  }

  private fixDefaultIcons(): void {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'leaflet-images/marker-icon-2x.png',
      iconUrl: 'leaflet-images/marker-icon.png',
      shadowUrl: 'leaflet-images/marker-shadow.png'
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: MAP_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  private renderMarkers(markers: SiteMapMarker[]): void {
    if (!this.map || !this.markerLayer) return;

    this.markerLayer.clearLayers();

    for (const marker of markers) {
      const color = progressMarkerColor(marker.progressPct);
      const icon = L.divIcon({
        className: 'sites-map-marker',
        html: `<span class="sites-map-marker__dot" style="background:${color}"></span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(this.popupHtml(marker), { maxWidth: 280 })
        .addTo(this.markerLayer);

      leafletMarker.on('click', () => this.selectedMarkerId.set(marker.id));
      leafletMarker.on('popupopen', () => this.selectedMarkerId.set(marker.id));

      if (marker.id === this.selectedMarkerId()) {
        setTimeout(() => leafletMarker.openPopup(), 0);
      }
    }

    if (markers.length) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      this.map.fitBounds(bounds.pad(0.12));
    }
  }

  private openPopupFor(markerId: string): void {
    if (!this.markerLayer) return;
    this.markerLayer.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        const match = this.filteredMarkers().find(
          (m) => m.id === markerId && m.lat === latLng.lat && m.lng === latLng.lng
        );
        if (match) layer.openPopup();
      }
    });
  }

  private popupHtml(m: SiteMapMarker): string {
    return `
      <div class="sites-map-popup">
        <strong>${m.siteName}</strong>
        <div>${m.projectName}</div>
        <div>Progress: ${m.progressPct}% · ${m.locationLabel}</div>
        <div>Superintendent: ${m.superintendent}</div>
      </div>
    `;
  }
}
