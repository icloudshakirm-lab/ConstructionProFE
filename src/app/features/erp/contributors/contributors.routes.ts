import { Routes } from '@angular/router';
import { ContributorDetailPageComponent } from './pages/contributor-detail-page.component';
import { ContributorListPageComponent } from './pages/contributor-list-page.component';

export const contributorsRoutes: Routes = [
  { path: '', component: ContributorListPageComponent },
  { path: ':id', component: ContributorDetailPageComponent },
];
