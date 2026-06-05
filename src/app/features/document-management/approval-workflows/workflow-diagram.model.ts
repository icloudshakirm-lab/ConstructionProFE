export type DiagramTool =

  | 'select'

  | 'rectangle'

  | 'circle'

  | 'diamond'

  | 'text'

  | 'connector'

  | 'swimlane';



export type NodeShape = 'rectangle' | 'circle' | 'diamond' | 'text';

export type NodeResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';



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

  /** Optional overrides on top of the theme preset */

  style?: Partial<NodeStyle>;

}



export interface NodeStyle {

  fill?: string;

  borderColor?: string;

  textColor?: string;

  accentColor?: string;

  borderWidth?: number;

}



export interface ResolvedNodeStyle extends AlertStyle {

  borderWidth: number;

}



export type EdgeLineStyle = 'solid' | 'dashed';

export type EdgeCornerStyle = 'sharp' | 'rounded' | 'sketch';



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

  /** Where the line leaves the source shape */

  fromPort?: EdgePort;

  /** Where the line meets the target shape */

  toPort?: EdgePort;

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



/** Which side of a shape a connector attaches to */

export type PortSide = 'top' | 'right' | 'bottom' | 'left';



/** Attachment on a shape edge (ratio 0–1 along that side) */

export interface EdgePort {

  side: PortSide;

  ratio: number;

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

  cornerStyle: EdgeCornerStyle;

  /** Draggable bend handles (canvas coordinates) */

  waypoints: Point[];

  /** Per-segment hit targets for draw.io-style drag-to-bend */

  segments: EdgeSegmentHit[];

  /** Midpoint handles on each segment when selected */

  virtualBends: VirtualBendHit[];

  start: Point;

  end: Point;

  fromPort: EdgePort;

  toPort: EdgePort;

}



export interface ConnectionPortHit {

  side: PortSide;

  x: number;

  y: number;

  ratio: number;

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


