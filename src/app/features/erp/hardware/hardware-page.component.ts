import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-hardware-page',
  imports: [CommonModule, Button, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="POS Setup" severity="info" />
          <h1>Hardware settings</h1>
          <p class="erp-list-page__subtitle">Configure thermal printers, barcode scanners, and cash drawers.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Add device" icon="pi pi-plus" [disabled]="true" />
        </div>
      </header>

      <div class="erp-list-page__empty-panel">
        <i class="pi pi-print" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
        Manage peripheral integrations like ESC/POS printers here. Device management API pending.
      </div>
    </div>
  `,
})
export class HardwarePageComponent {}
