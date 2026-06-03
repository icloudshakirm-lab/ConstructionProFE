import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CadViewerService } from './cad-viewer.service';
import { DEMO_DRAWINGS, DrawingRecord } from './drawings.data';

@Component({
  selector: 'app-drawing-viewer',
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './drawing-viewer.component.html',
  styleUrl: './drawing-viewer.component.scss'
})
export class DrawingViewerComponent implements AfterViewInit, OnDestroy {
  private readonly cadViewer = inject(CadViewerService);
  private readonly messages = inject(MessageService);

  @ViewChild('cadHost', { static: true }) cadHost!: ElementRef<HTMLDivElement>;

  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Document Management', routerLink: '/documents' },
    { label: 'Drawings' }
  ];

  readonly drawings = DEMO_DRAWINGS;
  readonly selected = signal<DrawingRecord | null>(DEMO_DRAWINGS[0] ?? null);
  readonly loading = signal(false);
  readonly filterText = signal('');
  readonly filteredDrawings = signal(DEMO_DRAWINGS);

  ngAfterViewInit(): void {
    void this.bootstrapViewer();
  }

  ngOnDestroy(): void {
    void this.cadViewer.destroy();
  }

  onFilterChange(value: string): void {
    this.filterText.set(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      this.filteredDrawings.set(this.drawings);
      return;
    }
    this.filteredDrawings.set(
      this.drawings.filter(
        (d) =>
          d.sheet.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.discipline.toLowerCase().includes(q)
      )
    );
  }

  async selectDrawing(drawing: DrawingRecord): Promise<void> {
    this.selected.set(drawing);
    await this.loadDrawing(drawing.fileUrl, `${drawing.sheet} — ${drawing.title}`);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'dwg' && ext !== 'dxf') {
      this.messages.add({
        severity: 'warn',
        summary: 'Unsupported file',
        detail: 'Only AutoCAD DWG and DXF files can be opened.'
      });
      return;
    }

    this.selected.set(null);
    this.loading.set(true);
    try {
      await this.cadViewer.mount(this.cadHost.nativeElement);
      const ok = await this.cadViewer.openFile(file);
      if (!ok) {
        throw new Error('Parser could not open this drawing.');
      }
      this.cadViewer.zoomExtents();
    } catch (err) {
      this.messages.add({
        severity: 'error',
        summary: 'Could not open drawing',
        detail: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      this.loading.set(false);
    }
  }

  zoomExtents(): void {
    this.cadViewer.zoomExtents();
  }

  private async bootstrapViewer(): Promise<void> {
    const first = this.selected();
    if (!first) {
      return;
    }
    await this.loadDrawing(first.fileUrl, `${first.sheet} — ${first.title}`);
  }

  private async loadDrawing(url: string, label: string): Promise<void> {
    this.loading.set(true);
    try {
      await this.cadViewer.mount(this.cadHost.nativeElement);
      const ok = await this.cadViewer.openUrl(url);
      if (!ok) {
        throw new Error(`Failed to load "${label}".`);
      }
      this.cadViewer.zoomExtents();
    } catch (err) {
      this.messages.add({
        severity: 'error',
        summary: 'Drawing load failed',
        detail: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      this.loading.set(false);
    }
  }
}
