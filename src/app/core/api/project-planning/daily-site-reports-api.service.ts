import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreateDailySiteReportsRequest,
  CreateDailySiteReportsResponse,
  ProjectPlanningDailySiteReportsDto,
  UpdateDailySiteReportsRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class DailySiteReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/daily-site-reports`;

  list(): Observable<ProjectPlanningDailySiteReportsDto[]> {
    return this.http.get<ProjectPlanningDailySiteReportsDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningDailySiteReportsDto> {
    return this.http.get<ProjectPlanningDailySiteReportsDto>(`${this.base}/${id}`);
  }

  create(body: CreateDailySiteReportsRequest): Observable<CreateDailySiteReportsResponse> {
    return this.http.post<CreateDailySiteReportsResponse>(this.base, body);
  }

  update(
    id: string,
    body: UpdateDailySiteReportsRequest
  ): Observable<ProjectPlanningDailySiteReportsDto> {
    return this.http.put<ProjectPlanningDailySiteReportsDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
