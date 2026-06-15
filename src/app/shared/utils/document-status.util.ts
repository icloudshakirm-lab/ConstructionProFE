const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  dispatched: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  sent: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  approved: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
  ordered: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  received: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
};

const BASE_BADGE_CLASS =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

export function documentStatusBadgeClass(status: string | null | undefined): string {
  const key = status?.trim().toLowerCase() ?? '';
  const color = STATUS_BADGE_CLASSES[key] ?? STATUS_BADGE_CLASSES['draft'];
  return `${BASE_BADGE_CLASS} ${color}`;
}
