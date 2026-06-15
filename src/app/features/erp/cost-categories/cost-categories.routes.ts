import { Routes } from '@angular/router';
import { CostCategoryDetailPageComponent } from './pages/cost-category-detail-page.component';
import { CostCategoryListPageComponent } from './pages/cost-category-list-page.component';

export const costCategoriesRoutes: Routes = [
  { path: '', component: CostCategoryListPageComponent },
  { path: ':id', component: CostCategoryDetailPageComponent },
];
