import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import {
  CreateBidsRequest,
  CreateBidsResponse,
  ProjectPlanningBidsDto,
  UpdateBidsRequest
} from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class BidsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/bids`;

  list(): Observable<ProjectPlanningBidsDto[]> {
    return this.http.get<ProjectPlanningBidsDto[]>(this.base);
  }

  getById(id: string): Observable<ProjectPlanningBidsDto> {
    return this.http.get<ProjectPlanningBidsDto>(`${this.base}/${id}`);
  }

  create(body: CreateBidsRequest): Observable<CreateBidsResponse> {
    return this.http.post<CreateBidsResponse>(this.base, body);
  }

  update(id: string, body: UpdateBidsRequest): Observable<ProjectPlanningBidsDto> {
    return this.http.put<ProjectPlanningBidsDto>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
