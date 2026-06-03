import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { getModuleById } from '../../../core/constants/feature-registry';
import {
  BOQ_PROJECTS,
  BoqDiffChange,
  BoqRevision,
  BoqRevisionStatus,
  DEMO_BOQ_REVISIONS,
  REVISION_STATUS_LABELS,
  buildBoqDiff,
  formatDate,
  formatDateTime,
  formatMoney,
  revisionDelta,
  revisionGrandTotal
} from './boq-revisions.data';

@Component({
  selector: 'app-boq-revisions',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    InputText,
    Select,
    Tag,
    Textarea
  ],
  templateUrl: './boq-revisions.component.html',
  styleUrl: './boq-revisions.component.scss'
})
export class BoqRevisionsComponent {
  private readonly route = inject(ActivatedRoute);

  readonly projectOptions = BOQ_PROJECTS;
  readonly statusLabels = REVISION_STATUS_LABELS;

  readonly selectedProjectId = signal('tower-a');
  readonly revisions = signal<BoqRevision[]>(structuredClone(DEMO_BOQ_REVISIONS));
  readonly selectedRevisionId = signal('rev-ta-2');
  readonly compareFromId = signal('rev-ta-0');
  readonly compareToId = signal('rev-ta-2');
  readonly showUnchanged = signal(false);
  readonly viewMode = signal<'detail' | 'compare'>('detail');

  readonly approveDialogVisible = signal(false);
  readonly approveEffectiveDate = signal('');
  readonly approveComment = signal('');

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'BOQ Revisions' });
    return items;
  });

  readonly projectRevisions = computed(() => {
    const pid = this.selectedProjectId();
    return [...this.revisions()]
      .filter((r) => r.projectId === pid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  readonly revisionOptions = computed(() =>
    this.projectRevisions().map((r) => ({
      label: `${r.revisionNo} — ${r.title}`,
      value: r.id
    }))
  );

  readonly selectedRevision = computed(() => {
    const id = this.selectedRevisionId();
    return this.revisions().find((r) => r.id === id) ?? null;
  });

  readonly previousRevision = computed(() => {
    const current = this.selectedRevision();
    if (!current) return null;
    const list = this.projectRevisions().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const idx = list.findIndex((r) => r.id === current.id);
    return idx > 0 ? list[idx - 1] : null;
  });

  readonly activeApprovedRevision = computed(() => {
    const approved = this.projectRevisions().filter((r) => r.status === 'approved');
    if (!approved.length) return null;
    return approved.sort((a, b) => (b.effectiveDate ?? '').localeCompare(a.effectiveDate ?? ''))[0];
  });

  readonly pendingCount = computed(
    () => this.projectRevisions().filter((r) => r.status === 'pending').length
  );

  readonly compareFromRevision = computed(() =>
    this.revisions().find((r) => r.id === this.compareFromId()) ?? null
  );

  readonly compareToRevision = computed(() =>
    this.revisions().find((r) => r.id === this.compareToId()) ?? null
  );

  readonly diffRows = computed(() => {
    const from = this.compareFromRevision();
    const to = this.compareToRevision();
    if (!from || !to) return [];
    return buildBoqDiff(from, to, this.showUnchanged());
  });

  readonly diffSummary = computed(() => {
    const rows = this.diffRows();
    const added = rows.filter((r) => r.change === 'added').length;
    const removed = rows.filter((r) => r.change === 'removed').length;
    const modified = rows.filter((r) => r.change === 'modified').length;
    const delta = rows.reduce((s, r) => s + r.amountDelta, 0);
    return { added, removed, modified, delta };
  });

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    const list = [...this.revisions()]
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const first = list[0];
    if (!first) return;
    this.selectedRevisionId.set(first.id);
    const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    this.compareFromId.set(sorted[0]?.id ?? first.id);
    this.compareToId.set(first.id);
  }

  selectRevision(id: string): void {
    this.selectedRevisionId.set(id);
    this.viewMode.set('detail');
  }

  openCompare(): void {
    const sel = this.selectedRevisionId();
    const prev = this.previousRevision();
    this.compareToId.set(sel);
    if (prev) {
      this.compareFromId.set(prev.id);
    }
    this.viewMode.set('compare');
  }

  revisionTotal(rev: BoqRevision): number {
    return revisionGrandTotal(rev);
  }

  revisionChange(rev: BoqRevision): number {
    const list = this.projectRevisions().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const idx = list.findIndex((r) => r.id === rev.id);
    const prev = idx > 0 ? list[idx - 1] : null;
    return revisionDelta(rev, prev);
  }

  formatMoney(value: number): string {
    return formatMoney(value);
  }

  formatDate(iso: string | null): string {
    return formatDate(iso);
  }

  formatDateTime(iso: string | null): string {
    return formatDateTime(iso);
  }

  statusSeverity(status: BoqRevisionStatus): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warn';
      case 'draft':
        return 'info';
      default:
        return 'secondary';
    }
  }

  changeSeverity(change: BoqDiffChange): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (change) {
      case 'added':
        return 'success';
      case 'removed':
        return 'danger';
      case 'modified':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  changeLabel(change: BoqDiffChange): string {
    switch (change) {
      case 'added':
        return 'Added';
      case 'removed':
        return 'Removed';
      case 'modified':
        return 'Modified';
      default:
        return 'Unchanged';
    }
  }

  submitForApproval(rev: BoqRevision): void {
    if (rev.status !== 'draft') return;
    this.updateRevision(rev.id, { status: 'pending' });
  }

  openApprove(rev: BoqRevision): void {
    this.selectedRevisionId.set(rev.id);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    this.approveEffectiveDate.set(tomorrow.toISOString().slice(0, 10));
    this.approveComment.set('');
    this.approveDialogVisible.set(true);
  }

  confirmApprove(): void {
    const rev = this.selectedRevision();
    const date = this.approveEffectiveDate().trim();
    if (!rev || rev.status !== 'pending' || !date) return;

    const now = new Date().toISOString();
    this.revisions.update((list) =>
      list.map((r) => {
        if (r.projectId !== rev.projectId) return r;
        if (r.id === rev.id) {
          return {
            ...r,
            status: 'approved',
            effectiveDate: date,
            approvedAt: now,
            approvedBy: 'S. Rahman — Commercial Manager'
          };
        }
        if (r.status === 'approved') {
          return { ...r, status: 'superseded' as const };
        }
        return r;
      })
    );
    this.approveDialogVisible.set(false);
  }

  rejectRevision(rev: BoqRevision): void {
    if (rev.status !== 'pending') return;
    this.updateRevision(rev.id, { status: 'draft' });
  }

  private updateRevision(id: string, patch: Partial<BoqRevision>): void {
    this.revisions.update((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
}
