import type {
  ConnectionPortHit,
  DiagramEdge,
  DiagramNode,
  NodeResizeHandle,
  EdgeCornerStyle,
  EdgePath,
  EdgePort,
  EdgeSegmentHit,
  NodeBounds,
  Point,
  PortSide,
  SwimLane,
  VirtualBendHit,
  WorkflowDiagram
} from './workflow-diagram.model';
import {
  cornerRadiusFor,
  sketchWaveAmplitude,
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

export const PORT_SIDES: PortSide[] = ['top', 'right', 'bottom', 'left'];

const DEFAULT_PORT_RATIO = 0.5;

export function anchorPoint(bounds: NodeBounds, port: EdgePort): Point {
  const ratio = Math.max(0, Math.min(1, port.ratio));
  const { left, right, top, bottom } = bounds;
  switch (port.side) {
    case 'top':
      return { x: left + (right - left) * ratio, y: top };
    case 'bottom':
      return { x: left + (right - left) * ratio, y: bottom };
    case 'left':
      return { x: left, y: top + (bottom - top) * ratio };
    case 'right':
      return { x: right, y: top + (bottom - top) * ratio };
  }
}

/** Pick the side that faces the other shape (used when no port is stored) */
export function defaultPortToward(from: NodeBounds, toward: NodeBounds): EdgePort {
  const dx = toward.cx - from.cx;
  const dy = toward.cy - from.cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { side: 'right', ratio: DEFAULT_PORT_RATIO };
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { side: dx > 0 ? 'right' : 'left', ratio: DEFAULT_PORT_RATIO };
  }
  return { side: dy > 0 ? 'bottom' : 'top', ratio: DEFAULT_PORT_RATIO };
}

/** Snap a canvas point to the nearest location on the shape outline */
export function portFromPoint(bounds: NodeBounds, p: Point): EdgePort {
  const { left, right, top, bottom } = bounds;
  const w = Math.max(right - left, 1);
  const h = Math.max(bottom - top, 1);

  const candidates: EdgePort[] = [
    { side: 'top', ratio: Math.max(0, Math.min(1, (p.x - left) / w)) },
    { side: 'bottom', ratio: Math.max(0, Math.min(1, (p.x - left) / w)) },
    { side: 'left', ratio: Math.max(0, Math.min(1, (p.y - top) / h)) },
    { side: 'right', ratio: Math.max(0, Math.min(1, (p.y - top) / h)) }
  ];

  let best = candidates[0];
  let bestDist = Infinity;
  for (const port of candidates) {
    const pt = anchorPoint(bounds, port);
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if (d < bestDist) {
      bestDist = d;
      best = port;
    }
  }
  return best;
}

export function connectionPortsForBounds(bounds: NodeBounds, ratio = DEFAULT_PORT_RATIO): ConnectionPortHit[] {
  return PORT_SIDES.map((side) => {
    const pt = anchorPoint(bounds, { side, ratio });
    return { side, x: pt.x, y: pt.y, ratio };
  });
}

export function resolveEdgeEndpoints(
  edge: DiagramEdge,
  from: NodeBounds,
  to: NodeBounds
): { start: Point; end: Point; fromPort: EdgePort; toPort: EdgePort } {
  const fromPort = edge.fromPort ?? defaultPortToward(from, to);
  const toPort = edge.toPort ?? defaultPortToward(to, from);
  return {
    start: anchorPoint(from, fromPort),
    end: anchorPoint(to, toPort),
    fromPort,
    toPort
  };
}

/** @deprecated Use resolveEdgeEndpoints */
export function edgeAnchors(from: NodeBounds, to: NodeBounds): { start: Point; end: Point } {
  const fromPort = defaultPortToward(from, to);
  const toPort = defaultPortToward(to, from);
  return { start: anchorPoint(from, fromPort), end: anchorPoint(to, toPort) };
}

/** Straight line until user adds bends */
export function defaultWaypoints(_start: Point, _end: Point): Point[] {
  return [];
}

export function polylinePoints(start: Point, end: Point, waypoints: Point[]): Point[] {
  return [start, ...waypoints, end];
}

