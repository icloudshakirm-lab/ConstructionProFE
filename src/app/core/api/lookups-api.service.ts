import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { BatchDTO, LookupDTO } from './erp-api.models';

@Injectable({ providedIn: 'root' })
export class LookupsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listBatches(): Observable<LookupDTO[]> {
    return this.http.get<LookupDTO[]>(`${this.baseUrl}/lookups/batches`);
  }

  listItemGroups(): Observable<LookupDTO[]> {
    return this.http.get<LookupDTO[]>(`${this.baseUrl}/lookups/item-groups`);
  }

  /** `GET /lookups/items` — optional `search` query. */
  listItems(search?: string | null): Observable<LookupDTO[]> {
    const s = (search ?? '').trim();
    const params = s ? new HttpParams().set('search', s) : undefined;
    return this.http.get<LookupDTO[]>(`${this.baseUrl}/lookups/items`, { params });
  }

  listLedgerGroups(): Observable<LookupDTO[]> {
    return this.http.get<LookupDTO[]>(`${this.baseUrl}/lookups/ledger-groups`);
  }

  /** `GET /lookups/ledgers` — optional `search` query (server limits results, e.g. top 5). */
  listLedgers(search?: string | null): Observable<LookupDTO[]> {
    const s = (search ?? '').trim();
    const params = s ? new HttpParams().set('search', s) : undefined;
    return this.http.get<LookupDTO[]>(`${this.baseUrl}/lookups/ledgers`, { params });
  }
  /** `GET /items/{itemId}/batches` — returns batches for a specific item. */
  listItemBatches(itemId: number): Observable<BatchDTO[]> {
    return this.http.get<BatchDTO[]>(`${this.baseUrl}/items/${itemId}/batches`);
  }
}
