import { Routes } from '@angular/router';
import { ItemGroupDetailPageComponent } from './pages/item-group-detail-page.component';
import { ItemGroupListPageComponent } from './pages/item-group-list-page.component';

export const itemGroupsRoutes: Routes = [
  { path: '', component: ItemGroupListPageComponent },
  { path: ':id', component: ItemGroupDetailPageComponent },
];
