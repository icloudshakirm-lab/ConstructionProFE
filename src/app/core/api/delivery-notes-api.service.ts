import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateDeliveryNoteFromQuotationRequest,
  CreateDeliveryNoteRequest,
  CreateDeliveryNoteResponse,
  DeliveryNoteDto,
  DeliveryNoteListItemDto,
  ListDeliveryNotesParams,
  UpdateDeliveryNoteRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class DeliveryNotesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: ListDeliveryNotesParams = {}): Observable<DeliveryNoteListItemDto[]> {
    let httpParams = new HttpParams();
    if (params.customerLedgerId != null) {
      httpParams = httpParams.set('customerLedgerId', params.customerLedgerId);
    }
    if (params.quotationId != null) {
      httpParams = httpParams.set('quotationId', params.quotationId);
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
    return this.http.get<DeliveryNoteListItemDto[]>(`${this.baseUrl}/delivery-notes`, { params: httpParams });
  }

  getNextNumber(): Observable<string> {
    return this.http.get(`${this.baseUrl}/delivery-notes/next-number`, { responseType: 'text' });
  }

  getById(id: number): Observable<DeliveryNoteDto> {
    return this.http.get<DeliveryNoteDto>(`${this.baseUrl}/delivery-notes/${id}`);
  }

  create(body: CreateDeliveryNoteRequest): Observable<CreateDeliveryNoteResponse> {
    return this.http.post<CreateDeliveryNoteResponse>(`${this.baseUrl}/delivery-notes`, body);
  }

  createFromQuotation(
    quotationId: number,
    body: CreateDeliveryNoteFromQuotationRequest,
  ): Observable<CreateDeliveryNoteResponse> {
    return this.http.post<CreateDeliveryNoteResponse>(
      `${this.baseUrl}/delivery-notes/from-quotation/${quotationId}`,
      body,
    );
  }

  update(id: number, body: UpdateDeliveryNoteRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/delivery-notes/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delivery-notes/${id}`);
  }
}
