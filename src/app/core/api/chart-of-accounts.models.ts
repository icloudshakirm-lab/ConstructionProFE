/**
 * Tree payload for chart of accounts (`isGroup` distinguishes ledger groups vs ledgers).
 * Align this with your backend when the API is ready.
 */
export interface ChartOfAccountsTreeNode {
  id: number;
  name: string;
  isGroup: boolean;
  code?: string | null;
  description?: string | null;
  children?: ChartOfAccountsTreeNode[];
}
