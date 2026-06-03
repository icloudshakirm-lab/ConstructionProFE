import { Injectable } from '@angular/core';
import type { AcApDocManager } from '@mlightcad/cad-simple-viewer';

const WORKER_BASE = '/cad-workers';

type CadModule = typeof import('@mlightcad/cad-simple-viewer');

@Injectable({ providedIn: 'root' })
export class CadViewerService {
  private cad?: CadModule;
  private manager?: AcApDocManager;
  private host?: HTMLElement;

  async mount(host: HTMLElement): Promise<void> {
    if (this.manager && this.host === host) {
      return;
    }

    await this.destroy();

    this.host = host;
    host.innerHTML = '';

    const cad = await import('@mlightcad/cad-simple-viewer');
    this.cad = cad;

    const manager = cad.AcApDocManager.createInstance({
      container: host,
      autoResize: true,
      useMainThreadDraw: false,
      webworkerFileUrls: {
        dwgParser: `${WORKER_BASE}/libredwg-parser-worker.js`,
        dxfParser: `${WORKER_BASE}/dxf-parser-worker.js`,
        mtextRender: `${WORKER_BASE}/mtext-renderer-worker.js`
      }
    });

    if (!manager) {
      throw new Error('CAD viewer failed to initialize.');
    }

    this.manager = manager;
    await manager.loadDefaultFonts();
  }

  async openUrl(url: string): Promise<boolean> {
    const { AcEdOpenMode } = await this.loadCad();
    return this.requireManager().openUrl(url, { mode: AcEdOpenMode.Read });
  }

  async openFile(file: File): Promise<boolean> {
    const { AcEdOpenMode } = await this.loadCad();
    const content = await file.arrayBuffer();
    return this.requireManager().openDocument(file.name, content, { mode: AcEdOpenMode.Read });
  }

  zoomExtents(): void {
    this.manager?.curView.zoomToFitDrawing();
  }

  async destroy(): Promise<void> {
    if (this.manager) {
      await this.manager.destroy();
      this.manager = undefined;
    }
    if (this.host) {
      this.host.innerHTML = '';
      this.host = undefined;
    }
    this.cad = undefined;
  }

  private async loadCad(): Promise<CadModule> {
    if (!this.cad) {
      this.cad = await import('@mlightcad/cad-simple-viewer');
    }
    return this.cad;
  }

  private requireManager(): AcApDocManager {
    if (!this.manager) {
      throw new Error('CAD viewer is not ready.');
    }
    return this.manager;
  }
}
