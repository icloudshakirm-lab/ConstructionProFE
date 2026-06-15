import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { BranchesApiService } from '../../../core/api/branches-api.service';
import { BranchDTO } from '../../../core/api/erp-api.models';
import { BranchFormDialogComponent } from './components/branch-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-branches-page',
  imports: [CommonModule, Button, Tag, BranchFormDialogComponent],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="Administration" severity="info" />
          <h1>Branches &amp; stores</h1>
          <p class="erp-list-page__subtitle">Configure business locations, branches, and physical stores.</p>
        </div>
        <div class="erp-list-page__header-actions">
          <p-button label="Add branch" icon="pi pi-plus" (onClick)="showAddDialog()" />
        </div>
      </header>

      @if (branches().length === 0) {
        <div class="erp-list-page__empty-panel">
          <i class="pi pi-building" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
          No branches yet. Click <strong>Add branch</strong> to create one.
        </div>
      } @else {
        <div class="erp-inv-hub">
          @for (branch of branches(); track branch.id) {
            <button type="button" class="erp-inv-hub__card" style="text-align: left; cursor: pointer; border: none" (click)="editBranch(branch)">
              <div class="erp-inv-hub__icon"><i class="pi pi-building"></i></div>
              <h2>{{ branch.name }}</h2>
              <p class="font-mono">{{ branch.code }}</p>
              @if (branch.address || branch.city) {
                <p>{{ branch.address }}@if (branch.address && branch.city) {, }{{ branch.city }}</p>
              }
              <p-tag [value]="branch.isActive ? 'Active' : 'Inactive'" [severity]="branch.isActive ? 'success' : 'secondary'" />
            </button>
          }
        </div>
      }
    </div>

    <app-branch-form-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [branchId]="selectedBranchId()"
      (saved)="loadBranches()"
    />
  `,
})
export class BranchesPageComponent implements OnInit {
  private readonly api = inject(BranchesApiService);

  readonly branches = signal<BranchDTO[]>([]);
  readonly dialogVisible = signal(false);
  readonly selectedBranchId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.api.list().subscribe({
      next: (data) => this.branches.set(data),
      error: () => this.branches.set([]),
    });
  }

  showAddDialog(): void {
    this.selectedBranchId.set(null);
    this.dialogVisible.set(true);
  }

  editBranch(branch: BranchDTO): void {
    this.selectedBranchId.set(branch.id);
    this.dialogVisible.set(true);
  }
}
