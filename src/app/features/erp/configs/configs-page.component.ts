import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfigurationsApiService } from '../../../core/api/configurations-api.service';
import { 
  ConfigurationTreeDTO, 
  CreateConfigurationCommand, 
  UpdateConfigurationCommand,
  CreateConfigurationGroupCommand,
  UpdateConfigurationGroupCommand
} from '../../../core/api/erp-api.models';

@Component({
  selector: 'app-configs-page',
  standalone: true,
  imports: [
    CommonModule,
    TreeModule,
    DialogModule,
    Button,
    InputText,
    Textarea,
    TooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
<div class="p-6 space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">System Configs</h1>
      <p class="text-sm text-slate-600 dark:text-slate-400">Manage system settings, feature flags, and business rules via an interactive tree.</p>
    </div>
    <p-button label="Add Root Group" icon="pi pi-plus" (click)="showAddGroup(null)" severity="secondary"></p-button>
  </div>

  <div class="bg-white dark:bg-slate-900 shadow rounded-xl p-4 border border-slate-200 dark:border-slate-800">
    <p-tree [value]="treeNodes()" [loading]="loading()" styleClass="w-full border-none">
      <ng-template pTemplate="default" let-node>
        <div class="flex items-center justify-between w-full group">
          <div class="flex items-center gap-2">
            <span class="text-slate-800 dark:text-slate-100 font-medium">{{node.label}}</span>
            @if(!node.data.isGroup && node.data.value) {
                <span class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-mono border border-emerald-100 dark:border-emerald-800">
                    {{node.data.value}}
                </span>
            }
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            @if(node.data.isGroup) {
                <p-button icon="pi pi-plus" (click)="showAddConfig(node.data)" variant="text" size="small" severity="info" pTooltip="Add Configuration"></p-button>
                <p-button icon="pi pi-folder-plus" (click)="showAddGroup(node.data)" variant="text" size="small" severity="info" pTooltip="Add Sub-Group"></p-button>
            }
            <p-button icon="pi pi-pencil" (click)="editNode(node.data)" variant="text" size="small" severity="secondary"></p-button>
            <p-button icon="pi pi-trash" (click)="deleteNode(node.data)" variant="text" size="small" severity="danger"></p-button>
          </div>
        </div>
      </ng-template>
    </p-tree>
  </div>
</div>

<!-- Configuration Modal -->
<p-dialog [header]="editingNode() ? 'Edit Configuration' : 'Add Configuration'" 
          [(visible)]="displayConfigDialog" [modal]="true" [style]="{width: '450px'}" 
          [draggable]="false" [resizable]="false" appendTo="body">
  <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="space-y-4 pt-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Name</label>
      <input pInputText formControlName="name" placeholder="e.g. Sales Tax Rate" class="w-full" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Value</label>
      <input pInputText formControlName="value" placeholder="e.g. 15%" class="w-full" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
      <textarea pTextarea formControlName="description" rows="3" placeholder="Optional details..." class="w-full"></textarea>
    </div>
    <div class="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
      <p-button label="Cancel" variant="text" severity="secondary" (click)="displayConfigDialog.set(false)"></p-button>
      <p-button type="submit" label="Save" icon="pi pi-check" [disabled]="configForm.invalid"></p-button>
    </div>
  </form>
</p-dialog>

<!-- Group Modal -->
<p-dialog [header]="editingNode() ? 'Edit Group' : 'Add Group'" 
          [(visible)]="displayGroupDialog" [modal]="true" [style]="{width: '450px'}" 
          [draggable]="false" [resizable]="false" appendTo="body">
  <form [formGroup]="groupForm" (ngSubmit)="saveGroup()" class="space-y-4 pt-4">
    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Group Name</label>
      <input pInputText formControlName="name" placeholder="e.g. Tax Settings" class="w-full" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
      <textarea pTextarea formControlName="description" rows="3" placeholder="Optional details..." class="w-full"></textarea>
    </div>
    <div class="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
      <p-button label="Cancel" variant="text" severity="secondary" (click)="displayGroupDialog.set(false)"></p-button>
      <p-button type="submit" label="Save" icon="pi pi-check" [disabled]="groupForm.invalid"></p-button>
    </div>
  </form>
</p-dialog>
  `,
  styles: `
/* Configs Styles */
:host {
    display: block;
}

:deep(.p-tree) {
    background: transparent !important;
}

:deep(.p-treenode-content) {
    border-radius: 8px !important;
    padding: 0.5rem !important;
}

:deep(.p-treenode-content:hover) {
    background: rgba(var(--p-primary-color-rgb), 0.05) !important;
}
  `
})
export class ConfigsPageComponent implements OnInit {
  private readonly configApi = inject(ConfigurationsApiService);
  private readonly fb = inject(FormBuilder);

  treeNodes = signal<TreeNode[]>([]);
  loading = signal(false);

  // Modal State
  displayConfigDialog = signal(false);
  displayGroupDialog = signal(false);
  editingNode = signal<ConfigurationTreeDTO | null>(null);
  parentNodeId = signal<number | null>(null);

  configForm = this.fb.group({
    name: ['', [Validators.required]],
    value: [''],
    description: ['']
  });

  groupForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading.set(true);
    this.configApi.getTree().subscribe({
      next: (data) => {
        this.treeNodes.set(this.mapToTreeNodes(data));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private mapToTreeNodes(data: ConfigurationTreeDTO[]): TreeNode[] {
    return data.map(node => ({
      label: node.name,
      data: node,
      expanded: true,
      icon: node.isGroup ? 'pi pi-folder' : 'pi pi-cog',
      children: node.children ? this.mapToTreeNodes(node.children) : []
    }));
  }

  showAddConfig(parentNode: ConfigurationTreeDTO): void {
    this.editingNode.set(null);
    this.parentNodeId.set(parentNode.id);
    this.configForm.reset();
    this.displayConfigDialog.set(true);
  }

  showAddGroup(parentNode: ConfigurationTreeDTO | null): void {
    this.editingNode.set(null);
    this.parentNodeId.set(parentNode?.id ?? null);
    this.groupForm.reset();
    this.displayGroupDialog.set(true);
  }

  editNode(node: ConfigurationTreeDTO): void {
    this.editingNode.set(node);
    if (node.isGroup) {
      this.groupForm.patchValue({
        name: node.name,
        description: node.description
      });
      this.displayGroupDialog.set(true);
    } else {
      this.configForm.patchValue({
        name: node.name,
        value: node.value,
        description: node.description
      });
      this.displayConfigDialog.set(true);
    }
  }

  saveConfig(): void {
    if (this.configForm.invalid) return;
    const val = this.configForm.getRawValue();
    const editing = this.editingNode();

    if (editing) {
      const request: UpdateConfigurationCommand = {
        id: editing.id,
        name: val.name!,
        value: val.value,
        description: val.description,
        configurationGroupId: editing.id 
      };
      this.configApi.updateConfiguration(editing.id, request).subscribe(() => {
        this.displayConfigDialog.set(false);
        this.loadTree();
      });
    } else {
      const request: CreateConfigurationCommand = {
        name: val.name!,
        value: val.value,
        description: val.description,
        configurationGroupId: this.parentNodeId()!
      };
      this.configApi.createConfiguration(request).subscribe(() => {
        this.displayConfigDialog.set(false);
        this.loadTree();
      });
    }
  }

  saveGroup(): void {
    if (this.groupForm.invalid) return;
    const val = this.groupForm.getRawValue();
    const editing = this.editingNode();

    if (editing) {
      const request: UpdateConfigurationGroupCommand = {
        id: editing.id,
        name: val.name!,
        description: val.description,
        parentGroupId: null 
      };
      this.configApi.updateGroup(editing.id, request).subscribe(() => {
        this.displayGroupDialog.set(false);
        this.loadTree();
      });
    } else {
      const request: CreateConfigurationGroupCommand = {
        name: val.name!,
        description: val.description,
        parentGroupId: this.parentNodeId()
      };
      this.configApi.createGroup(request).subscribe(() => {
        this.displayGroupDialog.set(false);
        this.loadTree();
      });
    }
  }

  deleteNode(node: ConfigurationTreeDTO): void {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      const obs = node.isGroup 
        ? this.configApi.deleteGroup(node.id) 
        : this.configApi.deleteConfiguration(node.id);
      
      obs.subscribe(() => this.loadTree());
    }
  }
}
