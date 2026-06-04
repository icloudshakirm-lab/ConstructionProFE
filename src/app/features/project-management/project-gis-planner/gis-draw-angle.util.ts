import * as L from 'leaflet';

/** Bearings / deflections highlighted while drawing (Esri-style). */
export const GIS_SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
export const GIS_SNAP_DEFLECTIONS = [0, 45, 90, 135, 180] as const;
export const GIS_ANGLE_SNAP_TOLERANCE_DEG = 6;

export interface DrawAngleInfo {
  bearingDeg: number;
  bearingLabel: string;
  deflectionDeg: number | null;
  deflectionLabel: string | null;
  snapped: boolean;
}

/** Screen-space bearing from north, clockwise (0° = north). */
export function segmentBearingDeg(from: L.LatLng, to: L.LatLng, map: L.Map): number {
  const a = map.latLngToLayerPoint(from);
  const b = map.latLngToLayerPoint(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg * 10) / 10;
}

/** Signed turn from inbound segment to outbound (negative = left, positive = right). */
export function signedDeflectionDeg(inBearing: number, outBearing: number): number {
  let diff = outBearing - inBearing;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return Math.round(diff * 10) / 10;
}

/** Turn angle magnitude between two consecutive segments (0° = straight, 180° = reverse). */
export function deflectionBetweenBearings(bearingIn: number, bearingOut: number): number {
  return Math.abs(signedDeflectionDeg(bearingIn, bearingOut));
}

export function nearestSnapAngle(value: number, candidates: readonly number[]): number {
  const normalized = ((value % 360) + 360) % 360;
  let best = candidates[0];
  let bestDelta = 360;
  for (const c of candidates) {
    let delta = Math.abs(normalized - c);
    if (delta > 180) delta = 360 - delta;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = c;
    }
  }
  return best;
}

export function snapBearingIfClose(
  bearing: number,
  candidates: readonly number[],
  tolerance = GIS_ANGLE_SNAP_TOLERANCE_DEG
): { bearing: number; snapped: boolean } {
  const target = nearestSnapAngle(bearing, candidates);
  let delta = Math.abs(bearing - target);
  if (delta > 180) delta = 360 - delta;
  if (delta <= tolerance) {
    return { bearing: target, snapped: true };
  }
  return { bearing, snapped: false };
}

export function snapSignedDeflectionIfClose(
  signedDeflection: number,
  tolerance = GIS_ANGLE_SNAP_TOLERANCE_DEG
): { deflection: number; snapped: boolean } {
  const magnitude = Math.abs(signedDeflection);
  const target = nearestSnapAngle(magnitude, GIS_SNAP_DEFLECTIONS);
  if (Math.abs(magnitude - target) <= tolerance) {
    return {
      deflection: signedDeflection >= 0 ? target : -target,
      snapped: true
    };
  }
  return { deflection: signedDeflection, snapped: false };
}

function normalizeBearing(deg: number): number {
  let bearing = deg;
  if (bearing < 0) bearing += 360;
  if (bearing >= 360) bearing -= 360;
  return bearing;
}

function latLngFromBearing(lastPt: L.Point, dist: number, bearingDeg: number, map: L.Map): L.LatLng {
  const rad = (bearingDeg * Math.PI) / 180;
  const snappedPt = L.point(
    lastPt.x + Math.sin(rad) * dist,
    lastPt.y - Math.cos(rad) * dist
  );
  return map.layerPointToLatLng(snappedPt);
}

/** Snap cursor only when within tolerance; preserves turn direction on multi-segment lines. */
export function snapDrawLatLng(
  last: L.LatLng,
  cursor: L.LatLng,
  map: L.Map,
  previous?: L.LatLng,
  lockAngles = true
): L.LatLng {
  if (!lockAngles) return cursor;

  const lastPt = map.latLngToLayerPoint(last);
  const cursorPt = map.latLngToLayerPoint(cursor);
  const dist = lastPt.distanceTo(cursorPt);
  if (dist < 4) return cursor;

  let bearing = segmentBearingDeg(last, cursor, map);

  if (previous) {
    const inBearing = segmentBearingDeg(previous, last, map);
    const signed = signedDeflectionDeg(inBearing, bearing);
    const snap = snapSignedDeflectionIfClose(signed);
    if (snap.snapped) {
      bearing = normalizeBearing(inBearing + snap.deflection);
    }
  } else {
    const snap = snapBearingIfClose(bearing, GIS_SNAP_ANGLES);
    if (snap.snapped) {
      bearing = snap.bearing;
    }
  }

  return latLngFromBearing(lastPt, dist, bearing, map);
}

