/** Point where a ray from rect center toward `target` exits the rectangle border. */
export function rectBorderToward(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return { x: centerX, y: centerY };
  }

  const halfW = width / 2;
  const halfH = height / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Number.POSITIVE_INFINITY;
  const scale = Math.min(scaleX, scaleY);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale
  };
}

/** Rect center and size relative to a host element. */
export function rectRelativeToHost(
  element: HTMLElement,
  host: HTMLElement
): { cx: number; cy: number; width: number; height: number } {
  const hostRect = host.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    cx: rect.left + rect.width / 2 - hostRect.left,
    cy: rect.top + rect.height / 2 - hostRect.top,
    width: rect.width,
    height: rect.height
  };
}
