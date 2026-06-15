import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CostCategoryDetailPageComponent } from './pages/cost-category-detail-page.component';
import { CostCategoryListPageComponent } from './pages/cost-category-list-page.component';
import { costCategoriesRoutes } from './cost-categories.routes';

@NgModule({
  imports: [
    RouterModule.forChild(costCategoriesRoutes),
    CostCategoryListPageComponent,
    CostCategoryDetailPageComponent,
  ],
})
export class CostCategoriesModule {}
