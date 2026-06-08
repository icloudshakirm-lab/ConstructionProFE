import { Injectable } from '@angular/core';
import type { AcApDocManager } from '@mlightcad/cad-simple-viewer';

type CadModule = typeof import('@mlightcad/cad-simple-viewer');

function workerUrl(file: string): string {
  if (typeof window === 'undefined') {
    return `/cad-workers/${file}`;
  }
  return new URL(`/cad-workers/${file}`, window.location.origin).href;
}

function resolveDrawingUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (typeof window === 'undefined') {
    return url;
  }
  return new URL(url.startsWith('/') ? url : `/${url}`, window.location.origin).href;
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop();
    return name && name.length > 0 ? name : 'drawing.dxf';
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'drawing.dxf';
  }
}

@Injectable({ providedIn: 'root' })
export class CadViewerService {
  private cad?: CadModule;
  private manager?: AcApDocManager;
  private host?: HTMLElement;

  async mount(host: HTMLElement): Promise<void> {
    await this.waitForHostSize(host);

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
      useMainThreadDraw: true,
      webworkerFileUrls: {
        dwgParser: workerUrl('libredwg-parser-worker.js'),
        dxfParser: workerUrl('dxf-parser-worker.js'),
        mtextRender: workerUrl('mtext-renderer-worker.js')
      }
    });

    if (!manager) {
      throw new Error('CAD viewer failed to initialize.');
    }

    this.manager = manager;
    await manager.loadDefaultFonts();
  }

  /** Force destroy + mount on the same host (e.g. after layout / expand changes). */
  async remount(host: HTMLElement): Promise<void> {
    await this.destroy();
    await this.mount(host);
  }

  async openUrl(url: string): Promise<boolean> {
    const { AcEdOpenMode } = await this.loadCad();
    const resolved = resolveDrawingUrl(url);
    const response = await fetch(resolved);
    if (!response.ok) {
      throw new Error(`Drawing file not found (${response.status}): ${resolved}`);
    }
    const content = await response.arrayBuffer();
    if (!content.byteLength) {
      throw new Error(`Drawing file is empty: ${resolved}`);
    }
    return this.requireManager().openDocument(fileNameFromUrl(resolved), content, {
      mode: AcEdOpenMode.Read
    });
  }

  async openFile(file: File): Promise<boolean> {
    const { AcEdOpenMode } = await this.loadCad();
    const content = await file.arrayBuffer();
    return this.requireManager().openDocument(file.name, content, { mode: AcEdOpenMode.Read });
  }

  zoomExtents(): void {
    this.manager?.curView.zoomToFitDrawing();
  }

  /** After layout / fullscreen changes so the canvas recalculates size. */
  refreshLayout(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
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

  private async waitForHostSize(host: HTMLElement, attempts = 12): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      const { width, height } = host.getBoundingClientRect();
      if (width > 0 && height > 0) {
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
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
