/** Serializable JSON shape for a sales invoice (persist / API). */
export interface SalesInvoiceJson {
  invoiceNumber: string;
  date: string;
  time: string;
  drLedgerId: number | null;
  crLedgerId: number | null;
  drLedgerName: string | null;
  crLedgerName: string | null;
  /** Sum of all line amounts (same sign as stored on lines). */
  totalAmount: number;
  lines: InvoiceLineJson[];
}

export type InvoiceLineKind = 'sale' | 'return';

export interface InvoiceLineJson {
  id: string;
  lineKind: InvoiceLineKind;
  itemId?: number | null;
  itemName: string;
  batch: string;
  batchId?: number | null;
  qty: number;
  rate: number;
  amount: number;
}
