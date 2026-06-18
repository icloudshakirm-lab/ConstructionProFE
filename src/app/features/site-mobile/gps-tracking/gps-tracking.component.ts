import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { GpsTrackersApiService } from '../../../core/api/project-planning';
import { ThemeService } from '../../../core/services/theme.service';
import { MAP_TILES } from '../../project-management/sites-map/sites-map.data';
import {
  GPS_MAP_CENTER,
  GPS_MAP_ZOOM,
  GPS_PROJECT_OPTIONS,
  GPS_STATUS_OPTIONS,
  GPS_TYPE_OPTIONS,
  type GpsTracker,
  type GpsTrackerStatus,
  formatLastUpdate,
  gpsStatusColor,
  gpsStatusSeverity,
  gpsTypeLabel
} from './gps-tracking.data';

@Component({
  selector: 'app-gps-tracking',
  imports: [
    DatePipe,
    FormsModule,
    Breadcrumb,
    Button,
    Checkbox,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Select,
    TableModule,
    Tag
  ],
  templateUrl: './gps-tracking.component.html',
  styleUrl: './gps-tracking.component.scss'
})
export class GpsTrackingComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);
  private readonly gpsTrackersApi = inject(GpsTrackersApiService);

  readonly trackers = signal<GpsTracker[]>([]);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapFullscreenHost', { static: true }) mapFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly projectOptions = GPS_PROJECT_OPTIONS;
  readonly typeOptions = GPS_TYPE_OPTIONS;
  readonly statusOptions = GPS_STATUS_OPTIONS;

  readonly projectFilter = signal('all');
  readonly typeFilter = signal('all');
  readonly statusFilter = signal('all');
  readonly searchText = signal('');
  readonly showTrails = signal(true);
  readonly selectedId = signal<string | null>(null);
  readonly detailVisible = signal(false);
  readonly detailTracker = signal<GpsTracker | null>(null);
  readonly isFullscreen = signal(false);
  readonly lastRefreshed = signal(new Date());

  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private trailLayer: L.LayerGroup | null = null;
  private mapReady = false;

  private readonly onFullscreenChange = (): void => {
    const host = this.mapFullscreenHost?.nativeElement;
    this.isFullscreen.set(!!host && document.fullscreenElement === host);
    requestAnimationFrame(() => this.map?.invalidateSize({ animate: false }));
  };

  readonly filteredTrackers = computed(() => {
    const project = this.projectFilter();
    const type = this.typeFilter();
    const status = this.statusFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.trackers().filter((t) => {
      if (project !== 'all' && t.projectId !== project) return false;
      if (type !== 'all' && t.type !== type) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.deviceId.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q)
      );
    });
  });

  readonly selectedTracker = computed(() => {
    const id = this.selectedId();
    return this.trackers().find((t) => t.id === id) ?? null;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'GPS Tracking' });
    return items;
  });

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
    }

    effect(() => {
      const trackers = this.filteredTrackers();
      const selected = this.selectedId();
      const showTrails = this.showTrails();
      if (!this.mapReady) return;
      this.renderMap(trackers, selected, showTrails);
      if (selected && !trackers.some((t) => t.id === selected)) {
        this.selectedId.set(trackers[0]?.id ?? null);
      }
    });

    effect(() => {
      if (!this.mapReady) return;
      this.applyMapTheme(this.themeService.theme() === 'dark');
    });
  }

  ngOnInit(): void {
    this.gpsTrackersApi.list().subscribe({
      next: (data) => console.log('[GpsTracking] GET /gps-trackers', data),
      error: (err) => console.error('[GpsTracking] GET /gps-trackers failed', err)
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.mapReady = true;
    this.renderMap(this.filteredTrackers(), this.selectedId(), this.showTrails());
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.map?.remove();
    this.map = null;
  }

  statusSeverity(status: GpsTrackerStatus) {
    return gpsStatusSeverity(status);
  }

  typeLabel(type: GpsTracker['type']) {
    return gpsTypeLabel(type);
  }

  formatTime(iso: string) {
    return formatLastUpdate(iso);
  }

  onProjectFilter(value: string): void {
    this.projectFilter.set(value);
  }

  onTypeFilter(value: string): void {
    this.typeFilter.set(value);
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  selectTracker(tracker: GpsTracker): void {
    this.selectedId.set(tracker.id);
    this.map?.setView([tracker.lat, tracker.lng], 15, { animate: true });
    this.openPopupFor(tracker.id);
  }

  openDetail(tracker: GpsTracker): void {
    this.detailTracker.set(tracker);
    this.detailVisible.set(true);
    this.selectTracker(tracker);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  fitAll(): void {
    const trackers = this.filteredTrackers();
    if (!this.map || !trackers.length) return;
    const bounds = L.latLngBounds(trackers.map((t) => [t.lat, t.lng] as [number, number]));
    this.map.fitBounds(bounds.pad(0.15));
  }

  refreshPositions(): void {
    this.lastRefreshed.set(new Date());
    this.renderMap(this.filteredTrackers(), this.selectedId(), this.showTrails());
  }

  exportCsv(): void {
    const rows = this.filteredTrackers();
    const header = [
      'id',
      'name',
      'type',
      'role',
      'project',
      'status',
      'lat',
      'lng',
      'speedKph',
      'batteryPct',
      'lastUpdate',
      'deviceId'
    ];
    const lines = [
      header.join(','),
      ...rows.map((t) =>
        [
          t.id,
          `"${t.name.replace(/"/g, '""')}"`,
          t.type,
          `"${t.role.replace(/"/g, '""')}"`,
          `"${t.projectName.replace(/"/g, '""')}"`,
          t.status,
          t.lat,
          t.lng,
          t.speedKph,
          t.batteryPct,
          t.lastUpdate,
          t.deviceId
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-tracking-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async toggleFullscreen(): Promise<void> {
    const host = this.mapFullscreenHost?.nativeElement;
    if (!host || typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      await host.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  private initMap(): void {
    const isDark = this.themeService.isDark();
    this.mapContainer.nativeElement.classList.toggle('gps-tracking-page__map--dark', isDark);

    this.map = L.map(this.mapContainer.nativeElement, {
      center: GPS_MAP_CENTER,
      zoom: GPS_MAP_ZOOM,
      scrollWheelZoom: true
    });

    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.trailLayer = L.layerGroup().addTo(this.map);
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
    this.mapContainer.nativeElement.classList.toggle('gps-tracking-page__map--dark', isDark);
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.tileLayer.bringToBack();
  }

  private renderMap(trackers: GpsTracker[], selectedId: string | null, showTrails: boolean): void {
    if (!this.map || !this.markerLayer || !this.trailLayer) return;

    this.markerLayer.clearLayers();
    this.trailLayer.clearLayers();

    for (const t of trackers) {
      const color = gpsStatusColor(t.status);
      const isSelected = t.id === selectedId;
      const icon = L.divIcon({
        className: `gps-tracking-marker${isSelected ? ' gps-tracking-marker--selected' : ''}`,
        html: `<span class="gps-tracking-marker__ring" style="border-color:${color}"></span>
               <span class="gps-tracking-marker__dot" style="background:${color}"></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([t.lat, t.lng], { icon })
        .bindPopup(this.popupHtml(t), { maxWidth: 300 })
        .addTo(this.markerLayer);

      marker.on('click', () => this.selectedId.set(t.id));
      marker.on('popupopen', () => this.selectedId.set(t.id));

      if (showTrails && t.trail.length >= 2) {
        const isTrailSelected = t.id === selectedId;
        L.polyline(t.trail, {
          color: isTrailSelected ? color : '#64748b',
          weight: isTrailSelected ? 4 : 2,
          opacity: isTrailSelected ? 0.9 : 0.45,
          dashArray: isTrailSelected ? undefined : '6 8',
          lineCap: 'round'
        }).addTo(this.trailLayer);
      }
    }

    if (selectedId) {
      setTimeout(() => this.openPopupFor(selectedId), 0);
    }

    if (trackers.length && !selectedId) {
      const bounds = L.latLngBounds(trackers.map((t) => [t.lat, t.lng] as [number, number]));
      this.map.fitBounds(bounds.pad(0.12));
    }
  }

  private openPopupFor(trackerId: string): void {
    const t = this.trackers().find((x) => x.id === trackerId);
    if (!t || !this.markerLayer) return;
    this.markerLayer.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        if (ll.lat === t.lat && ll.lng === t.lng) {
          layer.openPopup();
        }
      }
    });
  }

  private popupHtml(t: GpsTracker): string {
    return `
      <div class="gps-tracking-popup">
        <strong>${t.name}</strong>
        <div>${t.role} · ${gpsTypeLabel(t.type)}</div>
        <div>${t.projectName}</div>
        <div>Speed: ${t.speedKph} km/h · Battery: ${t.batteryPct}%</div>
        <div>Updated: ${formatLastUpdate(t.lastUpdate)}</div>
      </div>
    `;
  }
}
