import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { quotationsRoutes } from './quotations.routes';
import { QuotationFormPageComponent } from './pages/quotation-form-page.component';
import { QuotationListPageComponent } from './pages/quotation-list-page.component';

@NgModule({
  imports: [RouterModule.forChild(quotationsRoutes), QuotationListPageComponent, QuotationFormPageComponent],
})
export class QuotationsModule {}
