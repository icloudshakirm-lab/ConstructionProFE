import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { FEATURE_MODULES } from '../../core/constants/feature-registry';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Card, Tag],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly modules = FEATURE_MODULES;

  readonly kpis = [
    { label: 'Active Projects', value: '12', icon: 'pi pi-building', tone: 'primary' },
    { label: 'Open Site Issues', value: '7', icon: 'pi pi-exclamation-circle', tone: 'warn' },
    { label: 'Pending GRNs', value: '4', icon: 'pi pi-inbox', tone: 'info' },
    { label: 'IPC This Month', value: '3', icon: 'pi pi-file-export', tone: 'success' }
  ];
}
