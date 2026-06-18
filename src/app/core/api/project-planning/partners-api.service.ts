import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreatePartnersRequest,
  CreatePartnersResponse,
  ProjectPlanningPartnersDto,
  UpdatePartnersRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class PartnersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/partners`;

  list(): Observable<ProjectPlanningPartnersDto[]> {
    return this.http.get<ProjectPlanningPartnersDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningPartnersDto> {
    return this.http.get<ProjectPlanningPartnersDto>(`${this.base}/${id}`);
  }

  create(body: CreatePartnersRequest): Observable<CreatePartnersResponse> {
    return this.http.post<CreatePartnersResponse>(this.base, body);
  }

  update(id: string, body: UpdatePartnersRequest): Observable<ProjectPlanningPartnersDto> {
    return this.http.put<ProjectPlanningPartnersDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
