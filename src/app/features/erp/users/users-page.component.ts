import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-users-page',
  imports: [Button, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Administration" severity="info" />
          <h1>User management</h1>
          <p class="erp-list-page__subtitle">Manage system users, credentials, and assigned roles.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Add user" icon="pi pi-plus" [disabled]="true" title="User Identity API pending" />
        </div>
      </header>
      <div class="erp-list-page__empty-panel">
        <i class="pi pi-users" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
        No users found. Integration with User Identity API is pending.
      </div>
    </div>
  `,
})
export class UsersPageComponent {}
