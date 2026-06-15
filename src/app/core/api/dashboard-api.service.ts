import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { DashboardChartsDto, DashboardStatsDto } from './erp-api.models';

export interface GetDashboardStatsParams {
  fromDate?: string;
  toDate?: string;
}

export interface GetDashboardChartsParams {
  fromDate?: string;
  toDate?: string;
  days: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getStats(params?: GetDashboardStatsParams): Observable<DashboardStatsDto> {
    let p = new HttpParams();
    if (params?.fromDate) p = p.set('fromDate', params.fromDate);
    if (params?.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<DashboardStatsDto>(`${this.baseUrl}/dashboard/stats`, { params: p });
  }

  getCharts(params: GetDashboardChartsParams): Observable<DashboardChartsDto> {
    let p = new HttpParams().set('days', params.days);
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<DashboardChartsDto>(`${this.baseUrl}/dashboard/charts`, { params: p });
  }
}

