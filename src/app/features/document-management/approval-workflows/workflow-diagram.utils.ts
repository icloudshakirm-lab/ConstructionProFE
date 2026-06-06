import type {
  ConnectionPortHit,
  DiagramEdge,
  DiagramNode,
  NodeResizeHandle,
  EdgeCornerStyle,
  EdgePath,
  EdgeRouteStyle,
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
export const MIN_LANE_WIDTH = 140;
export const MAX_LANE_WIDTH = 640;
export const CANVAS_HEIGHT = 520;
export const MIN_CANVAS_HEIGHT = 320;
export const MAX_CANVAS_HEIGHT = 2400;

export function laneContentHeight(diagram: WorkflowDiagram): number {
  return (diagram.canvasHeight ?? CANVAS_HEIGHT) - diagram.laneHeaderHeight;
}

export function minCanvasHeightForDiagram(diagram: WorkflowDiagram): number {
  const header = diagram.laneHeaderHeight;
  if (!diagram.nodes.length) {
    return MIN_CANVAS_HEIGHT;
  }
  const maxNodeBottom = Math.max(...diagram.nodes.map((n) => n.y + n.h));
  return Math.max(MIN_CANVAS_HEIGHT, header + maxNodeBottom + 40);
}
export const GRID_STEP = 24;
export const ORTHOGONAL_STUB_LENGTH = 28;
export const ANGLE_SNAP_STEP_DEG = 15;

/** Snap target onto a ray from origin using fixed degree steps (default 15°). */
export function snapPointToAngle(
  origin: Point,
  target: Point,
  stepDeg = ANGLE_SNAP_STEP_DEG
): Point {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) {
    return { x: target.x, y: target.y };
  }
  const stepRad = (stepDeg * Math.PI) / 180;
  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / stepRad) * stepRad;
  return {
    x: origin.x + dist * Math.cos(snapped),
    y: origin.y + dist * Math.sin(snapped)
  };
}

/** Snap a drag delta vector to the nearest angle step. */
export function snapDeltaToAngle(delta: Point, stepDeg = ANGLE_SNAP_STEP_DEG): Point {
  const dist = Math.hypot(delta.x, delta.y);
  if (dist < 0.001) {
    return { x: delta.x, y: delta.y };
  }
  return snapPointToAngle({ x: 0, y: 0 }, delta, stepDeg);
}

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

function portIsHorizontal(side: PortSide): boolean {
  return side === 'left' || side === 'right';
}

function orthogonalStubPoint(anchor: Point, port: EdgePort, length: number): Point {
  switch (port.side) {
    case 'top':
      return { x: anchor.x, y: anchor.y - length };
    case 'bottom':
      return { x: anchor.x, y: anchor.y + length };
    case 'left':
      return { x: anchor.x - length, y: anchor.y };
    case 'right':
      return { x: anchor.x + length, y: anchor.y };
  }
}

function orthogonalCornersBetween(
  stubStart: Point,
  stubEnd: Point,
  fromSide: PortSide,
  toSide: PortSide
): Point[] {
  const fromH = portIsHorizontal(fromSide);
  const toH = portIsHorizontal(toSide);

  if (fromH && toH) {
    if (Math.abs(stubStart.y - stubEnd.y) < 1) {
      return [];
    }
    const midX = (stubStart.x + stubEnd.x) / 2;
    return [
      { x: midX, y: stubStart.y },
      { x: midX, y: stubEnd.y }
    ];
  }

  if (!fromH && !toH) {
    if (Math.abs(stubStart.x - stubEnd.x) < 1) {
      return [];
    }
    const midY = (stubStart.y + stubEnd.y) / 2;
    return [
      { x: stubStart.x, y: midY },
      { x: stubEnd.x, y: midY }
    ];
  }

  if (fromH) {
    return [{ x: stubEnd.x, y: stubStart.y }];
  }

  return [{ x: stubStart.x, y: stubEnd.y }];
}

