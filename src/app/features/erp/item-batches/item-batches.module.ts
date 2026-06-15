import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemBatchDetailPageComponent } from './pages/item-batch-detail-page.component';
import { ItemBatchListPageComponent } from './pages/item-batch-list-page.component';
import { itemBatchesRoutes } from './item-batches.routes';

@NgModule({
  imports: [
    RouterModule.forChild(itemBatchesRoutes),
    ItemBatchListPageComponent,
    ItemBatchDetailPageComponent,
  ],
})
export class ItemBatchesModule {}
