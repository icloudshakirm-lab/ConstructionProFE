export interface BoqLineItem {
  id: string;
  itemNo: string;
  itemCode: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

export interface BoqSection {
  id: string;
  code: string;
  title: string;
  /** Parent section for multi-level BOQ (e.g. Civil Works → Excavation). */
  parentId: string | null;
  items: BoqLineItem[];
}

export interface BoqProjectOption {
  label: string;
  value: string;
}

export const BOQ_PROJECTS: BoqProjectOption[] = [
  { label: 'Tower Block A — Main Contract', value: 'tower-a' },
  { label: 'Warehouse Expansion — Phase 2', value: 'warehouse-p2' },
  { label: 'Roadworks Package — Section C', value: 'roadworks-c' }
];

export const BOQ_UNITS: string[] = [
  'm²',
  'm³',
  'Kg',
  'Nos',
  'Ltr',
  'Rm',
  'MT',
  'LS',
  'Day',
  'Hour'
];

export interface ItemCodeOption {
  code: string;
  description: string;
  unit: string;
  typicalRate: number;
}

export const ITEM_CODE_CATALOG: ItemCodeOption[] = [
  { code: 'EXC-001', description: 'Earth Excavation', unit: 'm³', typicalRate: 450 },
  { code: 'CON-001', description: 'Plain Cement Concrete 1:4:8', unit: 'm³', typicalRate: 15000 },
  { code: 'RCC-001', description: 'Reinforced Concrete M25', unit: 'm³', typicalRate: 28000 },
  { code: 'STL-001', description: 'Reinforcement Steel', unit: 'Kg', typicalRate: 280 },
  { code: 'A1', description: 'Site Clearance', unit: 'm²', typicalRate: 50 },
  { code: 'A2', description: 'Excavation', unit: 'm³', typicalRate: 450 },
  { code: 'B1', description: 'PCC 1:4:8', unit: 'm³', typicalRate: 15000 },
  { code: 'B2', description: 'RCC M25', unit: 'm³', typicalRate: 28000 },
  { code: 'ELC-001', description: 'Electrical Wiring', unit: 'Rm', typicalRate: 120 },
  { code: 'MEC-001', description: 'DB Installation', unit: 'Nos', typicalRate: 8500 }
];

export const DEMO_BOQ_SECTIONS: BoqSection[] = [
  {
    id: 'sec-civil',
    code: 'CIV',
    title: 'Civil Works',
    parentId: null,
    items: []
  },
  {
    id: 'sec-exc',
    code: 'CIV-EXC',
    title: 'Excavation',
    parentId: 'sec-civil',
    items: [
      {
        id: 'li-1',
        itemNo: '1',
        itemCode: 'EXC-001',
        description: 'Earth Excavation',
        unit: 'm³',
        qty: 500,
        rate: 450
      }
    ]
  },
  {
    id: 'sec-fnd',
    code: 'CIV-FND',
    title: 'Foundation',
    parentId: 'sec-civil',
    items: [
      {
        id: 'li-2',
        itemNo: '1',
        itemCode: 'CON-001',
        description: 'Plain Cement Concrete',
        unit: 'm³',
        qty: 120,
        rate: 15000
      }
    ]
  },
  {
    id: 'sec-a',
    code: 'A',
    title: 'Earth Work',
    parentId: null,
    items: [
      {
        id: 'li-a1',
        itemNo: 'A1',
        itemCode: 'A1',
        description: 'Site Clearance',
        unit: 'm²',
        qty: 1000,
        rate: 50
      },
      {
        id: 'li-a2',
        itemNo: 'A2',
        itemCode: 'A2',
        description: 'Excavation',
        unit: 'm³',
        qty: 500,
        rate: 450
      }
    ]
  },
  {
    id: 'sec-b',
    code: 'B',
    title: 'Concrete Work',
    parentId: null,
    items: [
      {
        id: 'li-b1',
        itemNo: 'B1',
        itemCode: 'B1',
        description: 'PCC 1:4:8',
        unit: 'm³',
        qty: 50,
        rate: 15000
      },
      {
        id: 'li-b2',
        itemNo: 'B2',
        itemCode: 'B2',
        description: 'RCC M25',
        unit: 'm³',
        qty: 100,
        rate: 28000
      }
    ]
  },
  {
    id: 'sec-struct',
    code: 'STR',
    title: 'Structural Works',
    parentId: null,
    items: []
  },
  {
    id: 'sec-col',
    code: 'STR-COL',
    title: 'Columns',
    parentId: 'sec-struct',
    items: [
      {
        id: 'li-rcc',
        itemNo: '1',
        itemCode: 'RCC-001',
        description: 'Reinforced Concrete',
        unit: 'm³',
        qty: 80,
        rate: 28000
      }
    ]
  },
  {
    id: 'sec-stl',
    code: 'STR-STL',
    title: 'Reinforcement',
    parentId: 'sec-struct',
    items: [
      {
        id: 'li-stl',
        itemNo: '2',
        itemCode: 'STL-001',
        description: 'Reinforcement Steel',
        unit: 'Kg',
        qty: 12000,
        rate: 280
      }
    ]
  }
];

export function lineAmount(item: BoqLineItem): number {
  return roundMoney(item.qty * item.rate);
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
