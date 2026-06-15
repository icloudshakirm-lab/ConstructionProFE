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

export function parseNextPoNumber(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return '';
  }
  try {
    const parsed = JSON.parse(t) as unknown;
    return typeof parsed === 'string' ? parsed : t;
  } catch {
    return t.replace(/^"|"$/g, '');
  }
}

export function lineAmountPreview(qty: number, unitPrice: number, tax: number): number {
  return qty * unitPrice + tax;
}
