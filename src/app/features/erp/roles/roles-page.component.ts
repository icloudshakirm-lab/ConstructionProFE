import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-roles-page',
  imports: [Button, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Administration" severity="info" />
          <h1>Roles &amp; permissions</h1>
          <p class="erp-list-page__subtitle">Define access levels and granular permissions for staff.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Create role" icon="pi pi-plus" [disabled]="true" title="RBAC setup pending" />
        </div>
      </header>
      <div class="erp-list-page__empty-panel">
        <i class="pi pi-shield" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
        Role-based access control setup will be available here.
      </div>
    </div>
  `,
})
export class RolesPageComponent {}
