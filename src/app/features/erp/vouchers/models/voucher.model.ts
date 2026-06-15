export interface VoucherLineJson {
  id: string;
  ledgerId: number | null;
  ledgerName: string | null;
  description: string;
  amount: number;
}

export interface VoucherJson {
  voucherNumber: string;
  date: string;
  time: string;
  headerLedgerId: number | null;
  headerLedgerName: string | null;
  totalAmount: number;
  lines: VoucherLineJson[];
}
