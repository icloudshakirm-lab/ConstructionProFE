import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateQuotationRequest,
  CreateQuotationResponse,
  ListQuotationsParams,
  QuotationDto,
  QuotationListItemDto,
  UpdateQuotationRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class QuotationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: ListQuotationsParams = {}): Observable<QuotationListItemDto[]> {
    let httpParams = new HttpParams();
    if (params.customerLedgerId != null) {
      httpParams = httpParams.set('customerLedgerId', params.customerLedgerId);
    }
    if (params.status?.trim()) {
      httpParams = httpParams.set('status', params.status.trim());
    }
    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate);
    }
    return this.http.get<QuotationListItemDto[]>(`${this.baseUrl}/quotations`, { params: httpParams });
  }

  getNextNumber(): Observable<string> {
    return this.http.get(`${this.baseUrl}/quotations/next-number`, { responseType: 'text' });
  }

  getById(id: number): Observable<QuotationDto> {
    return this.http.get<QuotationDto>(`${this.baseUrl}/quotations/${id}`);
  }

  create(body: CreateQuotationRequest): Observable<CreateQuotationResponse> {
    return this.http.post<CreateQuotationResponse>(`${this.baseUrl}/quotations`, body);
  }

  update(id: number, body: UpdateQuotationRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/quotations/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quotations/${id}`);
  }
}
