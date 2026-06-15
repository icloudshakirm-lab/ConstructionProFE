import { Routes } from '@angular/router';
import { DnFormPageComponent } from './pages/dn-form-page.component';
import { DnListPageComponent } from './pages/dn-list-page.component';

export const deliveryNotesRoutes: Routes = [
  { path: '', component: DnListPageComponent },
  { path: 'new', component: DnFormPageComponent },
  { path: ':id/edit', component: DnFormPageComponent },
];
