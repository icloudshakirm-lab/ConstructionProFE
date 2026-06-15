import { Routes } from '@angular/router';
import { SalesInvoiceComponent } from './sales-invoice/sales-invoice.component';

export const invoicesRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sales' },
  { path: 'sales', component: SalesInvoiceComponent },
  { path: 'sales/:id', component: SalesInvoiceComponent },
  {
    path: 'purchase',
    loadComponent: () =>
      import('./purchase-invoice/purchase-invoice.component').then(
        (m) => m.PurchaseInvoiceComponent,
      ),
  },
  {
    path: 'purchase/:id',
    loadComponent: () =>
      import('./purchase-invoice/purchase-invoice.component').then(
        (m) => m.PurchaseInvoiceComponent,
      ),
  },
  {
    path: 'construction',
    loadComponent: () =>
      import('./construction-project-invoice/construction-project-invoice.component').then(
        (m) => m.ConstructionProjectInvoiceComponent,
      ),
  },
  {
    path: 'construction/:id',
    loadComponent: () =>
      import('./construction-project-invoice/construction-project-invoice.component').then(
        (m) => m.ConstructionProjectInvoiceComponent,
      ),
  },
];
