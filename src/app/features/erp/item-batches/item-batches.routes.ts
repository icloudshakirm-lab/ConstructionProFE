import { Routes } from '@angular/router';
import { ItemBatchDetailPageComponent } from './pages/item-batch-detail-page.component';
import { ItemBatchListPageComponent } from './pages/item-batch-list-page.component';

export const itemBatchesRoutes: Routes = [
  { path: '', component: ItemBatchListPageComponent },
  { path: ':id', component: ItemBatchDetailPageComponent },
];
