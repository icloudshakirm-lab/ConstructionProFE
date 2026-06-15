import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-shifts-page',
  imports: [Button, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Administration · POS" severity="info" />
          <h1>Shift management</h1>
          <p class="erp-list-page__subtitle">Track cashier shifts, opening cash, and shift closings (Z-reports).</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Open new shift" icon="pi pi-plus" [disabled]="true" title="Shift API pending" />
        </div>
      </header>
      <div class="erp-list-page__empty-panel">
        <i class="pi pi-clock" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
        History of worker shifts and cash reconciliations will appear here.
      </div>
    </div>
  `,
})
export class ShiftsPageComponent {}
