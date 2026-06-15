export type DocumentStatusSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const STATUS_SEVERITY: Record<string, DocumentStatusSeverity> = {
  draft: 'secondary',
  pending: 'warn',
  dispatched: 'info',
  delivered: 'success',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warn',
  approved: 'success',
  ordered: 'info',
  received: 'success',
  cancelled: 'danger',
};

/** PrimeNG p-tag severity — matches ConstructPro feature pages. */
export function documentStatusSeverity(status: string | null | undefined): DocumentStatusSeverity {
  const key = status?.trim().toLowerCase() ?? '';
  return STATUS_SEVERITY[key] ?? 'secondary';
}