/** Right-angle H/V routing with short stubs leaving each port */
export function orthogonalRouteWaypoints(
  start: Point,
  end: Point,
  fromPort: EdgePort,
  toPort: EdgePort,
  stub = ORTHOGONAL_STUB_LENGTH
): Point[] {
  const stubStart = orthogonalStubPoint(start, fromPort, stub);
  const stubEnd = orthogonalStubPoint(end, toPort, stub);
  const corners = orthogonalCornersBetween(stubStart, stubEnd, fromPort.side, toPort.side);
  return [stubStart, ...corners, stubEnd];
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
  end: Point,
  fromPort?: EdgePort,
  toPort?: EdgePort
): Point[] {
  if (edge.waypoints?.length) {
    return edge.waypoints.map((p) => ({ ...p }));
  }
  const style = resolveEdgeStyle(edge);
  if (style.routeStyle === 'orthogonal' && fromPort && toPort) {
    return orthogonalRouteWaypoints(start, end, fromPort, toPort);
  }
  return defaultWaypoints(start, end);
}

export function waypointsForNewEdge(
  start: Point,
  end: Point,
  fromPort: EdgePort,
  toPort: EdgePort,
  routeStyle: EdgeRouteStyle = 'direct'
): Point[] {
  if (routeStyle === 'orthogonal') {
    return orthogonalRouteWaypoints(start, end, fromPort, toPort);
  }
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

function isSegmentHorizontal(a: Point, b: Point): boolean {
  return Math.abs(a.y - b.y) <= Math.abs(a.x - b.x);
}

function pointsDiffer(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;
}

/** Remove colinear corners so only true orthogonal bends remain */
export function simplifyOrthogonalWaypoints(
  start: Point,
  end: Point,
  waypoints: Point[]
): Point[] {
  const poly = polylinePoints(start, end, waypoints);
  const kept: Point[] = [];
  for (let i = 1; i < poly.length - 1; i++) {
    const prev = poly[i - 1];
    const cur = poly[i];
    const next = poly[i + 1];
    const colinearH =
      Math.abs(prev.y - cur.y) < 0.5 && Math.abs(cur.y - next.y) < 0.5;
    const colinearV =
      Math.abs(prev.x - cur.x) < 0.5 && Math.abs(cur.x - next.x) < 0.5;
    if (!colinearH && !colinearV) {
      kept.push({ ...cur });
    }
  }
  return kept;
}

/** Insert a right-angle jog on the nearest segment */
export function addOrthogonalWaypointOnEdge(
  start: Point,
  end: Point,
  waypoints: Point[],
  click: Point,
  minOffset = 24
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
  const horiz = isSegmentHorizontal(a, b);
  const proj = projectOnSegment(click, a, b);
  const next = waypoints.map((p) => ({ ...p }));

  let inserts: Point[] = [];
  if (horiz) {
    let offY = click.y - a.y;
    if (Math.abs(offY) < minOffset * 0.5) {
      offY = offY >= 0 ? minOffset : -minOffset;
    }
    const mx = proj.x;
    const my = a.y + offY;
    inserts = [
      { x: mx, y: a.y },
      { x: mx, y: my },
      { x: b.x, y: my }
    ];
  } else {
    let offX = click.x - a.x;
    if (Math.abs(offX) < minOffset * 0.5) {
      offX = offX >= 0 ? minOffset : -minOffset;
    }
    const my = proj.y;
    const mx = a.x + offX;
    inserts = [
      { x: a.x, y: my },
      { x: mx, y: my },
      { x: mx, y: b.y }
    ];
  }

  inserts = inserts.filter((p, idx) => idx === 0 || pointsDiffer(p, inserts[idx - 1]));
  inserts = inserts.filter((p) => pointsDiffer(p, a));
  inserts = inserts.filter((p) => pointsDiffer(p, b));

  next.splice(bestI, 0, ...inserts);
  return simplifyOrthogonalWaypoints(start, end, next);
}

/** Drag one H/V segment perpendicular to itself without moving other corners */
export function dragOrthogonalSegmentWaypoints(
  start: Point,
  end: Point,
  startWaypoints: Point[],
  segmentIndex: number,
  delta: Point
): Point[] {
  const result = startWaypoints.map((p) => ({ ...p }));
  const poly = polylinePoints(start, end, result);
  const a = poly[segmentIndex];
  const b = poly[segmentIndex + 1];
  const horiz = isSegmentHorizontal(a, b);
  const applied = horiz ? { x: 0, y: delta.y } : { x: delta.x, y: 0 };
  const lastPolyIndex = poly.length - 1;

  const wiStart = segmentIndex > 0 ? segmentIndex - 1 : null;
  const wiEnd = segmentIndex + 1 < lastPolyIndex ? segmentIndex : null;

  if (wiStart != null && wiStart >= 0 && wiStart < result.length) {
    result[wiStart].x += applied.x;
    result[wiStart].y += applied.y;
  }
  if (wiEnd != null && wiEnd >= 0 && wiEnd < result.length) {
    result[wiEnd].x += applied.x;
    result[wiEnd].y += applied.y;
  }

  return simplifyOrthogonalWaypoints(start, end, result);
}

export function dragOrthogonalWaypointTo(
  start: Point,
  end: Point,
  waypoints: Point[],
  index: number,
  point: Point
): Point[] {
  const next = waypoints.map((p) => ({ ...p }));
  if (index < 0 || index >= next.length) {
    return next;
  }
  const poly = polylinePoints(start, end, waypoints);
  const polyIndex = index + 1;
  const prev = poly[polyIndex - 1];
  const cur = poly[polyIndex];
  const nxt = poly[polyIndex + 1];
  const inHoriz = isSegmentHorizontal(prev, cur);
  const outHoriz = isSegmentHorizontal(cur, nxt);

  if (inHoriz && !outHoriz) {
    next[index] = { x: point.x, y: prev.y };
  } else if (!inHoriz && outHoriz) {
    next[index] = { x: prev.x, y: point.y };
  } else if (!inHoriz && !outHoriz) {
    next[index] = { x: prev.x, y: point.y };
  } else {
    next[index] = { x: point.x, y: point.y };
  }

  return simplifyOrthogonalWaypoints(start, end, next);
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
  click: Point,
  options?: { angleLock?: boolean; orthogonal?: boolean }
): Point[] {
  if (options?.orthogonal) {
    return addOrthogonalWaypointOnEdge(start, end, waypoints, click);
  }
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
  const target = options?.angleLock ? snapPointToAngle(a, click) : click;
  const bend = visibleBendPoint(a, b, target);
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
  delta: Point,
  options?: { angleLock?: boolean; orthogonal?: boolean }
): Point[] {
  if (options?.orthogonal && startWaypoints.length > 0) {
    return dragOrthogonalSegmentWaypoints(start, end, startWaypoints, segmentIndex, delta);
  }

  const applied = options?.angleLock ? snapDeltaToAngle(delta) : delta;
  const poly = polylinePoints(start, end, startWaypoints);

  if (startWaypoints.length === 0 && (Math.abs(applied.x) > 1 || Math.abs(applied.y) > 1)) {
    const a = poly[segmentIndex];
    const b = poly[segmentIndex + 1];
    const mid = { x: (a.x + b.x) / 2 + applied.x, y: (a.y + b.y) / 2 + applied.y };
    return [visibleBendPoint(a, b, mid)];
  }

  const result = startWaypoints.map((p) => ({ ...p }));
  const moveWp = (polyIndex: number) => {
    const wi = polyIndex - 1;
    if (wi >= 0 && wi < result.length) {
      result[wi].x += applied.x;
      result[wi].y += applied.y;
    }
  };

  moveWp(segmentIndex);
  moveWp(segmentIndex + 1);

  return result;
}

export function dragWaypointTo(
  start: Point,
  end: Point,
  waypoints: Point[],
  index: number,
  point: Point,
  options?: { angleLock?: boolean; orthogonal?: boolean }
): Point[] {
  if (options?.orthogonal) {
    return dragOrthogonalWaypointTo(start, end, waypoints, index, point);
  }
  const next = waypoints.map((p) => ({ ...p }));
  if (index < 0 || index >= next.length) {
    return next;
  }
  let placed = point;
  if (options?.angleLock) {
    const anchor = polylinePoints(start, end, waypoints)[index];
    placed = snapPointToAngle(anchor, point);
  }
  next[index] = placed;
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
    const waypoints = resolveEdgeWaypoints(edge, start, end, fromPort, toPort);
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
  const maxY = laneContentHeight(diagram) - nodeH - 8;
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
  return { laneHeaderHeight: LANE_HEADER_HEIGHT, canvasHeight: CANVAS_HEIGHT, lanes, nodes, edges };
}

export function variantForNewShape(shape: DiagramNode['shape']): DiagramNode['variant'] {
  return defaultNodeVariant(shape);
}
