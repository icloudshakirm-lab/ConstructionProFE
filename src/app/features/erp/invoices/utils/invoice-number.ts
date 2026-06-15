/** Daily sequence stored in sessionStorage so numbers stay stable per browser session. */
export function generateSalesInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const key = `sales-invoice-seq-${y}-${m}-${day}`;
  const raw = sessionStorage.getItem(key);
  const next = raw ? parseInt(raw, 10) + 1 : 1;
  sessionStorage.setItem(key, String(next));
  return `SI-${y}${m}${day}-${String(next).padStart(4, '0')}`;
}

export function generatePurchaseInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const key = `purchase-invoice-seq-${y}-${m}-${day}`;
  const raw = sessionStorage.getItem(key);
  const next = raw ? parseInt(raw, 10) + 1 : 1;
  sessionStorage.setItem(key, String(next));
  return `PI-${y}${m}${day}-${String(next).padStart(4, '0')}`;
}
