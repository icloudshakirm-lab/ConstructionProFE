import type {
  DiagramEdge,
  DiagramNode,
  EdgePath,
  EdgeSegmentHit,
  NodeBounds,
  Point,
  SwimLane,
  VirtualBendHit,
  WorkflowDiagram
} from './workflow-diagram.model';
import {
  defaultNodeVariant,
  lineCapFor,
  lineJoinFor,
  resolveEdgeStyle,
  strokeDasharrayFor
} from './workflow-diagram.data';

export const LANE_HEADER_HEIGHT = 52;
export const DEFAULT_LANE_WIDTH = 300;
export const CANVAS_HEIGHT = 520;
export const GRID_STEP = 24;

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function laneOffsets(lanes: SwimLane[]): Map<string, number> {
  const map = new Map<string, number>();
  let x = 0;
  for (const lane of lanes) {
    map.set(lane.id, x);
    x += lane.width;
  }
  return map;
}

export function canvasWidth(lanes: SwimLane[]): number {
  return lanes.reduce((sum, l) => sum + l.width, 0) || DEFAULT_LANE_WIDTH;
}

export function nodeBounds(
  node: DiagramNode,
  laneX: number,
  headerH: number
): NodeBounds {
  return {
    id: node.id,
    cx: laneX + node.x + node.w / 2,
    cy: headerH + node.y + node.h / 2,
    left: laneX + node.x,
    top: headerH + node.y,
    right: laneX + node.x + node.w,
    bottom: headerH + node.y + node.h
  };
}

export function allNodeBounds(diagram: WorkflowDiagram): NodeBounds[] {
  const offsets = laneOffsets(diagram.lanes);
  const headerH = diagram.laneHeaderHeight;
  return diagram.nodes.map((node) => {
    const laneX = offsets.get(node.laneId) ?? 0;
    return nodeBounds(node, laneX, headerH);
  });
}

export function edgeAnchors(from: NodeBounds, to: NodeBounds): { start: Point; end: Point } {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const start = boundaryPoint(from, dx, dy);
  const end = boundaryPoint(to, -dx, -dy);
  return { start, end };
}

function boundaryPoint(box: NodeBounds, dx: number, dy: number): Point {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: box.right, y: box.cy };
  }
  const hw = (box.right - box.left) / 2;
  const hh = (box.bottom - box.top) / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const scale = absDx / hw > absDy / hh ? hw / absDx : hh / absDy;
  return { x: box.cx + dx * scale, y: box.cy + dy * scale };
}

/** Straight line until user adds bends */
export function defaultWaypoints(_start: Point, _end: Point): Point[] {
  return [];
}

export function polylinePoints(start: Point, end: Point, waypoints: Point[]): Point[] {
  return [start, ...waypoints, end];
}

export function pathFromPoints(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function labelAtPolyline(points: Point[]): { x: number; y: number } {
  if (points.length < 2) {
    return points[0] ?? { x: 0, y: 0 };
  }
  const mid = Math.floor((points.length - 1) / 2);
  const a = points[mid];
  const b = points[mid + 1];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 6 };
}

export function resolveEdgeWaypoints(
  edge: DiagramEdge,
  start: Point,
  end: Point
): Point[] {
  if (edge.waypoints?.length) {
    return edge.waypoints.map((p) => ({ ...p }));
  }
  return defaultWaypoints(start, end);
}

export function waypointsForNewEdge(_start: Point, _end: Point): Point[] {
  return [];
}

export function waypointsFromPoly(poly: Point[]): Point[] {
  return poly.slice(1, -1).map((p) => ({ ...p }));
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function projectOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) {
    return { x: a.x, y: a.y };
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Offset perpendicular to segment so bends are visible (not colinear with the line) */
function visibleBendPoint(a: Point, b: Point, near: Point, minOffset = 24): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len;
  const uy = dx / len;
  const proj = projectOnSegment(near, a, b);
  let side = (near.x - proj.x) * ux + (near.y - proj.y) * uy;
  if (Math.abs(side) < minOffset * 0.5) {
    side = side >= 0 ? minOffset : -minOffset;
  }
  return { x: proj.x + ux * side, y: proj.y + uy * side };
}

