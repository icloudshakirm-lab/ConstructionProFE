import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContributorDetailPageComponent } from './pages/contributor-detail-page.component';
import { ContributorListPageComponent } from './pages/contributor-list-page.component';
import { contributorsRoutes } from './contributors.routes';

@NgModule({
  imports: [
    RouterModule.forChild(contributorsRoutes),
    ContributorListPageComponent,
    ContributorDetailPageComponent,
  ],
})
export class ContributorsModule {}
