import type {
  AlertStyle,
  AlertVariant,
  DiagramEdge,
  DiagramNode,
  EdgeStyle,
  NodeStyle,
  ResolvedNodeStyle,
  ToolboxItem
} from './workflow-diagram.model';



export const DEFAULT_EDGE_STYLE: EdgeStyle = {

  color: '#495057',

  strokeWidth: 2,

  lineStyle: 'solid',

  cornerStyle: 'sharp'

};



export const EDGE_STROKE_WIDTH_OPTIONS = [1, 1.5, 2, 3, 4, 5, 6] as const;

export const NODE_BORDER_WIDTH_OPTIONS = [1, 1.5, 2, 3, 4] as const;

export const ALERT_VARIANT_OPTIONS: { label: string; value: AlertVariant }[] = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Success', value: 'success' },
  { label: 'Danger', value: 'danger' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' }
];

export interface AlertColorPreset {
  variant: AlertVariant;
  label: string;
  style: AlertStyle;
}

export function hasCustomNodeColors(node: DiagramNode): boolean {
  const s = node.style;
  return !!(s?.fill || s?.borderColor || s?.textColor || s?.accentColor);
}

export function nodeStyleKeepingBorderWidth(node: DiagramNode): NodeStyle | undefined {
  const w = node.style?.borderWidth;
  return w != null ? { borderWidth: w } : undefined;
}



export function resolveEdgeStyle(edge: DiagramEdge): EdgeStyle {

  return { ...DEFAULT_EDGE_STYLE, ...edge.style };

}



export function strokeDasharrayFor(lineStyle: EdgeStyle['lineStyle']): string {

  return lineStyle === 'dashed' ? '8 5' : '';

}



export function lineJoinFor(cornerStyle: EdgeStyle['cornerStyle']): 'miter' | 'round' {

  return cornerStyle === 'sharp' ? 'miter' : 'round';

}



export function lineCapFor(cornerStyle: EdgeStyle['cornerStyle']): 'butt' | 'round' {

  return cornerStyle === 'sharp' ? 'butt' : 'round';

}



/** Fillet radius at connector bends when corner style is rounded */

export function cornerRadiusFor(strokeWidth: number): number {

  return Math.max(10, 6 + strokeWidth * 3);

}



export function sketchWaveAmplitude(strokeWidth: number): number {

  return Math.min(9, 3.2 + strokeWidth * 0.95);

}



export const DIAGRAM_TOOLBOX: ToolboxItem[] = [

  { tool: 'select', label: 'Select', icon: 'pi pi-arrow-up-right', hint: 'Move shapes' },

  { tool: 'connector', label: 'Connect', icon: 'pi pi-share-alt', hint: 'Link shapes (multi-out)' },

  { tool: 'rectangle', label: 'Rectangle', icon: 'pi pi-stop', hint: 'Process step' },

  { tool: 'circle', label: 'Circle', icon: 'pi pi-circle', hint: 'Start / end' },

  { tool: 'diamond', label: 'Diamond', icon: 'pi pi-star', hint: 'Decision' },

  { tool: 'text', label: 'Text', icon: 'pi pi-font', hint: 'Label' },

  { tool: 'swimlane', label: 'Swim lane', icon: 'pi pi-th-large', hint: 'Add vertical lane' }

];



/** Bootstrap 5 alert palette (light theme) */

export const ALERT_STYLES: Record<AlertVariant, AlertStyle> = {
  primary: { bg: '#cfe2ff', border: '#b6d4fe', text: '#084298', accent: '#0d6efd' },

  secondary: { bg: '#e2e3e5', border: '#d3d6d8', text: '#41464b', accent: '#6c757d' },

  success: { bg: '#d1e7dd', border: '#badbcc', text: '#0f5132', accent: '#198754' },

  danger: { bg: '#f8d7da', border: '#f5c2c7', text: '#842029', accent: '#dc3545' },

  warning: { bg: '#fff3cd', border: '#ffecb5', text: '#664d03', accent: '#ffc107' },

  info: { bg: '#cff4fc', border: '#b6effb', text: '#055160', accent: '#0dcaf0' }

};

/** Bootstrap alert palettes for consistent shape styling */
export const ALERT_COLOR_PRESETS: AlertColorPreset[] = ALERT_VARIANT_OPTIONS.map((o) => ({
  variant: o.value,
  label: o.label,
  style: ALERT_STYLES[o.value]
}));

export function defaultNodeVariant(shape: DiagramNode['shape']): AlertVariant {

  switch (shape) {

    case 'circle':

      return 'success';

    case 'diamond':

      return 'warning';

    case 'text':

      return 'info';

    default:

      return 'primary';

  }

}



export function nodeAlertStyle(node: DiagramNode): AlertStyle {

  const variant = node.variant ?? defaultNodeVariant(node.shape);

  return ALERT_STYLES[variant];

}



export function resolveNodeStyle(node: DiagramNode): ResolvedNodeStyle {

  const preset = nodeAlertStyle(node);

  const s: Partial<NodeStyle> = node.style ?? {};

  return {

    bg: s.fill ?? preset.bg,

    border: s.borderColor ?? preset.border,

    text: s.textColor ?? preset.text,

    accent: s.accentColor ?? preset.accent,

    borderWidth: s.borderWidth ?? 1.5

  };

}


