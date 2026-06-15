export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultFromDateLocal(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

export function defaultToDateLocal(): string {
  return toDatetimeLocalValue(new Date());
}

export function datetimeLocalToIso(local: string): string {
  return new Date(local).toISOString();
}

export function apiErrorMessage(e: unknown): string {
  const err = e as {
    error?: string | { detail?: string; title?: string; message?: string };
    message?: string;
    status?: number;
  };
  if (typeof err.error === 'string' && err.error.trim()) {
    return err.error.trim();
  }
  const body = err.error;
  if (body && typeof body === 'object') {
    return body.detail ?? body.title ?? body.message ?? err.message ?? 'Request failed';
  }
  if (err.status) {
    return `Request failed (${err.status})`;
  }
  return err.message ?? 'Request failed';
}
