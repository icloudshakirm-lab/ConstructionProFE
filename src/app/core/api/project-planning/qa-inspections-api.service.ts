import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreateQaInspectionsRequest,
  CreateQaInspectionsResponse,
  ProjectPlanningQaInspectionsDto,
  UpdateQaInspectionsRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class QaInspectionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/qa-inspections`;

  list(): Observable<ProjectPlanningQaInspectionsDto[]> {
    return this.http.get<ProjectPlanningQaInspectionsDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningQaInspectionsDto> {
    return this.http.get<ProjectPlanningQaInspectionsDto>(`${this.base}/${id}`);
  }

  create(body: CreateQaInspectionsRequest): Observable<CreateQaInspectionsResponse> {
    return this.http.post<CreateQaInspectionsResponse>(this.base, body);
  }

  update(
    id: string,
    body: UpdateQaInspectionsRequest
  ): Observable<ProjectPlanningQaInspectionsDto> {
    return this.http.put<ProjectPlanningQaInspectionsDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
