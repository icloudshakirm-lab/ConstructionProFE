export type WbsPriority = 'critical' | 'high' | 'medium' | 'low';

export const WBS_PRIORITY_OPTIONS: { label: string; value: WbsPriority }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
];

/** CSS custom properties in `styles/_theme-tokens.scss` (--cp-wbs-priority-*). */
export const WBS_PRIORITY_CSS_VARS: Record<WbsPriority, string> = {
  critical: 'var(--cp-wbs-priority-critical)',
  high: 'var(--cp-wbs-priority-high)',
  medium: 'var(--cp-wbs-priority-medium)',
  low: 'var(--cp-wbs-priority-low)'
};

export function priorityBarClass(priority: WbsPriority): string {
  return `wbs-priority-bar--${priority}`;
}

/** Aligns with PrimeNG tag severities used elsewhere in the app. */
export function priorityTagSeverity(
  priority: WbsPriority
): 'danger' | 'warn' | 'info' | 'secondary' {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warn';
    case 'medium':
      return 'info';
    default:
      return 'secondary';
  }
}

export function formatDisplayDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Offset days from milestone target for demo task due dates. */
export function dueDateFromMilestoneTarget(targetDate: string | undefined, offsetDays: number): string {
  if (!targetDate) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(targetDate + 'T00:00:00');
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
