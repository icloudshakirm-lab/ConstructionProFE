import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import { ProjectPlanningBidPlansDto } from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class BidPlansApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/bid-plans`;

  list(): Observable<ProjectPlanningBidPlansDto[]> {
    return this.http.get<ProjectPlanningBidPlansDto[]>(this.base);
  }
}
