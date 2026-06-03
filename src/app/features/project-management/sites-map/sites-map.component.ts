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
import { Image } from 'primeng/image';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { ThemeService } from '../../../core/services/theme.service';
import {
  ALL_SITE_MARKERS,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_TILES,
  PROJECT_FILTER_OPTIONS,
  SiteMapMarker,
  getSitePhotoCatalog,
  progressMarkerColor,
  projectStatusSeverity
} from './sites-map.data';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

@Component({
  selector: 'app-sites-map',
  imports: [FormsModule, Breadcrumb, Button, Card, Image, Select, Tag],
  templateUrl: './sites-map.component.html',
  styleUrl: './sites-map.component.scss'
})
export class SitesMapComponent implements AfterViewInit, OnDestroy {
  private static readonly MIN_PANEL_HEIGHT = 280;
  private static readonly MAX_PANEL_HEIGHT = 880;
  private static readonly DEFAULT_PANEL_HEIGHT = 480;

  private readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapPanel', { static: true }) mapPanel!: ElementRef<HTMLDivElement>;
  @ViewChild('mapFullscreenHost', { static: true }) mapFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly projectFilterOptions = PROJECT_FILTER_OPTIONS;
  readonly projectFilter = signal('all');
  readonly selectedMarkerId = signal<string | null>(ALL_SITE_MARKERS[0]?.id ?? null);
  readonly panelHeight = signal(SitesMapComponent.DEFAULT_PANEL_HEIGHT);
  readonly isFullscreen = signal(false);
  readonly isResizing = signal(false);

  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mapReady = false;
  private resizeCleanup?: () => void;
  private resizeRaf = 0;
  private readonly onFullscreenChange = (): void => {
    const host = this.mapFullscreenHost?.nativeElement;
    const active = !!host && document.fullscreenElement === host;
    this.isFullscreen.set(active);
    requestAnimationFrame(() => this.invalidateMapSize());
  };

  readonly filteredMarkers = computed(() => {
    const filter = this.projectFilter();
    if (filter === 'all') return ALL_SITE_MARKERS;
    return ALL_SITE_MARKERS.filter((m) => m.projectId === filter);
  });

  readonly selectedMarker = computed(() => {
    const id = this.selectedMarkerId();
    return ALL_SITE_MARKERS.find((m) => m.id === id) ?? null;
  });

  readonly selectedSitePhotos = computed(() => {
    const marker = this.selectedMarker();
    return marker ? getSitePhotoCatalog(marker.siteId) : [];
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
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
    }

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

    effect(() => {
      const isDark = this.themeService.theme() === 'dark';
      if (this.mapReady) {
        this.applyMapTheme(isDark);
      }
    });

    effect(() => {
      if (!this.mapReady) return;
      this.panelHeight();
      this.isFullscreen();
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.invalidateMapSize());
    });
  }

  ngAfterViewInit(): void {
    this.fixDefaultIcons();
    this.initMap();
    this.mapReady = true;
    this.renderMarkers(this.filteredMarkers());

    this.resizeObserver = new ResizeObserver(() => this.invalidateMapSize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
    this.resizeObserver.observe(this.mapFullscreenHost.nativeElement);
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.teardownResize();
    this.resizeObserver?.disconnect();
    this.map?.remove();
    this.map = null;
  }

  statusSeverity(status: SiteMapMarker['projectStatus']) {
    return projectStatusSeverity(status);
  }

  photoCount(siteId: string): number {
    return getSitePhotoCatalog(siteId).length;
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

  async toggleFullscreen(): Promise<void> {
    const host = this.mapFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      await host.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  }

  startResize(event: MouseEvent): void {
    if (this.isFullscreen() || typeof window === 'undefined') return;

    event.preventDefault();
    event.stopPropagation();
    this.teardownResize();

    const panel = this.mapPanel.nativeElement;
    const startY = event.clientY;
    const startHeight = panel.offsetHeight;

    this.isResizing.set(true);
    document.body.classList.add('sites-map-page--resizing');

    const onMove = (moveEvent: MouseEvent): void => {
      const maxHeight = Math.min(SitesMapComponent.MAX_PANEL_HEIGHT, window.innerHeight - 160);
      this.panelHeight.set(
        clamp(startHeight + (moveEvent.clientY - startY), SitesMapComponent.MIN_PANEL_HEIGHT, maxHeight)
      );
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.invalidateMapSize());
    };

    const onUp = (): void => {
      this.teardownResize();
      this.invalidateMapSize();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this.resizeCleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }

  private teardownResize(): void {
    cancelAnimationFrame(this.resizeRaf);
    this.resizeCleanup?.();
    this.resizeCleanup = undefined;
    this.isResizing.set(false);
    document.body.classList.remove('sites-map-page--resizing');
  }

  private invalidateMapSize(): void {
    this.map?.invalidateSize({ animate: false });
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
    const isDark = this.themeService.isDark();
    this.mapContainer.nativeElement.classList.toggle('sites-map-page__map--dark', isDark);

    this.map = L.map(this.mapContainer.nativeElement, {
      center: MAP_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      scrollWheelZoom: true
    });

    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  private createTileLayer(isDark: boolean): L.TileLayer {
    const config = isDark ? MAP_TILES.dark : MAP_TILES.light;
    return L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution
    });
  }

  private applyMapTheme(isDark: boolean): void {
    if (!this.map || !this.tileLayer) return;

    this.mapContainer.nativeElement.classList.toggle('sites-map-page__map--dark', isDark);
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.tileLayer.bringToBack();
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
    const photoCount = getSitePhotoCatalog(m.siteId).length;
    return `
      <div class="sites-map-popup">
        <strong>${m.siteName}</strong>
        <div>${m.projectName}</div>
        <div>Progress: ${m.progressPct}% · ${m.locationLabel}</div>
        <div>Superintendent: ${m.superintendent}</div>
        <div>${photoCount} site photos in catalog</div>
      </div>
    `;
  }
}
