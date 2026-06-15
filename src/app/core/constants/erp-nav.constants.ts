export interface ErpNavItem {
  label: string;
  route: string;
  icon: string;
  children?: ErpNavItem[];
}

/** Sidebar navigation for NetLedgers ERP features (shared API). */
export const ERP_NAV_ITEMS: ErpNavItem[] = [
  { label: 'ERP Dashboard', route: '/erp/dashboard', icon: 'pi pi-home' },
  {
    label: 'Item Master',
    route: '/erp/item-master',
    icon: 'pi pi-box',
    children: [
      { label: 'Items', route: '/erp/items', icon: 'pi pi-box' },
      { label: 'Item Groups', route: '/erp/item-groups', icon: 'pi pi-th-large' },
      { label: 'Item Batches', route: '/erp/item-batches', icon: 'pi pi-tags' },
      { label: 'Item Categories', route: '/erp/item-categories', icon: 'pi pi-folder' },
      { label: 'Price Lists', route: '/erp/price-lists', icon: 'pi pi-list' },
      { label: 'Vendor Price List', route: '/erp/vendors-price-list', icon: 'pi pi-briefcase' },
      { label: 'POS Price List', route: '/erp/pos-price-list', icon: 'pi pi-tag' },
      { label: 'Units of Measure', route: '/erp/units', icon: 'pi pi-sliders-h' },
      { label: 'Godowns', route: '/erp/godowns', icon: 'pi pi-warehouse' }
    ]
  },
  {
    label: 'Account Master',
    route: '/erp/account-master',
    icon: 'pi pi-book',
    children: [
      { label: 'Chart of Accounts', route: '/erp/chart-of-accounts', icon: 'pi pi-sitemap' },
      { label: 'Ledgers', route: '/erp/ledgers', icon: 'pi pi-wallet' },
      { label: 'Ledger Groups', route: '/erp/ledger-groups', icon: 'pi pi-folder-open' },
      { label: 'Cost Centers', route: '/erp/cost-centers', icon: 'pi pi-compass' },
      { label: 'Cost Categories', route: '/erp/cost-categories', icon: 'pi pi-bookmark' },
      { label: 'Currencies', route: '/erp/currencies', icon: 'pi pi-dollar' },
      { label: 'Exchange Rates', route: '/erp/currency-exchange-rates', icon: 'pi pi-sync' }
    ]
  },
  {
    label: 'Transactions',
    route: '/erp/transactions-menu',
    icon: 'pi pi-arrow-right-arrow-left',
    children: [
      { label: 'Point of Sale', route: '/erp/pos', icon: 'pi pi-shopping-cart' },
      { label: 'Sales Invoice', route: '/erp/invoices/sales', icon: 'pi pi-file-export' },
      { label: 'Construction Project Invoice', route: '/erp/invoices/construction', icon: 'pi pi-building' },
      { label: 'Purchase Invoice', route: '/erp/invoices/purchase', icon: 'pi pi-file-import' },
      { label: 'Payment Voucher', route: '/erp/vouchers/payment', icon: 'pi pi-credit-card' },
      { label: 'Receipt Voucher', route: '/erp/vouchers/receipt', icon: 'pi pi-wallet' },
      { label: 'Manufacturing', route: '/erp/vouchers/manufacturing', icon: 'pi pi-wrench' }
    ]
  },
  {
    label: 'Inventory',
    route: '/erp/inventory-transactions',
    icon: 'pi pi-truck',
    children: [
      { label: 'Purchase Orders', route: '/erp/inventory-transactions/po', icon: 'pi pi-clipboard' },
      { label: 'Quotations', route: '/erp/inventory-transactions/quotations', icon: 'pi pi-comment' },
      {
        label: 'Delivery Notes',
        route: '/erp/inventory-transactions/delivery-notes',
        icon: 'pi pi-send'
      }
    ]
  },
  {
    label: 'Reports',
    route: '/erp/reports',
    icon: 'pi pi-chart-bar',
    children: [
      { label: 'Reports Home', route: '/erp/reports', icon: 'pi pi-chart-pie' },
      { label: 'Day Book', route: '/erp/transactions', icon: 'pi pi-book' },
      {
        label: 'Ledger Closing Balance',
        route: '/erp/reports/ledgers/closing-balance',
        icon: 'pi pi-wallet'
      },
      {
        label: 'Ledger Transactions',
        route: '/erp/reports/ledgers/transactions',
        icon: 'pi pi-list'
      }
    ]
  },
  {
    label: 'Stock Reports',
    route: '/erp/stocks',
    icon: 'pi pi-database',
    children: [
      {
        label: 'Items Closing Balance',
        route: '/erp/reports/stock/items-closing-balance',
        icon: 'pi pi-box'
      },
      { label: 'Items by Group', route: '/erp/reports/stock/items-by-group', icon: 'pi pi-th-large' },
      { label: 'Batches by Item', route: '/erp/reports/stock/batches-by-item', icon: 'pi pi-tags' }
    ]
  },
  {
    label: 'Final Reports',
    route: '/erp/final-reports',
    icon: 'pi pi-chart-line',
    children: [
      { label: 'Trial Balance', route: '/erp/final-reports/trial-balance', icon: 'pi pi-calculator' },
      { label: 'Profit & Loss', route: '/erp/final-reports/profit-and-loss', icon: 'pi pi-chart-line' },
      {
        label: 'Cost of Goods Sold',
        route: '/erp/final-reports/cost-of-goods-sold',
        icon: 'pi pi-shopping-bag'
      },
      { label: 'Balance Sheet', route: '/erp/final-reports/balance-sheet', icon: 'pi pi-table' }
    ]
  },
  { label: 'Company Info', route: '/erp/company-info', icon: 'pi pi-building' },
  {
    label: 'Users & Access',
    route: '/erp/users-access',
    icon: 'pi pi-users',
    children: [
      { label: 'Users', route: '/erp/users', icon: 'pi pi-user' },
      { label: 'Roles & Permissions', route: '/erp/roles', icon: 'pi pi-shield' },
      { label: 'Shift Management', route: '/erp/shifts', icon: 'pi pi-clock' }
    ]
  },
  {
    label: 'System Setup',
    route: '/erp/system-setup',
    icon: 'pi pi-cog',
    children: [
      { label: 'Branches / Stores', route: '/erp/branches', icon: 'pi pi-map-marker' },
      { label: 'Tills', route: '/erp/tills', icon: 'pi pi-inbox' },
      { label: 'Till Assignments', route: '/erp/till-assignments', icon: 'pi pi-user-plus' },
      { label: 'POS Counters', route: '/erp/pos-counters', icon: 'pi pi-desktop' },
      { label: 'Hardware Settings', route: '/erp/hardware', icon: 'pi pi-print' },
      { label: 'General Configs', route: '/erp/configs', icon: 'pi pi-sliders-h' }
    ]
  }
];
