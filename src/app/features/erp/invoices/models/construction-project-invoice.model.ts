import type { InvoiceLineJson } from './sales-invoice.model';
import type { VoucherLineJson } from '../../vouchers/models/voucher.model';

export interface ConstructionProjectInvoiceJson {
  invoiceNumber: string;
  date: string;
  time: string;
  projectId: string | null;
  projectName: string | null;
  clientName: string | null;
  drLedgerId: number | null;
  crMaterialLedgerId: number | null;
  drLedgerName: string | null;
  crMaterialLedgerName: string | null;
  materialTotal: number;
  serviceTotal: number;
  totalAmount: number;
  materialLines: InvoiceLineJson[];
  serviceLines: VoucherLineJson[];
}
