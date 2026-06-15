/** Stock / product row for searchable item pickers (replace with API later). */
export interface StockItemSelectOption {
  sku: string;
  name: string;
  /** Shown in the list and used for search (sku + name). */
  label: string;
}

const raw = [
  { sku: 'SKU-1001', name: 'Finished good — Assembly A' },
  { sku: 'SKU-1002', name: 'Raw material — Steel sheet' },
  { sku: 'SKU-1003', name: 'Packaging — Carton medium' },
  { sku: 'SKU-2001', name: 'Service — Installation' },
  { sku: 'SKU-2002', name: 'Spare part — Motor belt' },
  { sku: 'SKU-3001', name: 'Premium Coffee — 500g' },
  { sku: 'SKU-3002', name: 'Whole Wheat Bread' },
  { sku: 'SKU-3003', name: 'Organic Honey — 250ml' },
];

export const STOCK_ITEM_SELECT_OPTIONS: StockItemSelectOption[] = raw.map((r) => ({
  ...r,
  label: `${r.sku} — ${r.name}`,
}));
