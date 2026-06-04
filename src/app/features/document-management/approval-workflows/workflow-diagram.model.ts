export type DiagramTool =

  | 'select'

  | 'rectangle'

  | 'circle'

  | 'diamond'

  | 'text'

  | 'connector'

  | 'swimlane';



export type NodeShape = 'rectangle' | 'circle' | 'diamond' | 'text';



/** Bootstrap 5 alert semantic colors */

export type AlertVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';



export interface SwimLane {

  id: string;

  title: string;

  /** Column width for vertical swim lanes */

  width: number;

}



export interface DiagramNode {

  id: string;

  laneId: string;

  shape: NodeShape;

  x: number;

  y: number;

  w: number;

  h: number;

  label: string;

  variant?: AlertVariant;

}



export type EdgeLineStyle = 'solid' | 'dashed';

export type EdgeCornerStyle = 'sharp' | 'rounded';



export interface EdgeStyle {

  color: string;

  strokeWidth: number;

  lineStyle: EdgeLineStyle;

  cornerStyle: EdgeCornerStyle;

}



export interface DiagramEdge {

  id: string;

  fromId: string;

  toId: string;

  label?: string;

  /** Bend points in canvas coordinates (between shape anchors) */

  waypoints?: Point[];

  style?: Partial<EdgeStyle>;

}



export interface WorkflowDiagram {

  laneHeaderHeight: number;

  lanes: SwimLane[];

  nodes: DiagramNode[];

  edges: DiagramEdge[];

}



export interface ToolboxItem {

  tool: DiagramTool;

  label: string;

  icon: string;

  hint: string;

}



export interface AlertStyle {

  bg: string;

  border: string;

  text: string;

  accent: string;

}



export interface Point {

  x: number;

  y: number;

}



export interface NodeBounds {

  id: string;

  cx: number;

  cy: number;

  left: number;

  top: number;

  right: number;

  bottom: number;

}



export interface EdgePath {

  id: string;

  d: string;

  labelX: number;

  labelY: number;

  label?: string;

  stroke: string;

  strokeWidth: number;

  strokeDasharray: string;

  lineJoin: 'miter' | 'round';

  lineCap: 'butt' | 'round';

  /** Draggable bend handles (canvas coordinates) */

  waypoints: Point[];

  /** Per-segment hit targets for draw.io-style drag-to-bend */

  segments: EdgeSegmentHit[];

  /** Midpoint handles on each segment when selected */

  virtualBends: VirtualBendHit[];

}

export interface EdgeSegmentHit {

  index: number;

  d: string;

  horizontal: boolean;

}

/** Mid-segment handle (mxGraph virtual bend) — drag to add 90° corners */

export interface VirtualBendHit {

  segmentIndex: number;

  x: number;

  y: number;

}