/** Insert a bend on the nearest segment (always offset from the straight line) */
export function addWaypointOnEdge(
  start: Point,
  end: Point,
  waypoints: Point[],
  click: Point
): Point[] {
  const poly = polylinePoints(start, end, waypoints);
  let bestI = 0;
  let bestDist = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const d = distToSegment(click, poly[i], poly[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      bestI = i;
    }
  }
  const a = poly[bestI];
  const b = poly[bestI + 1];
  const bend = visibleBendPoint(a, b, click);
  const next = waypoints.map((p) => ({ ...p }));
  next.splice(bestI, 0, bend);
  return next;
}

export function removeWaypointAt(waypoints: Point[], index: number): Point[] {
  return waypoints.filter((_, i) => i !== index);
}

export function segmentHitsFromPoly(poly: Point[]): EdgeSegmentHit[] {
  const segments: EdgeSegmentHit[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    segments.push({
      index: i,
      d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
      horizontal: Math.abs(a.y - b.y) <= Math.abs(a.x - b.x)
    });
  }
  return segments;
}

export function virtualBendsFromPoly(poly: Point[]): VirtualBendHit[] {
  const bends: VirtualBendHit[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    bends.push({
      segmentIndex: i,
      x: (poly[i].x + poly[i + 1].x) / 2,
      y: (poly[i].y + poly[i + 1].y) / 2
    });
  }
  return bends;
}

/** Move every waypoint attached to this segment in parallel (free angles) */
export function dragSegmentWaypoints(
  start: Point,
  end: Point,
  startWaypoints: Point[],
  segmentIndex: number,
  delta: Point
): Point[] {
  const poly = polylinePoints(start, end, startWaypoints);

  if (startWaypoints.length === 0 && (Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1)) {
    const a = poly[segmentIndex];
    const b = poly[segmentIndex + 1];
    const mid = { x: (a.x + b.x) / 2 + delta.x, y: (a.y + b.y) / 2 + delta.y };
    return [visibleBendPoint(a, b, mid)];
  }

  const result = startWaypoints.map((p) => ({ ...p }));
  const moveWp = (polyIndex: number) => {
    const wi = polyIndex - 1;
    if (wi >= 0 && wi < result.length) {
      result[wi].x += delta.x;
      result[wi].y += delta.y;
    }
  };

  moveWp(segmentIndex);
  moveWp(segmentIndex + 1);

  return result;
}

export function dragWaypointTo(waypoints: Point[], index: number, point: Point): Point[] {
  const next = waypoints.map((p) => ({ ...p }));
  if (index >= 0 && index < next.length) {
    next[index] = { x: point.x, y: point.y };
  }
  return next;
}

export function buildEdgePaths(diagram: WorkflowDiagram): EdgePath[] {
  const bounds = new Map(allNodeBounds(diagram).map((b) => [b.id, b]));
  const paths: EdgePath[] = [];
  for (const edge of diagram.edges) {
    const from = bounds.get(edge.fromId);
    const to = bounds.get(edge.toId);
    if (!from || !to) continue;
    const { start, end } = edgeAnchors(from, to);
    const waypoints = resolveEdgeWaypoints(edge, start, end);
    const poly = polylinePoints(start, end, waypoints);
    const labelPos = labelAtPolyline(poly);
    const style = resolveEdgeStyle(edge);
    const path: EdgePath = {
      id: edge.id,
      d: pathFromPoints(poly),
      labelX: labelPos.x,
      labelY: labelPos.y,
      stroke: style.color,
      strokeWidth: style.strokeWidth,
      strokeDasharray: strokeDasharrayFor(style.lineStyle),
      lineJoin: lineJoinFor(style.cornerStyle),
      lineCap: lineCapFor(style.cornerStyle),
      waypoints,
      segments: segmentHitsFromPoly(poly),
      virtualBends: virtualBendsFromPoly(poly)
    };
    if (edge.label) path.label = edge.label;
    paths.push(path);
  }
  return paths;
}

