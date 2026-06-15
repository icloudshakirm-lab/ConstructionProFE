import { Component, Input } from '@angular/core';
import { documentStatusBadgeClass } from '../../utils/document-status.util';

@Component({
  standalone: true,
  selector: 'app-document-status-badge',
  template: `
    @if (status) {
      <span [class]="badgeClass()">{{ status }}</span>
    } @else {
      <span class="text-slate-400">—</span>
    }
  `,
})
export class DocumentStatusBadgeComponent {
  @Input({ required: true }) status!: string | null | undefined;

  badgeClass(): string {
    return documentStatusBadgeClass(this.status);
  }
}
