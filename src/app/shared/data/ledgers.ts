export interface LedgerOption {
  id: string;
  code: string;
  name: string;
  /** Ledger group (e.g. from chart of accounts). */
  groupId?: string;
}

/** Sample ledgers for Dr / Cr dropdowns (replace with API later). */
export const MOCK_LEDGERS: LedgerOption[] = [
  { id: 'lg-1', code: 'DEB', name: 'General Debtors' },
  { id: 'lg-2', code: 'BANK', name: 'Bank Current Account' },
  { id: 'lg-3', code: 'SAL', name: 'Sales Account' },
  { id: 'lg-4', code: 'GST', name: 'GST Output' },
  { id: 'lg-5', code: 'STK', name: 'Stock in Trade' },
];
