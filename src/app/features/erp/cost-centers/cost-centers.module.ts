import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CostCenterDetailPageComponent } from './pages/cost-center-detail-page.component';
import { CostCenterListPageComponent } from './pages/cost-center-list-page.component';
import { costCentersRoutes } from './cost-centers.routes';

@NgModule({
  imports: [
    RouterModule.forChild(costCentersRoutes),
    CostCenterListPageComponent,
    CostCenterDetailPageComponent,
  ],
})
export class CostCentersModule {}
