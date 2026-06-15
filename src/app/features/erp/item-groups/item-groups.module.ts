import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemGroupDetailPageComponent } from './pages/item-group-detail-page.component';
import { ItemGroupListPageComponent } from './pages/item-group-list-page.component';
import { itemGroupsRoutes } from './item-groups.routes';

@NgModule({
  imports: [
    RouterModule.forChild(itemGroupsRoutes),
    ItemGroupListPageComponent,
    ItemGroupDetailPageComponent,
  ],
})
export class ItemGroupsModule {}
