import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { ChartOfAccountsTreeNode } from './chart-of-accounts.models';

@Injectable({ providedIn: 'root' })
export class ChartOfAccountsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getTree(): Observable<ChartOfAccountsTreeNode[]> {
    return this.http.get<ChartOfAccountsTreeNode[]>(`${this.baseUrl}/ledger-groups/tree`);
  }
}
