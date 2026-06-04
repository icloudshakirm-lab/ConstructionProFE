import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DrawingRecord } from './drawings.data';

type ThreeContext = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  modelRoot: THREE.Group;
  grid: THREE.GridHelper;
  axes: THREE.AxesHelper;
};

@Injectable({ providedIn: 'root' })
export class Model3dViewerService {
  private ctx?: ThreeContext;
  private host?: HTMLElement;
  private animationId?: number;
  private resizeObserver?: ResizeObserver;
  private wireframe = false;
  private gridVisible = true;
  private axesVisible = true;
  private darkScene = true;
  private currentDrawing?: DrawingRecord;

  async mount(host: HTMLElement, darkScene: boolean): Promise<void> {
    if (this.ctx && this.host === host) {
      this.applyTheme(darkScene);
      return;
    }

    await this.dispose();

    this.host = host;
    this.darkScene = darkScene;
    host.innerHTML = '';

    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 240);

    const scene = new THREE.Scene();
    this.applySceneColors(scene, darkScene);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(42, 36, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 8, 0);
    controls.update();

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(60, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8ec8ff, 0.35);
    fill.position.set(-40, 20, -30);
    scene.add(fill);

    const grid = new THREE.GridHelper(120, 24, 0x5a6a7a, 0x3a4550);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(18);
    scene.add(axes);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    this.ctx = { renderer, scene, camera, controls, modelRoot, grid, axes };
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(host);
    this.startLoop();
  }

  loadDrawingModel(drawing: DrawingRecord): void {
    this.currentDrawing = drawing;
    if (!this.ctx) return;

    const { modelRoot } = this.ctx;
    while (modelRoot.children.length) {
      const child = modelRoot.children[0];
      modelRoot.remove(child);
      this.disposeObject(child);
    }

    const model = this.buildModelForDrawing(drawing);
    modelRoot.add(model);
    this.applyWireframeState();
    this.fitAll();
  }

  fitAll(): void {
    if (!this.ctx) return;
    const box = new THREE.Box3().setFromObject(this.ctx.modelRoot);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim * 1.85;
    const dir = new THREE.Vector3(1, 0.75, 1).normalize();

    this.ctx.controls.target.copy(center);
    this.ctx.camera.position.copy(center).add(dir.multiplyScalar(dist));
    this.ctx.camera.near = dist / 200;
    this.ctx.camera.far = dist * 200;
    this.ctx.camera.updateProjectionMatrix();
    this.ctx.controls.update();
  }

  setView(preset: 'top' | 'front' | 'right' | 'iso'): void {
    if (!this.ctx) return;
    const box = new THREE.Box3().setFromObject(this.ctx.modelRoot);
    const center = box.isEmpty() ? new THREE.Vector3(0, 8, 0) : box.getCenter(new THREE.Vector3());
    const size = box.isEmpty() ? new THREE.Vector3(30, 20, 30) : box.getSize(new THREE.Vector3());
    const dist = Math.max(size.x, size.y, size.z, 1) * 1.65;

    const offsets: Record<typeof preset, THREE.Vector3> = {
      top: new THREE.Vector3(0, dist, 0.001),
      front: new THREE.Vector3(0, size.y * 0.35, dist),
      right: new THREE.Vector3(dist, size.y * 0.35, 0),
      iso: new THREE.Vector3(dist * 0.75, dist * 0.65, dist * 0.75)
    };

    this.ctx.controls.target.copy(center);
    this.ctx.camera.position.copy(center).add(offsets[preset]);
    this.ctx.controls.update();
  }

  toggleWireframe(): boolean {
    this.wireframe = !this.wireframe;
    this.applyWireframeState();
    return this.wireframe;
  }

  toggleGrid(): boolean {
    this.gridVisible = !this.gridVisible;
    if (this.ctx) this.ctx.grid.visible = this.gridVisible;
    return this.gridVisible;
  }

  toggleAxes(): boolean {
    this.axesVisible = !this.axesVisible;
    if (this.ctx) this.ctx.axes.visible = this.axesVisible;
    return this.axesVisible;
  }

  isWireframe(): boolean {
    return this.wireframe;
  }

  isGridVisible(): boolean {
    return this.gridVisible;
  }

  isAxesVisible(): boolean {
    return this.axesVisible;
  }

  regen(): void {
    if (this.currentDrawing) {
      this.loadDrawingModel(this.currentDrawing);
    }
  }

  applyTheme(darkScene: boolean): void {
    this.darkScene = darkScene;
    if (this.ctx) {
      this.applySceneColors(this.ctx.scene, darkScene);
    }
  }

  refreshLayout(): void {
    this.onResize();
  }

  async dispose(): Promise<void> {
    if (this.animationId != null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.ctx) {
      this.ctx.controls.dispose();
      this.disposeObject(this.ctx.modelRoot);
      this.ctx.scene.clear();
      this.ctx.renderer.dispose();
      this.ctx.renderer.domElement.remove();
      this.ctx = undefined;
    }

    if (this.host) {
      this.host.innerHTML = '';
      this.host = undefined;
    }
    this.currentDrawing = undefined;
  }

  private startLoop(): void {
    const tick = (): void => {
      this.animationId = requestAnimationFrame(tick);
      if (!this.ctx) return;
      this.ctx.controls.update();
      this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
    };
    tick();
  }

  private onResize(): void {
    if (!this.ctx || !this.host) return;
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.ctx.camera.aspect = width / height;
    this.ctx.camera.updateProjectionMatrix();
    this.ctx.renderer.setSize(width, height);
  }

  private applySceneColors(scene: THREE.Scene, dark: boolean): void {
    scene.background = new THREE.Color(dark ? 0x141820 : 0xe8edf2);
    scene.fog = new THREE.Fog(dark ? 0x141820 : 0xe8edf2, 80, 220);
  }

  private applyWireframeState(): void {
    if (!this.ctx) return;
    this.ctx.modelRoot.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if ('wireframe' in m) {
          (m as THREE.MeshStandardMaterial).wireframe = this.wireframe;
        }
      });
    });
  }

  private buildModelForDrawing(drawing: DrawingRecord): THREE.Group {
    const root = new THREE.Group();
    root.name = drawing.sheet;

    const palette = {
      structure: 0x6b7c8f,
      slab: 0x94a3b8,
      facade: 0x3b82f6,
      accent: 0xf59e0b
    };

    if (drawing.id === 'drw-002') {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(48, 2.5, 36),
        this.mat(palette.slab, true)
      );
      slab.position.set(0, 1.25, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      root.add(slab);

      for (let i = 0; i < 12; i++) {
        const pile = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1, 6, 12),
          this.mat(palette.structure)
        );
        pile.position.set(-18 + (i % 4) * 12, 3, -12 + Math.floor(i / 4) * 12);
        pile.castShadow = true;
        root.add(pile);
      }
      return root;
    }

    if (drawing.id === 'drw-003') {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(28, 3, 20),
        this.mat(palette.slab, true)
      );
      base.position.y = 1.5;
      base.receiveShadow = true;
      root.add(base);

      for (let floor = 0; floor < 6; floor++) {
        const floorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(26 - floor * 0.5, 3.2, 18 - floor * 0.3),
          this.mat(floor % 2 === 0 ? palette.facade : palette.structure)
        );
        floorMesh.position.y = 4 + floor * 3.4;
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        root.add(floorMesh);
      }

      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(6, 5, 4),
        this.mat(palette.accent)
      );
      crown.position.y = 28;
      crown.rotation.y = Math.PI / 4;
      root.add(crown);
      return root;
    }

    // Default architectural floor plan preview (drw-001 and uploads)
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(34, 4, 24),
      this.mat(palette.slab, true)
    );
    podium.position.y = 2;
    podium.receiveShadow = true;
    root.add(podium);

    for (let floor = 0; floor < 5; floor++) {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(30, 3.5, 20),
        this.mat(palette.facade)
      );
      body.position.y = 6 + floor * 3.6;
      body.castShadow = true;
      body.receiveShadow = true;
      root.add(body);
    }

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 22),
      this.mat(palette.structure)
    );
    roof.position.y = 24.5;
    root.add(roof);

    return root;
  }

  private mat(color: number, receiveShadow = false): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.15,
      roughness: 0.72
    });
    if (receiveShadow) {
      /* material used on meshes with receiveShadow flag */
    }
    return m;
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
}
