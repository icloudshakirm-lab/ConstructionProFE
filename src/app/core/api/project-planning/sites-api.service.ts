import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreateSitesRequest,
  CreateSitesResponse,
  ProjectPlanningSitesDto,
  UpdateSitesRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class SitesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/sites`;

  list(): Observable<ProjectPlanningSitesDto[]> {
    return this.http.get<ProjectPlanningSitesDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningSitesDto> {
    return this.http.get<ProjectPlanningSitesDto>(`${this.base}/${id}`);
  }

  create(body: CreateSitesRequest): Observable<CreateSitesResponse> {
    return this.http.post<CreateSitesResponse>(this.base, body);
  }

  update(id: string, body: UpdateSitesRequest): Observable<ProjectPlanningSitesDto> {
    return this.http.put<ProjectPlanningSitesDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
