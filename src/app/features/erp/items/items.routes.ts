import { Routes } from '@angular/router';
import { ItemDetailPageComponent } from './pages/item-detail-page.component';
import { ItemListPageComponent } from './pages/item-list-page.component';

export const itemsRoutes: Routes = [
  { path: '', component: ItemListPageComponent },
  { path: ':id', component: ItemDetailPageComponent },
];
