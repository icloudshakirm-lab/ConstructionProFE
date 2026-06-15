/** Chart group for new ledger popup (replace with API later). */
export interface LedgerGroupOption {
  id: string;
  name: string;
  /** Display + filter text for p-select. */
  label: string;
}

const groups = [
  { id: 'grp-sd', name: 'Sundry Debtors' },
  { id: 'grp-sc', name: 'Sundry Creditors' },
  { id: 'grp-bank', name: 'Bank Accounts' },
  { id: 'grp-cash', name: 'Cash & equivalents' },
  { id: 'grp-sales', name: 'Sales & income' },
  { id: 'grp-purchase', name: 'Purchase & expenses' },
  { id: 'grp-duties', name: 'Duties & taxes' },
  { id: 'grp-stock', name: 'Stock-in-trade' },
];

export const LEDGER_GROUP_SELECT_OPTIONS: LedgerGroupOption[] = groups.map((g) => ({
  ...g,
  label: g.name,
}));