export function pathFromPointsSharp(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function distPoints(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function unitVector(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Rounded fillets at each bend (quadratic curves through corner points) */
export function pathFromPointsRounded(points: Point[], radius: number): string {
  if (points.length < 2) {
    return '';
  }
  if (points.length === 2) {
    return pathFromPointsSharp(points);
  }

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];

    const inLen = distPoints(prev, corner);
    const outLen = distPoints(corner, next);
    const trim = Math.min(radius, inLen * 0.48, outLen * 0.48);

    if (trim < 1.5) {
      parts.push(`L ${corner.x} ${corner.y}`);
      continue;
    }

    const inDir = unitVector(corner, prev);
    const outDir = unitVector(corner, next);
    const entry = { x: corner.x + inDir.x * trim, y: corner.y + inDir.y * trim };
    const exit = { x: corner.x + outDir.x * trim, y: corner.y + outDir.y * trim };

    parts.push(`L ${entry.x} ${entry.y}`);
    parts.push(`Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distPoints(points[i], points[i + 1]);
  }
  return total;
}

function pointAtDistance(
  points: Point[],
  dist: number
): { point: Point; tangent: Point } {
  let acc = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = distPoints(a, b);
    if (len < 0.001) {
      continue;
    }
    if (acc + len >= dist - 0.001 || i === points.length - 2) {
      const t = Math.max(0, Math.min(1, (dist - acc) / len));
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      return {
        point: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        tangent: { x: ux, y: uy }
      };
    }
    acc += len;
  }
  const last = points[points.length - 1];
  const prev = points[points.length - 2] ?? last;
  return { point: { ...last }, tangent: unitVector(prev, last) };
}

function pathQuadraticSmooth(pts: Point[]): string {
  if (pts.length < 2) {
    return pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (i < pts.length - 1) {
      const n = pts[i + 1];
      d += ` Q ${p.x} ${p.y} ${(p.x + n.x) / 2} ${(p.y + n.y) / 2}`;
    } else {
      d += ` L ${p.x} ${p.y}`;
    }
  }
  return d;
}

/** Hand-drawn pencil flow: automatic waves and small arcs along the connector */
export function pathFromPointsSketch(points: Point[], strokeWidth: number): string {
  if (points.length < 2) {
    return '';
  }
  const total = polylineLength(points);
  const step = Math.max(10, Math.min(18, 22 - strokeWidth * 1.5));
  const amp = sketchWaveAmplitude(strokeWidth);
  const freq = (2 * Math.PI) / 24;

  const wavy: Point[] = [{ ...points[0] }];
  for (let d = step; d < total - step * 0.5; d += step) {
    const { point, tangent } = pointAtDistance(points, d);
    const px = -tangent.y;
    const py = tangent.x;
    const phase = d * freq;
    const wobble =
      Math.sin(phase) * 0.58 +
      Math.sin(phase * 1.9 + 0.55) * 0.27 +
      Math.sin(phase * 3.1 + 1.2) * 0.15;
    wavy.push({
      x: point.x + px * amp * wobble,
      y: point.y + py * amp * wobble
    });
  }
  wavy.push({ ...points[points.length - 1] });

  return pathQuadraticSmooth(wavy);
}

export function pathFromPoints(
  points: Point[],
  cornerStyle: EdgeCornerStyle = 'sharp',
  strokeWidth = 2
): string {
  if (cornerStyle === 'sketch') {
    return pathFromPointsSketch(points, strokeWidth);
  }
  if (cornerStyle === 'rounded') {
    return pathFromPointsRounded(points, cornerRadiusFor(strokeWidth));
  }
  return pathFromPointsSharp(points);
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
    const { start, end, fromPort, toPort } = resolveEdgeEndpoints(edge, from, to);
    const waypoints = resolveEdgeWaypoints(edge, start, end);
    const poly = polylinePoints(start, end, waypoints);
    const labelPos = labelAtPolyline(poly);
    const style = resolveEdgeStyle(edge);
    const path: EdgePath = {
      id: edge.id,
      d: pathFromPoints(poly, style.cornerStyle, style.strokeWidth),
      labelX: labelPos.x,
      labelY: labelPos.y,
      stroke: style.color,
      strokeWidth: style.strokeWidth,
      strokeDasharray: strokeDasharrayFor(style.lineStyle),
      lineJoin: lineJoinFor(style.cornerStyle),
      lineCap: lineCapFor(style.cornerStyle),
      cornerStyle: style.cornerStyle,
      arrowHead: style.arrowHead,
      arrowTail: style.arrowTail,
      waypoints,
      segments: segmentHitsFromPoly(poly),
      virtualBends: virtualBendsFromPoly(poly),
      start,
      end,
      fromPort,
      toPort
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

export function minNodeSize(shape: DiagramNode['shape']): { w: number; h: number } {
  switch (shape) {
    case 'circle':
      return { w: 56, h: 56 };
    case 'diamond':
      return { w: 72, h: 52 };
    case 'text':
      return { w: 80, h: 28 };
    default:
      return { w: 80, h: 36 };
  }
}

export function resizeNodeBounds(
  handle: NodeResizeHandle,
  start: { x: number; y: number; w: number; h: number },
  pointerX: number,
  pointerY: number,
  laneWidth: number,
  maxContentY: number,
  shape: DiagramNode['shape']
): { x: number; y: number; w: number; h: number } {
  const min = minNodeSize(shape);
  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;
  const right = start.x + start.w;
  const bottom = start.y + start.h;

  if (handle.includes('e')) {
    w = pointerX - start.x;
  }
  if (handle.includes('w')) {
    x = pointerX;
    w = right - pointerX;
  }
  if (handle.includes('s')) {
    h = pointerY - start.y;
  }
  if (handle.includes('n')) {
    y = pointerY;
    h = bottom - pointerY;
  }

  w = Math.max(min.w, w);
  h = Math.max(min.h, h);
  x = Math.max(4, x);
  y = Math.max(4, y);
  w = Math.min(w, laneWidth - x - 4);
  h = Math.min(h, maxContentY - y - 4);

  if (shape === 'circle' && handle.length === 2) {
    const size = Math.max(w, h);
    if (handle.includes('w')) {
      x = right - size;
    }
    if (handle.includes('n')) {
      y = bottom - size;
    }
    w = size;
    h = size;
  }

  return { x, y, w, h };
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
