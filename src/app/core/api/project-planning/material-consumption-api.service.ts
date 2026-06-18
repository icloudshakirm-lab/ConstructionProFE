import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../tokens/api-base-url.token';
import { MaterialConsumptionLineDto } from './project-planning-api.models';
import { PROJECT_PLANNING_API_PATH } from './project-planning-api.path';

@Injectable({ providedIn: 'root' })
export class MaterialConsumptionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}${PROJECT_PLANNING_API_PATH}/material-consumption`;

  list(): Observable<MaterialConsumptionLineDto[]> {
    return this.http.get<MaterialConsumptionLineDto[]>(this.base);
  }
}
