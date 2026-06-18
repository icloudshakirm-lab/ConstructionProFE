import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  BoqLineDto,
  CreateProjectsRequest,
  CreateProjectsResponse,
  MaterialConsumptionLineDto,
  ProjectPlanningProjectsDto,
  ProjectPlanningSiteSummaryDto,
  UpdateProjectsRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/projects`;

  list(): Observable<ProjectPlanningProjectsDto[]> {
    return this.http.get<ProjectPlanningProjectsDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningProjectsDto> {
    return this.http.get<ProjectPlanningProjectsDto>(`${this.base}/${id}`);
  }

  create(body: CreateProjectsRequest): Observable<CreateProjectsResponse> {
    return this.http.post<CreateProjectsResponse>(this.base, body);
  }

  update(id: string, body: UpdateProjectsRequest): Observable<ProjectPlanningProjectsDto> {
    return this.http.put<ProjectPlanningProjectsDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getSites(projectId: string): Observable<ProjectPlanningSiteSummaryDto[]> {
    return this.http.get<ProjectPlanningSiteSummaryDto[]>(`${this.base}/${projectId}/sites`);
  }

  getBoq(projectId: string): Observable<BoqLineDto[]> {
    return this.http.get<BoqLineDto[]>(`${this.base}/${projectId}/boq`);
  }

  getMaterialConsumption(projectId: string): Observable<MaterialConsumptionLineDto[]> {
    return this.http.get<MaterialConsumptionLineDto[]>(
      `${this.base}/${projectId}/material-consumption`
    );
  }
}
