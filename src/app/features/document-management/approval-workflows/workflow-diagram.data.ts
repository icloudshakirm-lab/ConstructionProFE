import type {
  AlertStyle,
  AlertVariant,
  DiagramEdge,
  DiagramNode,
  EdgeStyle,
  ToolboxItem
} from './workflow-diagram.model';



export const DEFAULT_EDGE_STYLE: EdgeStyle = {

  color: '#495057',

  strokeWidth: 2,

  lineStyle: 'solid',

  cornerStyle: 'sharp'

};



export const EDGE_STROKE_WIDTH_OPTIONS = [1, 1.5, 2, 3, 4, 5, 6] as const;



export function resolveEdgeStyle(edge: DiagramEdge): EdgeStyle {

  return { ...DEFAULT_EDGE_STYLE, ...edge.style };

}



export function strokeDasharrayFor(lineStyle: EdgeStyle['lineStyle']): string {

  return lineStyle === 'dashed' ? '8 5' : '';

}



export function lineJoinFor(cornerStyle: EdgeStyle['cornerStyle']): 'miter' | 'round' {

  return cornerStyle === 'rounded' ? 'round' : 'miter';

}



export function lineCapFor(cornerStyle: EdgeStyle['cornerStyle']): 'butt' | 'round' {

  return cornerStyle === 'rounded' ? 'round' : 'butt';

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


