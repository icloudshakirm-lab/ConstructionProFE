import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemDetailPageComponent } from './pages/item-detail-page.component';
import { ItemListPageComponent } from './pages/item-list-page.component';
import { itemsRoutes } from './items.routes';

@NgModule({
  imports: [
    RouterModule.forChild(itemsRoutes),
    ItemListPageComponent,
    ItemDetailPageComponent,
  ],
})
export class ItemsModule {}
