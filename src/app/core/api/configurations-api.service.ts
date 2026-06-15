import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ConfigurationDTO,
  ConfigurationTreeDTO,
  CreateConfigurationCommand,
  UpdateConfigurationCommand,
  CreateConfigurationGroupCommand,
  UpdateConfigurationGroupCommand,
  ConfigurationGroupDTO,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ConfigurationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // Configuration Tree
  getTree(): Observable<ConfigurationTreeDTO[]> {
    return this.http.get<ConfigurationTreeDTO[]>(`${this.baseUrl}/configuration-groups/tree`);
  }

  getConfigsByGroup(groupName: string): Observable<ConfigurationDTO[]> {
    return this.http.get<ConfigurationDTO[]>(`${this.baseUrl}/configuration-groups/${groupName}`);
  }

  // Configurations CRUD
  createConfiguration(request: CreateConfigurationCommand): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/configurations`, request);
  }

  updateConfiguration(id: number, request: UpdateConfigurationCommand): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/configurations/${id}`, request);
  }

  deleteConfiguration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/configurations/${id}`);
  }

  // Configuration Groups CRUD
  createGroup(request: CreateConfigurationGroupCommand): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/configuration-groups`, request);
  }

  updateGroup(id: number, request: UpdateConfigurationGroupCommand): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/configuration-groups/${id}`, request);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/configuration-groups/${id}`);
  }
}

