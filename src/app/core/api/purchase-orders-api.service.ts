import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreatePurchaseOrderRequest,
  CreatePurchaseOrderResponse,
  ListPurchaseOrdersParams,
  PurchaseOrderDto,
  PurchaseOrderListItemDto,
  UpdatePurchaseOrderRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: ListPurchaseOrdersParams = {}): Observable<PurchaseOrderListItemDto[]> {
    let httpParams = new HttpParams();
    if (params.vendorLedgerId != null) {
      httpParams = httpParams.set('vendorLedgerId', params.vendorLedgerId);
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
    return this.http.get<PurchaseOrderListItemDto[]>(`${this.baseUrl}/purchase-orders`, {
      params: httpParams,
    });
  }

  getNextNumber(): Observable<string> {
    return this.http.get(`${this.baseUrl}/purchase-orders/next-number`, {
      responseType: 'text',
    });
  }

  getById(id: number): Observable<PurchaseOrderDto> {
    return this.http.get<PurchaseOrderDto>(`${this.baseUrl}/purchase-orders/${id}`);
  }

  create(body: CreatePurchaseOrderRequest): Observable<CreatePurchaseOrderResponse> {
    return this.http.post<CreatePurchaseOrderResponse>(`${this.baseUrl}/purchase-orders`, body);
  }

  update(id: number, body: UpdatePurchaseOrderRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/purchase-orders/${id}`, body);
  }
}
