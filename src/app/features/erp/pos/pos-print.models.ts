/** sessionStorage key for POS → print page handoff. */
export const POS_PRINT_STORAGE_KEY = 'netledgers.pos-print.v1';

/** Replace with your real company / branch details (or load from API later). */
export interface PosCompanyPrintDetails {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  taxId?: string;
}

export const DEFAULT_POS_COMPANY_PRINT: PosCompanyPrintDetails = {
  name: 'Test Company',
  addressLine1: 'G14',
};

export interface PosPrintLine {
  lineKind: 'sale' | 'return';
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface PosPrintPayload {
  voucherNumber: string;
  printedAt: string;
  company: PosCompanyPrintDetails;
  lines: PosPrintLine[];
  /** Sum of line amounts excluding GST (taxable base for POS GST). */
  netTotal: number;
  gstRatePercent: number;
  gstAmount: number;
  /** Amount payable including GST (netTotal + gstAmount). */
  totalIncGst: number;
  paymentMethod: 'card' | 'cash';
  paidAmount: number;
  receivedAmount: number;
  balanceToReturn: number;
}

/** Plain text encoded in the receipt QR: company, address line(s), invoice total. */
export function posPrintQrPayloadText(p: PosPrintPayload): string {
  const lines: string[] = [p.company.name.trim()];
  for (const line of [p.company.addressLine1, p.company.addressLine2]) {
    const s = line?.trim();
    if (s) {
      lines.push(s);
    }
  }
  const total = Number.isFinite(p.totalIncGst)
    ? p.totalIncGst
    : Number.isFinite(p.netTotal)
      ? p.netTotal
      : 0;
  lines.push(`Total: ${total.toFixed(2)}`);
  return lines.join('\n');
}
