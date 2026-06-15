import { Routes } from '@angular/router';
import { PoFormPageComponent } from './pages/po-form-page.component';
import { PoListPageComponent } from './pages/po-list-page.component';

export const purchaseOrdersRoutes: Routes = [
  { path: '', component: PoListPageComponent },
  { path: 'new', component: PoFormPageComponent },
  { path: ':id/edit', component: PoFormPageComponent },
];
