import { Routes } from '@angular/router';
import { CostCenterDetailPageComponent } from './pages/cost-center-detail-page.component';
import { CostCenterListPageComponent } from './pages/cost-center-list-page.component';

export const costCentersRoutes: Routes = [
  { path: '', component: CostCenterListPageComponent },
  { path: ':id', component: CostCenterDetailPageComponent },
];
