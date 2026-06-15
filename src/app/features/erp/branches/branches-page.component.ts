import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { BranchesApiService } from '../../../core/api/branches-api.service';
import { BranchDTO } from '../../../core/api/erp-api.models';
import { BranchFormDialogComponent } from './components/branch-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-branches-page',
  imports: [CommonModule, Button, BranchFormDialogComponent],
  template: `
    <div class="space-y-6 p-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Branch & Store Management</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">Configure your business locations, branches, and physical stores.</p>
        </div>
        <p-button label="Add Branch" icon="pi pi-plus" (onClick)="showAddDialog()" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (branch of branches(); track branch.id) {
          <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" (click)="editBranch(branch)">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <i class="pi pi-building text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-slate-50">{{ branch.name }}</h3>
                <p class="text-xs text-slate-500 font-mono">{{ branch.code }}</p>
              </div>
            </div>
            @if (branch.address || branch.city) {
              <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {{ branch.address }}@if(branch.address && branch.city){, }{{ branch.city }}
              </p>
            }
            <div class="flex gap-2">
              <span [class]="branch.isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'" class="px-2 py-1 text-xs rounded-full">
                {{ branch.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <i class="pi pi-building text-4xl text-slate-300 mb-4"></i>
            <p class="text-slate-500">No branches found. Click "Add Branch" to create one.</p>
          </div>
        }
      </div>
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
