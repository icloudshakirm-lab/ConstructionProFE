import { Routes } from '@angular/router';
import { QuotationFormPageComponent } from './pages/quotation-form-page.component';
import { QuotationListPageComponent } from './pages/quotation-list-page.component';

export const quotationsRoutes: Routes = [
  { path: '', component: QuotationListPageComponent },
  { path: 'new', component: QuotationFormPageComponent },
  { path: ':id/edit', component: QuotationFormPageComponent },
];
