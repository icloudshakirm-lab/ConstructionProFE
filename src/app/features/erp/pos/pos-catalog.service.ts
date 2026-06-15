import { Injectable } from '@angular/core';
import type { ItemWithBatchesDto } from '../../../core/api/erp-api.models';
import { STOCK_ITEM_SELECT_OPTIONS } from '../../../shared/data/stock-items';

/** Resolved product for a barcode / SKU scan. */
export interface PosCatalogHit {
  sku: string;
  itemName: string;
  defaultRate: number;
  /** Batch key for merging lines; from API batch name when present, else POS uses current ISO week (demo SKUs). */
  batchKey?: string;
  batchId?: number;
}

/** Map `GET /items/by-barcode/{barcode}` to a cart line seed (no unit price in API yet). */
export function posHitFromItemWithBatches(dto: ItemWithBatchesDto): PosCatalogHit {
  const b = dto.batches?.[0];
  return {
    sku: String(dto.item.id),
    itemName: dto.item.name,
    defaultRate: b?.defaultPrice ?? 0,
    batchKey: b?.name,
    batchId: b?.batchId,
  };
}

/** Sample EAN-style codes → SKU (scanners often emit digits only). */
const BARCODE_TO_SKU: Record<string, string> = {
  '5012345678901': 'SKU-1001',
  '5012345678902': 'SKU-1002',
  '5012345678903': 'SKU-1003',
  '5012345678904': 'SKU-2001',
  '5012345678905': 'SKU-2002',
  '8901234567001': 'SKU-3001',
  '8901234567002': 'SKU-3002',
  '8901234567003': 'SKU-3003',
};

const DEFAULT_RATE_BY_SKU: Record<string, number> = {
  'SKU-1001': 149.99,
  'SKU-1002': 45.5,
  'SKU-1003': 12.0,
  'SKU-2001': 250.0,
  'SKU-2002': 18.75,
  'SKU-3001': 850.0,
  'SKU-3002': 120.0,
  'SKU-3003': 450.0,
};

@Injectable({ providedIn: 'root' })
export class PosCatalogService {
  /**
   * Resolve a scan to catalog data. Matches: known barcodes, then SKU text (e.g. SKU-1001).
   * Replace or extend with `HttpClient.get('/items/by-barcode/...')` when the API is ready.
   */
  resolveScan(raw: string): PosCatalogHit | null {
    const code = raw.trim();
    if (!code) {
      return null;
    }
    const skuFromBarcode = BARCODE_TO_SKU[code] ?? BARCODE_TO_SKU[code.toUpperCase()];
    if (skuFromBarcode) {
      const item = STOCK_ITEM_SELECT_OPTIONS.find((o) => o.sku === skuFromBarcode);
      if (!item) {
        return null;
      }
      return {
        sku: item.sku,
        itemName: item.name,
        defaultRate: DEFAULT_RATE_BY_SKU[item.sku] ?? 0,
      };
    }
    const upper = code.toUpperCase();
    const bySku = STOCK_ITEM_SELECT_OPTIONS.find(
      (o) => o.sku.toUpperCase() === upper || o.sku === code,
    );
    if (bySku) {
      return {
        sku: bySku.sku,
        itemName: bySku.name,
        defaultRate: DEFAULT_RATE_BY_SKU[bySku.sku] ?? 0,
      };
    }
    return null;
  }

  /** Search catalog by name/SKU fragement for the F3 Search Modal. */
  searchByName(term: string): PosCatalogHit[] {
    const frag = term.toLowerCase().trim();
    if (!frag) return [];
    return STOCK_ITEM_SELECT_OPTIONS.filter(
      (o) => o.sku.toLowerCase().includes(frag) || o.name.toLowerCase().includes(frag),
    ).map((o) => ({
      sku: o.sku,
      itemName: o.name,
      defaultRate: DEFAULT_RATE_BY_SKU[o.sku] ?? 0,
    }));
  }
}
