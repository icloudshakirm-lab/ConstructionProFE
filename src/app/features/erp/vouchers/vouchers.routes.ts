import { Routes } from '@angular/router';

export const vouchersRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'receipt' },
  {
    path: 'receipt',
    loadComponent: () =>
      import('./receipt-voucher/receipt-voucher.component').then(
        (m) => m.ReceiptVoucherComponent,
      ),
  },
  {
    path: 'receipt/:id',
    loadComponent: () =>
      import('./receipt-voucher/receipt-voucher.component').then(
        (m) => m.ReceiptVoucherComponent,
      ),
  },
  {
    path: 'payment',
    loadComponent: () =>
      import('./payment-voucher/payment-voucher.component').then(
        (m) => m.PaymentVoucherComponent,
      ),
  },
  {
    path: 'payment/:id',
    loadComponent: () =>
      import('./payment-voucher/payment-voucher.component').then(
        (m) => m.PaymentVoucherComponent,
      ),
  },
  {
    path: 'manufacturing',
    loadComponent: () =>
      import('./manufacturing-voucher/manufacturing-voucher.component').then(
        (m) => m.ManufacturingVoucherComponent,
      ),
  },
];
