import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Tag } from 'primeng/tag';
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
    Tag,
    TooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
<div class="erp-list-page">
  <header class="erp-list-page__header">
    <div>
      <p-tag value="Administration · Settings" severity="info" />
      <h1>System configs</h1>
      <p class="erp-list-page__subtitle">Manage system settings, feature flags, and business rules via an interactive tree.</p>
    </div>
    <div class="erp-list-page__header-actions">
      <p-button label="Add root group" icon="pi pi-folder-plus" severity="secondary" (onClick)="showAddGroup(null)" />
    </div>
  </header>

  @if (loading()) {
    <p class="erp-list-page__loading">Loading configuration tree…</p>
  } @else if (treeNodes().length === 0) {
    <div class="erp-list-page__empty-panel">
      <i class="pi pi-cog" style="font-size: 2rem; margin-bottom: 0.5rem; display: block"></i>
      No configuration groups yet. Click <strong>Add root group</strong> to get started.
    </div>
  } @else {
    <div class="erp-config-tree-panel">
      <p-tree [value]="treeNodes()" styleClass="w-full border-none">
        <ng-template pTemplate="default" let-node>
          <div class="erp-config-tree-node">
            <div class="erp-config-tree-node__label">
              <span>{{ node.label }}</span>
              @if (!node.data.isGroup && node.data.value) {
                <span class="erp-config-tree-node__value">{{ node.data.value }}</span>
              }
            </div>
            <div class="cp-data-grid__row-actions">
              @if (node.data.isGroup) {
                <p-button icon="pi pi-plus" [rounded]="true" [text]="true" severity="info" pTooltip="Add configuration" (onClick)="showAddConfig(node.data)" />
                <p-button icon="pi pi-folder-plus" [rounded]="true" [text]="true" severity="info" pTooltip="Add sub-group" (onClick)="showAddGroup(node.data)" />
              }
              <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" title="Edit" (onClick)="editNode(node.data)" />
              <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" title="Delete" (onClick)="deleteNode(node.data)" />
            </div>
          </div>
        </ng-template>
      </p-tree>
    </div>
  }
</div>

<p-dialog
  [header]="editingNode() ? 'Edit configuration' : 'Add configuration'"
  [visible]="displayConfigDialog()"
  (visibleChange)="displayConfigDialog.set($event)"
  [modal]="true"
  [draggable]="false"
  [resizable]="false"
  styleClass="erp-dialog"
  [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
  appendTo="body"
>
  <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="erp-dialog__form">
    <div class="erp-doc__field">
      <label for="cfg-name" class="erp-doc__label">Name</label>
      <input id="cfg-name" pInputText formControlName="name" class="erp-doc__input" placeholder="e.g. Sales tax rate" />
    </div>
    <div class="erp-doc__field">
      <label for="cfg-value" class="erp-doc__label">Value</label>
      <input id="cfg-value" pInputText formControlName="value" class="erp-doc__input" placeholder="e.g. 15%" />
    </div>
    <div class="erp-doc__field">
      <label for="cfg-desc" class="erp-doc__label">Description</label>
      <textarea id="cfg-desc" pTextarea formControlName="description" rows="3" class="erp-doc__input" placeholder="Optional details…"></textarea>
    </div>
    <div class="erp-dialog__actions">
      <p-button label="Cancel" severity="secondary" [text]="true" type="button" (onClick)="displayConfigDialog.set(false)" />
      <p-button type="submit" label="Save" icon="pi pi-check" [disabled]="configForm.invalid" />
    </div>
  </form>
</p-dialog>

<p-dialog
  [header]="editingNode() ? 'Edit group' : 'Add group'"
  [visible]="displayGroupDialog()"
  (visibleChange)="displayGroupDialog.set($event)"
  [modal]="true"
  [draggable]="false"
  [resizable]="false"
  styleClass="erp-dialog"
  [style]="{ width: 'min(calc(100vw - 2rem), 28rem)' }"
  appendTo="body"
>
  <form [formGroup]="groupForm" (ngSubmit)="saveGroup()" class="erp-dialog__form">
    <div class="erp-doc__field">
      <label for="grp-name" class="erp-doc__label">Group name</label>
      <input id="grp-name" pInputText formControlName="name" class="erp-doc__input" placeholder="e.g. Tax settings" />
    </div>
    <div class="erp-doc__field">
      <label for="grp-desc" class="erp-doc__label">Description</label>
      <textarea id="grp-desc" pTextarea formControlName="description" rows="3" class="erp-doc__input" placeholder="Optional details…"></textarea>
    </div>
    <div class="erp-dialog__actions">
      <p-button label="Cancel" severity="secondary" [text]="true" type="button" (onClick)="displayGroupDialog.set(false)" />
      <p-button type="submit" label="Save" icon="pi pi-check" [disabled]="groupForm.invalid" />
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
