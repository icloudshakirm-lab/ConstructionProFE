import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import { ProjectPlanningFleetVehiclesDto } from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class FleetVehiclesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/fleet-vehicles`;

  list(): Observable<ProjectPlanningFleetVehiclesDto[]> {
    return this.http.get<ProjectPlanningFleetVehiclesDto[]>(this.base);
  }
}
