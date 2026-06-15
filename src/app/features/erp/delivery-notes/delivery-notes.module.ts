import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { deliveryNotesRoutes } from './delivery-notes.routes';
import { DnFormPageComponent } from './pages/dn-form-page.component';
import { DnListPageComponent } from './pages/dn-list-page.component';

@NgModule({
  imports: [RouterModule.forChild(deliveryNotesRoutes), DnListPageComponent, DnFormPageComponent],
})
export class DeliveryNotesModule {}
