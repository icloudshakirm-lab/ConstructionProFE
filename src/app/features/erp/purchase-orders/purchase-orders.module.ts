import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { purchaseOrdersRoutes } from './purchase-orders.routes';
import { PoFormPageComponent } from './pages/po-form-page.component';
import { PoListPageComponent } from './pages/po-list-page.component';

@NgModule({
  imports: [RouterModule.forChild(purchaseOrdersRoutes), PoListPageComponent, PoFormPageComponent],
})
export class PurchaseOrdersModule {}
