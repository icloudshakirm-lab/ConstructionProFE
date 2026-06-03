import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getModuleById } from '../../../core/constants/feature-registry';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import {
  ContractMilestone,
  DEMO_MILESTONES,
  MILESTONE_STATUS_OPTIONS,
  MilestoneStatus
} from './milestones.data';

@Component({
  selector: 'app-milestones-page',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Dialog,
    InputText,
    Select,
    Tag
  ],
  templateUrl: './milestones.component.html',
  styleUrl: './milestones.component.scss'
})
export class MilestonesPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Milestones' });
    return items;
  });

  readonly milestones = signal<ContractMilestone[]>(structuredClone(DEMO_MILESTONES));
  readonly statusFilter = signal<MilestoneStatus | 'all'>('all');
  readonly statusOptions = MILESTONE_STATUS_OPTIONS;
  readonly statusFilterOptions: { label: string; value: MilestoneStatus | 'all' }[] = [
    { label: 'All statuses', value: 'all' },
    ...MILESTONE_STATUS_OPTIONS
  ];
  readonly dialogVisible = signal(false);
  readonly draft = signal({
    name: '',
    project: 'Tower Block A',
    site: '',
    plannedDate: '',
    forecastDate: '',
    status: 'Not Started' as MilestoneStatus,
    owner: 'Site Engineer'
  });

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    if (f === 'all') return this.milestones();
    return this.milestones().filter((m) => m.status === f);
  });

  openAdd(): void {
    this.draft.set({
      name: '',
      project: 'Tower Block A',
      site: '',
      plannedDate: '',
      forecastDate: '',
      status: 'Not Started',
      owner: 'Site Engineer'
    });
    this.dialogVisible.set(true);
  }

  saveMilestone(): void {
    const d = this.draft();
    if (!d.name.trim()) return;

    const row: ContractMilestone = {
      id: `ms-${Date.now()}`,
      name: d.name.trim(),
      project: d.project.trim(),
      site: d.site.trim() || '—',
      plannedDate: d.plannedDate,
      forecastDate: d.forecastDate || d.plannedDate,
      status: d.status,
      owner: d.owner.trim()
    };

    this.milestones.update((list) => [row, ...list]);
    this.dialogVisible.set(false);
  }

  updateStatus(item: ContractMilestone, status: MilestoneStatus): void {
    this.milestones.update((list) =>
      list.map((m) => (m.id === item.id ? { ...m, status } : m))
    );
  }

  statusSeverity(status: MilestoneStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'info';
      case 'At Risk':
        return 'warn';
      case 'Delayed':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  slipDays(planned: string, forecast: string): number {
    if (!planned || !forecast) return 0;
    const p = new Date(planned).getTime();
    const f = new Date(forecast).getTime();
    return Math.round((f - p) / 86400000);
  }
}
