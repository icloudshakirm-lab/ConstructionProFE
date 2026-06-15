import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateItemRequest,
  CreateItemResponse,
  ItemDTO,
  ItemWithBatchesDto,
  PagedResponse,
  UpdateItemRequest,
} from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class ItemsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(page = 1, perPage = 10): Observable<PagedResponse<ItemDTO>> {
    const params = new HttpParams().set('page', page).set('perPage', perPage);
    return this.http.get<PagedResponse<ItemDTO>>(`${this.baseUrl}/items`, { params });
  }

  getById(id: number): Observable<ItemDTO> {
    return this.http.get<ItemDTO>(`${this.baseUrl}/items/${id}`);
  }

  /** `GET /items/{id}/with-batches` — item and batch details for POS. */
  getWithBatches(id: number): Observable<ItemWithBatchesDto> {
    return this.http.get<ItemWithBatchesDto>(`${this.baseUrl}/items/${id}/with-batches`);
  }

  /** `GET /items/by-barcode/{barcode}` — item and batch summaries (e.g. POS). */
  getByBarcode(barcode: string): Observable<ItemWithBatchesDto> {
    const encoded = encodeURIComponent(barcode.trim());
    return this.http.get<ItemWithBatchesDto>(`${this.baseUrl}/items/by-barcode/${encoded}`);
  }

  create(body: CreateItemRequest): Observable<CreateItemResponse> {
    return this.http.post<CreateItemResponse>(`${this.baseUrl}/items`, body);
  }

  update(id: number, body: UpdateItemRequest): Observable<ItemDTO> {
    return this.http.put<ItemDTO>(`${this.baseUrl}/items/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${id}`);
  }
}
