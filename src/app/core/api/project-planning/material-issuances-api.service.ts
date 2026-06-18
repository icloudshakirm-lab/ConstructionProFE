import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  ApproveMaterialIssuanceRequest,
  CreateMaterialIssuancesRequest,
  CreateMaterialIssuancesResponse,
  ProjectPlanningMaterialIssuancesDto,
  UpdateMaterialIssuancesRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class MaterialIssuancesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/material-issuances`;

  list(): Observable<ProjectPlanningMaterialIssuancesDto[]> {
    return this.http.get<ProjectPlanningMaterialIssuancesDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningMaterialIssuancesDto> {
    return this.http.get<ProjectPlanningMaterialIssuancesDto>(`${this.base}/${id}`);
  }

  create(body: CreateMaterialIssuancesRequest): Observable<CreateMaterialIssuancesResponse> {
    return this.http.post<CreateMaterialIssuancesResponse>(this.base, body);
  }

  update(
    id: string,
    body: UpdateMaterialIssuancesRequest
  ): Observable<ProjectPlanningMaterialIssuancesDto> {
    return this.http.put<ProjectPlanningMaterialIssuancesDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  approve(id: string, body: ApproveMaterialIssuanceRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/approve`, body);
  }
}
