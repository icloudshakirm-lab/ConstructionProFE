export interface Model3dCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
  group: 'view' | 'display' | 'nav';
}

export const MODEL3D_COMMANDS: Model3dCommand[] = [
  { id: 'fit', label: '3DFIT', hint: 'Zoom extents (fit all)', icon: 'pi-search-plus', group: 'view' },
  { id: 'top', label: '3DTOP', hint: 'Top view', icon: 'pi-arrow-down', group: 'view' },
  { id: 'front', label: '3DFRONT', hint: 'Front elevation', icon: 'pi-arrow-right', group: 'view' },
  { id: 'right', label: '3DRIGHT', hint: 'Right elevation', icon: 'pi-arrow-left', group: 'view' },
  { id: 'iso', label: '3DISO', hint: 'Isometric view', icon: 'pi-box', group: 'view' },
  { id: 'wireframe', label: '3DWFRAME', hint: 'Toggle wireframe', icon: 'pi-table', group: 'display' },
  { id: 'grid', label: '3DGRID', hint: 'Toggle construction grid', icon: 'pi-th-large', group: 'display' },
  { id: 'axes', label: '3DAXES', hint: 'Toggle axis tripod', icon: 'pi-compass', group: 'display' },
  { id: 'regen', label: '3DREGEN', hint: 'Regenerate model preview', icon: 'pi-refresh', group: 'display' }
];

export const MODEL3D_MOUSE_HINTS = [
  { action: 'Orbit', input: 'Left drag' },
  { action: 'Pan', input: 'Right drag' },
  { action: 'Zoom', input: 'Scroll wheel' },
  { action: 'Zoom', input: 'Pinch (touch)' }
];
