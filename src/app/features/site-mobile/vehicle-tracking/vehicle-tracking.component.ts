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
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import { ThemeService } from '../../../core/services/theme.service';
import { MAP_TILES } from '../../project-management/sites-map/sites-map.data';
import {
  driverOperatorSelectOptions,
  employeeById,
  resolveDriverEmployeeId
} from '../site-mobile-employees.data';
import {
  FLEET_FORM_PROJECT_OPTIONS,
  FLEET_FORM_VEHICLE_TYPE_OPTIONS,
  FLEET_MAP_CENTER,
  FLEET_MAP_ZOOM,
  FLEET_PROJECT_OPTIONS,
  FLEET_STATUS_OPTIONS,
  FLEET_VEHICLE_TYPE_OPTIONS,
  auditTimestamp,
  defaultGpsTelemetry,
  fleetStatusColor,
  fleetStatusSeverity,
  formatFleetTime,
  initialFleetVehicles,
  newFleetVehicleId,
  projectNameForId,
  vehicleTypeLabel,
  type FleetVehicle,
  type VehicleFleetStatus,
  type VehicleFormValue,
  type VehicleType
} from './vehicle-tracking.data';

@Component({
  selector: 'app-vehicle-tracking',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    Button,
    Checkbox,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Select,
    TableModule,
    Tag,
    Textarea
  ],
  templateUrl: './vehicle-tracking.component.html',
  styleUrl: './vehicle-tracking.component.scss'
})
export class VehicleTrackingComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapFullscreenHost', { static: true }) mapFullscreenHost!: ElementRef<HTMLDivElement>;

  readonly projectOptions = FLEET_PROJECT_OPTIONS;
  readonly vehicleTypeOptions = FLEET_VEHICLE_TYPE_OPTIONS;
  readonly statusOptions = FLEET_STATUS_OPTIONS;
  readonly formProjectOptions = FLEET_FORM_PROJECT_OPTIONS;
  readonly formVehicleTypeOptions = FLEET_FORM_VEHICLE_TYPE_OPTIONS;
  readonly driverEmployeeOptions = driverOperatorSelectOptions();

  readonly vehicles = signal<FleetVehicle[]>(initialFleetVehicles());

  readonly projectFilter = signal('all');
  readonly vehicleTypeFilter = signal('all');
  readonly statusFilter = signal('all');
  readonly searchText = signal('');
  readonly showRouteReplay = signal(true);
  readonly alertsOnly = signal(false);
  readonly selectedId = signal<string | null>(this.vehicles()[0]?.id ?? null);
  readonly detailVisible = signal(false);
  readonly detailVehicle = signal<FleetVehicle | null>(null);
  readonly formVisible = signal(false);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly deleteConfirmVisible = signal(false);
  readonly vehicleToDelete = signal<FleetVehicle | null>(null);
  readonly formError = signal<string | null>(null);
  readonly isFullscreen = signal(false);
  readonly lastRefreshed = signal(new Date());

  readonly vehicleForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    plateNumber: ['', [Validators.required, Validators.maxLength(24)]],
    vehicleType: ['tipper' as VehicleType, Validators.required],
    driverEmployeeId: ['', Validators.required],
    projectId: ['', Validators.required],
    speedLimitKph: [55, [Validators.required, Validators.min(10), Validators.max(120)]],
    deviceId: ['', Validators.maxLength(40)],
    notes: ['', Validators.maxLength(500)]
  });

  private map: L.Map | null = null;
  private tileLayer: L.TileLayer | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private routeLayer: L.LayerGroup | null = null;
  private mapReady = false;

  private readonly onFullscreenChange = (): void => {
    const host = this.mapFullscreenHost?.nativeElement;
    this.isFullscreen.set(!!host && document.fullscreenElement === host);
    requestAnimationFrame(() => this.map?.invalidateSize({ animate: false }));
  };

  readonly filteredVehicles = computed(() => {
    const project = this.projectFilter();
    const vType = this.vehicleTypeFilter();
    const status = this.statusFilter();
    const alertsOnly = this.alertsOnly();
    const q = this.searchText().trim().toLowerCase();

    return this.vehicles().filter((v) => {
      if (project !== 'all' && v.projectId !== project) return false;
      if (vType !== 'all' && v.vehicleType !== vType) return false;
      if (status !== 'all' && v.status !== status) return false;
      if (alertsOnly && v.status !== 'speeding' && v.idleMinutes < 15) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.deviceId.toLowerCase().includes(q) ||
        v.projectName.toLowerCase().includes(q)
      );
    });
  });

  readonly formDialogHeader = computed(() =>
    this.formMode() === 'create' ? 'Add vehicle' : 'Edit vehicle'
  );

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Track Vehicles' });
    return items;
  });

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange, { passive: true });
    }

    effect(() => {
      const list = this.filteredVehicles();
      const selected = this.selectedId();
      const showRoutes = this.showRouteReplay();
      if (!this.mapReady) return;
      this.renderMap(list, selected, showRoutes);
      if (selected && !list.some((v) => v.id === selected)) {
        this.selectedId.set(list[0]?.id ?? null);
      }
    });

    effect(() => {
      if (!this.mapReady) return;
      this.applyMapTheme(this.themeService.theme() === 'dark');
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.mapReady = true;
    this.renderMap(this.filteredVehicles(), this.selectedId(), this.showRouteReplay());
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.map?.remove();
    this.map = null;
  }

  statusSeverity(status: VehicleFleetStatus) {
    return fleetStatusSeverity(status);
  }

  typeLabel(type: VehicleType) {
    return vehicleTypeLabel(type);
  }

  formatTime(iso: string) {
    return formatFleetTime(iso);
  }

  speedDisplay(v: FleetVehicle): string {
    return v.speedKph > 0 ? `${v.speedKph} km/h` : '—';
  }

  idleDisplay(v: FleetVehicle): string {
    return v.idleMinutes > 0 ? `${v.idleMinutes} min` : '—';
  }

  isOverSpeed(v: FleetVehicle): boolean {
    return v.speedKph > v.speedLimitKph;
  }

  hasGpsLink(v: FleetVehicle): boolean {
    return v.deviceId.trim().length > 0;
  }

  onProjectFilter(value: string): void {
    this.projectFilter.set(value);
  }

  onVehicleTypeFilter(value: string): void {
    this.vehicleTypeFilter.set(value);
  }

  onStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formError.set(null);
    this.vehicleForm.reset({
      name: '',
      plateNumber: '',
      vehicleType: 'tipper',
      driverEmployeeId: '',
      projectId: FLEET_FORM_PROJECT_OPTIONS[0]?.value ?? '',
      speedLimitKph: 55,
      deviceId: '',
      notes: ''
    });
    this.formVisible.set(true);
  }

  openEdit(vehicle: FleetVehicle): void {
    this.formMode.set('edit');
    this.editingId.set(vehicle.id);
    this.formError.set(null);
    this.vehicleForm.patchValue({
      name: vehicle.name,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      driverEmployeeId: resolveDriverEmployeeId(vehicle.driverName, vehicle.driverEmployeeId),
      projectId: vehicle.projectId,
      speedLimitKph: vehicle.speedLimitKph,
      deviceId: vehicle.deviceId,
      notes: vehicle.notes
    });
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.formError.set(null);
  }

  saveVehicle(): void {
    this.vehicleForm.markAllAsTouched();
    if (this.vehicleForm.invalid) {
      this.formError.set('Fix the highlighted fields before saving.');
      return;
    }

    const raw = this.vehicleForm.getRawValue() as VehicleFormValue;
    const plate = raw.plateNumber.trim().toUpperCase();
    const duplicate = this.vehicles().find(
      (v) =>
        v.plateNumber.toUpperCase() === plate &&
        v.id !== (this.formMode() === 'edit' ? this.editingId() : null)
    );
    if (duplicate) {
      this.formError.set(`Plate “${plate}” is already registered to ${duplicate.name}.`);
      return;
    }

    const driver = employeeById(raw.driverEmployeeId);
    if (!driver) {
      this.formError.set('Select a driver or operator from the employee list.');
      return;
    }

    const master = {
      name: raw.name.trim(),
      plateNumber: plate,
      vehicleType: raw.vehicleType,
      driverEmployeeId: driver.id,
      driverName: driver.fullName,
      projectId: raw.projectId,
      projectName: projectNameForId(raw.projectId),
      speedLimitKph: raw.speedLimitKph,
      deviceId: raw.deviceId.trim(),
      notes: raw.notes.trim()
    };

    if (this.formMode() === 'create') {
      const gps = defaultGpsTelemetry(raw.projectId);
      const created: FleetVehicle = {
        id: newFleetVehicleId(),
        ...master,
        ...gps,
        audit: [
          {
            at: auditTimestamp(),
            action: 'Vehicle registered in fleet',
            by: 'Fleet admin'
          }
        ],
        attachments: []
      };
      this.vehicles.update((list) => [...list, created]);
      this.selectedId.set(created.id);
      this.formVisible.set(false);
      return;
    }

    const id = this.editingId();
    if (!id) return;
    const existing = this.vehicles().find((v) => v.id === id);
    if (!existing) return;

    const updated: FleetVehicle = {
      ...existing,
      ...master,
      audit: [
        {
          at: auditTimestamp(),
          action: 'Vehicle record updated',
          by: 'Fleet admin'
        },
        ...existing.audit
      ]
    };
    this.vehicles.update((list) => list.map((v) => (v.id === id ? updated : v)));
    if (this.detailVehicle()?.id === id) {
      this.detailVehicle.set(updated);
    }
    this.formVisible.set(false);
  }

  requestDelete(vehicle: FleetVehicle): void {
    this.vehicleToDelete.set(vehicle);
    this.deleteConfirmVisible.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmVisible.set(false);
    this.vehicleToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.vehicleToDelete();
    if (!target) return;
    const nextList = this.vehicles().filter((v) => v.id !== target.id);
    this.vehicles.set(nextList);
    if (this.selectedId() === target.id) {
      this.selectedId.set(null);
    }
    if (this.detailVehicle()?.id === target.id) {
      this.detailVisible.set(false);
      this.detailVehicle.set(null);
    }
    this.cancelDelete();
  }

  selectVehicle(vehicle: FleetVehicle): void {
    this.selectedId.set(vehicle.id);
    this.map?.setView([vehicle.lat, vehicle.lng], 15, { animate: true });
    this.openPopupFor(vehicle.id);
  }

  openDetail(vehicle: FleetVehicle): void {
    this.detailVehicle.set(vehicle);
    this.detailVisible.set(true);
    this.selectVehicle(vehicle);
  }

  closeDetail(): void {
    this.detailVisible.set(false);
  }

  editFromDetail(): void {
    const v = this.detailVehicle();
    if (!v) return;
    this.detailVisible.set(false);
    this.openEdit(v);
  }

  fitAll(): void {
    const list = this.filteredVehicles();
    if (!this.map || !list.length) return;
    const bounds = L.latLngBounds(list.map((v) => [v.lat, v.lng] as [number, number]));
    this.map.fitBounds(bounds.pad(0.15));
  }

  refreshPositions(): void {
    this.lastRefreshed.set(new Date());
    this.renderMap(this.filteredVehicles(), this.selectedId(), this.showRouteReplay());
  }

  exportCsv(): void {
    const rows = this.filteredVehicles();
    const header = [
      'id',
      'name',
      'plate',
      'vehicleType',
      'driverEmployeeId',
      'driver',
      'project',
      'speedLimitKph',
      'deviceId',
      'notes',
      'gpsStatus',
      'speedKph',
      'lastUpdate'
    ];
    const lines = [
      header.join(','),
      ...rows.map((v) =>
        [
          v.id,
          `"${v.name.replace(/"/g, '""')}"`,
          v.plateNumber,
          v.vehicleType,
          `"${v.driverName.replace(/"/g, '""')}"`,
          `"${v.projectName.replace(/"/g, '""')}"`,
          v.speedLimitKph,
          v.deviceId,
          `"${v.notes.replace(/"/g, '""')}"`,
          v.status,
          v.speedKph,
          v.lastUpdate
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-register-export-${Date.now()}.csv`;
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

  fieldInvalid(name: keyof VehicleFormValue): boolean {
    const c = this.vehicleForm.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  private findVehicle(id: string): FleetVehicle | undefined {
    return this.vehicles().find((v) => v.id === id);
  }

  private initMap(): void {
    const isDark = this.themeService.isDark();
    this.mapContainer.nativeElement.classList.toggle('vehicle-tracking-page__map--dark', isDark);

    this.map = L.map(this.mapContainer.nativeElement, {
      center: FLEET_MAP_CENTER,
      zoom: FLEET_MAP_ZOOM,
      scrollWheelZoom: true
    });

    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);
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
    this.mapContainer.nativeElement.classList.toggle('vehicle-tracking-page__map--dark', isDark);
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = this.createTileLayer(isDark).addTo(this.map);
    this.tileLayer.bringToBack();
  }

  private renderMap(vehicles: FleetVehicle[], selectedId: string | null, showRoutes: boolean): void {
    if (!this.map || !this.markerLayer || !this.routeLayer) return;

    this.markerLayer.clearLayers();
    this.routeLayer.clearLayers();

    for (const v of vehicles) {
      const color = fleetStatusColor(v.status);
      const isSelected = v.id === selectedId;
      const icon = L.divIcon({
        className: `vehicle-tracking-marker${isSelected ? ' vehicle-tracking-marker--selected' : ''}`,
        html: `<span class="vehicle-tracking-marker__ring" style="border-color:${color}"></span>
               <span class="vehicle-tracking-marker__body" style="background:${color}">
                 <i class="pi pi-car"></i>
               </span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([v.lat, v.lng], { icon })
        .bindPopup(this.popupHtml(v), { maxWidth: 320 })
        .addTo(this.markerLayer);

      marker.on('click', () => this.selectedId.set(v.id));
      marker.on('popupopen', () => this.selectedId.set(v.id));

      if (showRoutes && v.route.length >= 2) {
        const isRouteSelected = v.id === selectedId;
        L.polyline(v.route, {
          color: isRouteSelected ? color : '#64748b',
          weight: isRouteSelected ? 5 : 2,
          opacity: isRouteSelected ? 0.92 : 0.4,
          dashArray: isRouteSelected ? undefined : '8 10',
          lineCap: 'round'
        }).addTo(this.routeLayer);
      }
    }

    if (selectedId) {
      setTimeout(() => this.openPopupFor(selectedId), 0);
    } else if (vehicles.length) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng] as [number, number]));
      this.map.fitBounds(bounds.pad(0.12));
    }
  }

  private openPopupFor(vehicleId: string): void {
    const v = this.findVehicle(vehicleId);
    if (!v || !this.markerLayer) return;
    this.markerLayer.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        if (ll.lat === v.lat && ll.lng === v.lng) {
          layer.openPopup();
        }
      }
    });
  }

  private popupHtml(v: FleetVehicle): string {
    const gpsLine =
      v.status === 'offline' && v.speedKph === 0
        ? '<div><em>Awaiting GPS feed</em></div>'
        : '';
    const speedLine =
      v.speedKph > v.speedLimitKph
        ? `Speed: <strong style="color:#ef4444">${v.speedKph} km/h</strong> (limit ${v.speedLimitKph})`
        : `Speed: ${v.speedKph} km/h (limit ${v.speedLimitKph})`;
    return `
      <div class="vehicle-tracking-popup">
        <strong>${v.name}</strong>
        <div>${v.plateNumber} · ${vehicleTypeLabel(v.vehicleType)}</div>
        <div>Driver: ${v.driverName}</div>
        <div>${v.projectName}</div>
        ${gpsLine}
        <div>${speedLine}</div>
        <div>Updated: ${formatFleetTime(v.lastUpdate)}</div>
      </div>
    `;
  }
}
