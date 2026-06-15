import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-pos-counters-page',
  imports: [CommonModule, Button, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="POS Setup" severity="info" />
          <h1>POS counters</h1>
          <p class="erp-list-page__subtitle">Register and manage physical point-of-sale terminals and cash drawers.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Add counter" icon="pi pi-plus" [disabled]="true" />
        </div>
      </header>

      <div class="erp-list-page__empty-panel">
        <i class="pi pi-desktop" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
        Connect and manage your hardware terminals here. Counter management API pending.
      </div>
    </div>
  `,
})
export class PosCountersPageComponent {}
