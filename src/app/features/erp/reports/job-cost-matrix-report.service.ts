import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { CostCategoriesApiService } from '../../../core/api/cost-categories-api.service';
import { CostCentersApiService } from '../../../core/api/cost-centers-api.service';
import type { JobCostMatrixReportDto, JobCostMatrixView } from '../../../core/api/erp-api.models';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { buildEstimatedJobCostMatrix } from './job-cost-matrix.builder';

@Injectable({ providedIn: 'root' })
export class JobCostMatrixReportService {
  private readonly reports = inject(ReportsApiService);
  private readonly costCentersApi = inject(CostCentersApiService);
  private readonly costCategoriesApi = inject(CostCategoriesApiService);

  load(fromDateIso: string, toDateIso: string, viewMode: JobCostMatrixView): Observable<JobCostMatrixReportDto> {
    return this.reports.getJobCostMatrix(fromDateIso, toDateIso, viewMode).pipe(
      map((r) => ({ ...r, dataSource: r.dataSource ?? 'api' })),
      catchError(() => this.buildEstimated(fromDateIso, toDateIso, viewMode)),
    );
  }

  private buildEstimated(
    fromDateIso: string,
    toDateIso: string,
    viewMode: JobCostMatrixView,
  ): Observable<JobCostMatrixReportDto> {
    return forkJoin({
      pl: this.reports.getProfitAndLoss(fromDateIso, toDateIso),
      costCenters: this.costCentersApi.list().pipe(catchError(() => of([]))),
      categories: this.costCategoriesApi.list().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ pl, costCenters, categories }) =>
        buildEstimatedJobCostMatrix(pl, costCenters, categories, viewMode),
      ),
    );
  }
}
