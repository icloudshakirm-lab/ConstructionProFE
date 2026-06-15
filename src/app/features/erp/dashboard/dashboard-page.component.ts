import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { DashboardApiService } from '../../../core/api/dashboard-api.service';
import type { DashboardChartsDto, DashboardStatsDto } from '../../../core/api/erp-api.models';

/** Placeholder KPIs — replace with API-driven signals later. */
export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
  deltaLabel: string;
  deltaPositive: boolean;
  icon: string;
  accentClass: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [NgClass, RouterLink, ChartModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<DashboardStat[]>([]);

  readonly charts = signal<DashboardChartsDto | null>(null);
  readonly statsDto = signal<DashboardStatsDto | null>(null);

  // PrimeNG chart bindings expect stable object identity; we replace them when data arrives.
  lineChartData: any = {
    labels: [],
    datasets: [],
  };

  barChartData: any = { labels: [], datasets: [] };
  doughnutChartData: any = { labels: [], datasets: [] };

  readonly lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  readonly doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#64748b',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  private readonly chartTooltip = {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    padding: 10,
    cornerRadius: 8,
  };

  readonly radarChartData = {
    labels: ['Accuracy', 'Throughput', 'Latency', 'Coverage', 'Compliance'],
    datasets: [
      {
        label: 'Score (mock)',
        data: [78, 65, 82, 71, 88],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.22)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  readonly radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#64748b', font: { size: 11 }, padding: 12 },
      },
      tooltip: this.chartTooltip,
    },
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: 100,
        angleLines: { color: 'rgba(148, 163, 184, 0.28)' },
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        pointLabels: { color: '#64748b', font: { size: 11 } },
        ticks: {
          color: '#64748b',
          backdropColor: 'transparent',
          showLabelBackdrop: false,
          font: { size: 10 },
        },
      },
    },
  };

  readonly polarAreaChartData = {
    labels: ['Retail', 'Wholesale', 'Online', 'Partner', 'Other'],
    datasets: [
      {
        data: [28, 22, 18, 15, 17],
        backgroundColor: [
          'rgba(16, 185, 129, 0.65)',
          'rgba(59, 130, 246, 0.65)',
          'rgba(139, 92, 246, 0.65)',
          'rgba(245, 158, 11, 0.65)',
          'rgba(148, 163, 184, 0.55)',
        ],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.85)',
      },
    ],
  };

  readonly polarAreaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#64748b',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
        },
      },
      tooltip: this.chartTooltip,
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
        pointLabels: { color: '#64748b', font: { size: 11 } },
        ticks: {
          color: '#64748b',
          backdropColor: 'transparent',
          showLabelBackdrop: false,
          font: { size: 10 },
        },
      },
    },
  };

  readonly pieChartData = {
    labels: ['Direct', 'Partner', 'Referral', 'Organic'],
    datasets: [
      {
        data: [38, 27, 18, 17],
        backgroundColor: [
          'rgba(59, 130, 246, 0.88)',
          'rgba(16, 185, 129, 0.88)',
          'rgba(245, 158, 11, 0.88)',
          'rgba(139, 92, 246, 0.88)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  readonly pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#64748b',
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
        },
      },
      tooltip: this.chartTooltip,
    },
  };

  readonly dualLineChartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Debits (mock)',
        data: [120, 132, 118, 145, 139, 151],
        tension: 0.35,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Credits (mock)',
        data: [115, 128, 124, 138, 142, 148],
        tension: 0.35,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: false,
        pointRadius: 3,
      },
    ],
  };

  readonly dualLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: { color: '#64748b', usePointStyle: true, font: { size: 11 }, padding: 16 },
      },
      tooltip: this.chartTooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  readonly stackedBarChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Inbound (mock)',
        data: [42, 38, 55, 48, 52, 28, 20],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderRadius: 4,
      },
      {
        label: 'Outbound (mock)',
        data: [35, 40, 44, 41, 46, 22, 18],
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderRadius: 4,
      },
      {
        label: 'Adjustments (mock)',
        data: [8, 10, 6, 12, 9, 5, 4],
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        borderRadius: 4,
      },
    ],
  };

  readonly stackedBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: { color: '#64748b', usePointStyle: true, font: { size: 11 }, padding: 14 },
      },
      tooltip: this.chartTooltip,
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  readonly quickLinks: { label: string; route: string; icon: string; blurb: string }[] = [
    {
      label: 'Sales invoices',
      route: '/app/invoices/sales',
      icon: 'pi pi-file',
      blurb: 'Create and review sales documents',
    },
    {
      label: 'Ledgers',
      route: '/app/ledgers',
      icon: 'pi pi-book',
      blurb: 'Accounts and balances',
    },
    {
      label: 'Transactions',
      route: '/app/transactions',
      icon: 'pi pi-list',
      blurb: 'Journal and movement history',
    },
    {
      label: 'Items',
      route: '/app/items',
      icon: 'pi pi-box',
      blurb: 'Catalog and stock context',
    },
  ];

  readonly activityRows = [
    { title: 'Invoice #1042 posted', meta: '2h ago · Sales', tone: 'emerald' },
    { title: 'Ledger “Operating” adjusted', meta: 'Yesterday · Ledgers', tone: 'sky' },
    { title: 'Batch ITEM-09 received', meta: 'Mar 24 · Item batches', tone: 'violet' },
    { title: 'New contributor invited', meta: 'Mar 22 · Contributors', tone: 'slate' },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    // Stats: defaults to all-time counts, with optional period inside response.
    this.api.getStats().subscribe({
      next: (dto) => {
        this.statsDto.set(dto);
        this.stats.set(this.mapStats(dto));
      },
      error: (e: unknown) => {
        this.error.set(this.msg(e));
      },
    });

    // Charts: backend requires `days`. Swagger says defaults to last 30 days.
    this.api.getCharts({ days: 30 }).subscribe({
      next: (dto) => {
        this.charts.set(dto);
        this.applyCharts(dto);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  private mapStats(dto: DashboardStatsDto): DashboardStat[] {
    const totalVouchers =
      (dto.vouchers?.journal ?? 0) +
      (dto.vouchers?.payment ?? 0) +
      (dto.vouchers?.receipt ?? 0) +
      (dto.vouchers?.manufacturing ?? 0) +
      (dto.vouchers?.pointOfSale ?? 0);

    return [
      {
        label: 'Active ledgers',
        value: String(dto.masterData?.activeLedgers ?? 0),
        hint: `Total: ${dto.masterData?.ledgers ?? 0}`,
        deltaLabel: 'Live',
        deltaPositive: true,
        icon: 'pi pi-wallet',
        accentClass: 'stat-accent--emerald',
      },
      {
        label: 'Vouchers',
        value: String(totalVouchers),
        hint: 'Journal + PV + RV + MFG + POS',
        deltaLabel: 'Live',
        deltaPositive: true,
        icon: 'pi pi-file',
        accentClass: 'stat-accent--sky',
      },
      {
        label: 'Stock items',
        value: String(dto.stock?.activeItems ?? 0),
        hint: `Batches: ${dto.stock?.batches ?? 0}`,
        deltaLabel: 'Live',
        deltaPositive: true,
        icon: 'pi pi-box',
        accentClass: 'stat-accent--violet',
      },
      {
        label: 'Users',
        value: String(dto.organization?.users ?? 0),
        hint: `Branches: ${dto.organization?.branches ?? 0}`,
        deltaLabel: 'Live',
        deltaPositive: true,
        icon: 'pi pi-users',
        accentClass: 'stat-accent--amber',
      },
    ];
  }

  private applyCharts(dto: DashboardChartsDto): void {
    const labels = (dto.salesByDay ?? []).map((p) => p.date);
    const salesAmounts = (dto.salesByDay ?? []).map((p) => Number(p.amount ?? 0));
    const purchaseAmounts = (dto.purchasesByDay ?? []).map((p) => Number(p.amount ?? 0));

    this.lineChartData = {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: salesAmounts,
          fill: true,
          tension: 0.35,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.10)',
          pointRadius: 2,
          pointHoverRadius: 4,
        },
        {
          label: 'Purchases',
          data: purchaseAmounts,
          fill: true,
          tension: 0.35,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };

    const mixLabels = (dto.salesByVoucherType ?? []).map((x) => x.name || x.code);
    const mixAmounts = (dto.salesByVoucherType ?? []).map((x) => Number(x.amount ?? 0));
    this.doughnutChartData = {
      labels: mixLabels,
      datasets: [
        {
          data: mixAmounts,
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(148, 163, 184, 0.75)',
          ],
          borderWidth: 0,
        },
      ],
    };

    // Horizontal bars: counts by voucher type.
    const mixCounts = (dto.salesByVoucherType ?? []).map((x) => Number(x.count ?? 0));
    this.barChartData = {
      labels: mixLabels,
      datasets: [
        {
          label: 'Count',
          data: mixCounts,
          backgroundColor: [
            'rgba(16, 185, 129, 0.75)',
            'rgba(59, 130, 246, 0.75)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(139, 92, 246, 0.75)',
            'rgba(148, 163, 184, 0.75)',
          ],
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Failed to load dashboard.';
  }
}
