import { Component, Input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { documentStatusSeverity } from '../../utils/document-status.util';

@Component({
  standalone: true,
  selector: 'app-document-status-badge',
  imports: [Tag],
  template: `
    @if (status) {
      <p-tag [value]="status" [severity]="severity()" />
    } @else {
      <span class="erp-list-page__loading">—</span>
    }
  `,
})
export class DocumentStatusBadgeComponent {
  @Input({ required: true }) status!: string | null | undefined;

  severity() {
    return documentStatusSeverity(this.status);
  }
}
