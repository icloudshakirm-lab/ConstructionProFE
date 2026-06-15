import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { PrimeTemplate, TreeNode } from 'primeng/api';
import { Button } from 'primeng/button';
import { Tree } from 'primeng/tree';
import { ChartOfAccountsApiService } from '../../../core/api/chart-of-accounts-api.service';
import type { ChartOfAccountsTreeNode } from '../../../core/api/chart-of-accounts.models';
import { ChartOfAccountAddDialogComponent } from './chart-of-account-add-dialog.component';

function toPrimeTree(nodes: ChartOfAccountsTreeNode[]): TreeNode[] {
  return nodes.map((n) => ({
    key: `${n.isGroup ? 'g' : 'l'}-${n.id}`,
    label: n.name,
    data: n,
    expanded: true,
    children: n.children?.length ? toPrimeTree(n.children) : [],
    leaf: !n.isGroup,
  }));
}

@Component({
  standalone: true,
  selector: 'app-chart-of-accounts-page',
  imports: [CommonModule, Tree, Button, PrimeTemplate, ChartOfAccountAddDialogComponent],
  templateUrl: './chart-of-accounts-page.component.html',
  styleUrl: './chart-of-accounts-page.component.css',
})
export class ChartOfAccountsPageComponent implements OnInit {
  private readonly coaApi = inject(ChartOfAccountsApiService);

  readonly treeNodes = signal<TreeNode[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly addVisible = signal(false);
  readonly addParentId = signal<number | null>(null);
  readonly addParentLabel = signal('');
  readonly addInitialTab = signal<'ledger' | 'group'>('ledger');

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading.set(true);
    this.error.set(null);
    this.coaApi.getTree().subscribe({
      next: (tree) => {
        this.treeNodes.set(toPrimeTree(tree));
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.msg(e));
        this.loading.set(false);
      },
    });
  }

  openAddDialog(event: Event, node: TreeNode, initialTab: 'ledger' | 'group'): void {
    event.stopPropagation();
    event.preventDefault();
    const data = node.data as ChartOfAccountsTreeNode | undefined;
    if (!data?.isGroup) {
      return;
    }
    this.addParentId.set(data.id);
    this.addParentLabel.set(data.name);
    this.addInitialTab.set(initialTab);
    this.addVisible.set(true);
  }

  onAddVisible(open: boolean): void {
    this.addVisible.set(open);
    if (!open) {
      this.addParentId.set(null);
      this.addParentLabel.set('');
      this.addInitialTab.set('ledger');
    }
  }

  onSaved(): void {
    this.loadTree();
  }

  private msg(e: unknown): string {
    const err = e as { error?: { detail?: string; title?: string }; message?: string };
    return err.error?.detail ?? err.error?.title ?? err.message ?? 'Request failed';
  }
}