export function laneAtX(
  lanes: SwimLane[],
  x: number
): { lane: SwimLane; laneX: number } | null {
  if (!lanes.length) return null;
  let offset = 0;
  for (const lane of lanes) {
    if (x >= offset && x < offset + lane.width) {
      return { lane, laneX: offset };
    }
    offset += lane.width;
  }
  const last = lanes[lanes.length - 1];
  return { lane: last, laneX: offset - last.width };
}

export function snapToLaneContent(
  diagram: WorkflowDiagram,
  canvasX: number,
  canvasY: number
): { laneId: string; x: number; y: number } | null {
  const hit = laneAtX(diagram.lanes, canvasX);
  if (!hit) return null;
  const x = canvasX - hit.laneX;
  const y = canvasY - diagram.laneHeaderHeight;
  if (x < 8 || y < 8) return null;
  return {
    laneId: hit.lane.id,
    x: Math.max(8, x),
    y: Math.max(8, y)
  };
}

export function nodePositionFromDrag(
  diagram: WorkflowDiagram,
  canvasX: number,
  canvasY: number,
  dragOffsetX: number,
  dragOffsetY: number,
  nodeW: number,
  nodeH: number
): { laneId: string; x: number; y: number } | null {
  const left = canvasX - dragOffsetX;
  const top = canvasY - dragOffsetY;
  const hit = laneAtX(diagram.lanes, left + nodeW / 2);
  if (!hit) return null;
  const headerH = diagram.laneHeaderHeight;
  const maxY = CANVAS_HEIGHT - headerH - nodeH - 8;
  const maxX = hit.lane.width - nodeW - 8;
  return {
    laneId: hit.lane.id,
    x: Math.min(maxX, Math.max(4, left - hit.laneX)),
    y: Math.min(maxY, Math.max(4, top - headerH))
  };
}

export function defaultShapeSize(shape: DiagramNode['shape']): { w: number; h: number } {
  switch (shape) {
    case 'circle':
      return { w: 88, h: 88 };
    case 'diamond':
      return { w: 108, h: 76 };
    case 'text':
      return { w: 140, h: 40 };
    default:
      return { w: 200, h: 52 };
  }
}

export function initialDiagram(): WorkflowDiagram {
  const lanes: SwimLane[] = [
    { id: 'lane-1', title: 'Requester', width: DEFAULT_LANE_WIDTH },
    { id: 'lane-2', title: 'Review', width: DEFAULT_LANE_WIDTH },
    { id: 'lane-3', title: 'Approval', width: DEFAULT_LANE_WIDTH }
  ];
  const nodes: DiagramNode[] = [
    {
      id: 'n1',
      laneId: 'lane-1',
      shape: 'rectangle',
      variant: 'primary',
      x: 48,
      y: 100,
      w: 200,
      h: 52,
      label: 'Submit request'
    },
    {
      id: 'n2',
      laneId: 'lane-2',
      shape: 'diamond',
      variant: 'warning',
      x: 52,
      y: 140,
      w: 108,
      h: 76,
      label: 'Valid?'
    },
    {
      id: 'n3',
      laneId: 'lane-3',
      shape: 'rectangle',
      variant: 'success',
      x: 48,
      y: 100,
      w: 200,
      h: 52,
      label: 'Approve'
    }
  ];
  const edges: DiagramEdge[] = [
    { id: 'e1', fromId: 'n1', toId: 'n2' },
    { id: 'e2', fromId: 'n2', toId: 'n3', label: 'Yes' }
  ];
  return { laneHeaderHeight: LANE_HEADER_HEIGHT, lanes, nodes, edges };
}

export function variantForNewShape(shape: DiagramNode['shape']): DiagramNode['variant'] {
  return defaultNodeVariant(shape);
}