export function formatBearingLabel(deg: number): string {
  const rounded = Math.round(deg);
  const cardinals: Record<number, string> = {
    0: 'N',
    45: 'NE',
    90: 'E',
    135: 'SE',
    180: 'S',
    225: 'SW',
    270: 'W',
    315: 'NW'
  };
  const card = cardinals[rounded];
  return card ? `${rounded}° (${card})` : `${rounded}°`;
}

export function formatDeflectionLabel(deg: number): string {
  const rounded = Math.round(Math.abs(deg));
  if (rounded === 0) return '0° (straight)';
  if (rounded === 90) return '90° (right angle)';
  if (rounded === 180) return '180° (reverse)';
  if (rounded === 45) return '45°';
  if (rounded === 135) return '135°';
  const dir = deg < 0 ? 'left' : 'right';
  return `${rounded}° (${dir})`;
}

export function getDrawAngleInfo(
  markers: L.LatLng[],
  cursor: L.LatLng,
  map: L.Map,
  lockAngles = true
): DrawAngleInfo | null {
  if (!markers.length) return null;

  const last = markers[markers.length - 1];
  const previous = markers.length >= 2 ? markers[markers.length - 2] : undefined;
  const displayCursor = snapDrawLatLng(last, cursor, map, previous, lockAngles);
  const rawBearing = segmentBearingDeg(last, cursor, map);
  const bearingDeg = segmentBearingDeg(last, displayCursor, map);

  let deflectionDeg: number | null = null;
  let deflectionLabel: string | null = null;
  let snapped = false;

  if (markers.length >= 2) {
    const prev = markers[markers.length - 2];
    const inBearing = segmentBearingDeg(prev, last, map);
    const rawSigned = signedDeflectionDeg(inBearing, rawBearing);
    deflectionDeg = rawSigned;
    deflectionLabel = formatDeflectionLabel(rawSigned);
    if (lockAngles) {
      const defSnap = snapSignedDeflectionIfClose(rawSigned);
      deflectionDeg = defSnap.deflection;
      deflectionLabel = formatDeflectionLabel(defSnap.deflection);
      snapped = defSnap.snapped;
    }
  } else if (lockAngles) {
    const bearingSnap = snapBearingIfClose(rawBearing, GIS_SNAP_ANGLES);
    snapped = bearingSnap.snapped;
  }

  const bearingLabel = formatBearingLabel(lockAngles && snapped ? bearingDeg : rawBearing);

  return {
    bearingDeg: lockAngles && snapped ? bearingDeg : rawBearing,
    bearingLabel,
    deflectionDeg,
    deflectionLabel,
    snapped
  };
}

export function buildAngleTooltipSubtext(info: DrawAngleInfo | null): string {
  if (!info) return '';
  const parts: string[] = [];
  if (info.deflectionLabel) {
    parts.push(`Turn: ${info.deflectionLabel}`);
  }
  parts.push(`Bearing: ${info.bearingLabel}`);
  if (info.snapped) {
    parts.push('locked');
  }
  return parts.join(' · ');
}

/** Guide-ray bearings from a vertex: absolute for first segment, deflection-based after. */
export function guideBearingsFromVertex(
  previous: L.LatLng | undefined,
  last: L.LatLng,
  map: L.Map
): number[] {
  if (!previous) {
    return [...GIS_SNAP_ANGLES];
  }
  const inBearing = segmentBearingDeg(previous, last, map);
  const bearings = new Set<number>();
  for (const turn of GIS_SNAP_DEFLECTIONS) {
    bearings.add(normalizeBearing(inBearing + turn));
    if (turn !== 0) {
      bearings.add(normalizeBearing(inBearing - turn));
    }
  }
  return [...bearings];
}
