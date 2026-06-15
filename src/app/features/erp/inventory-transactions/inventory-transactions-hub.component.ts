import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';

@Component({
  standalone: true,
  selector: 'app-inventory-transactions-hub',
  imports: [RouterLink, Tag],
  template: `
    <div class="erp-list-page">
      <header class="erp-list-page__header">
        <div>
          <p-tag value="ERP · Inventory" severity="info" />
          <h1>Inventory transactions</h1>
          <p class="erp-list-page__subtitle">
            Purchase orders, customer quotations, and delivery notes — procurement and dispatch documents
            linked to your item master and vendors.
          </p>
        </div>
      </header>

      <div class="erp-inv-hub">
        <a routerLink="/erp/inventory-transactions/po" class="erp-inv-hub__card">
          <span class="erp-inv-hub__icon"><i class="pi pi-clipboard" aria-hidden="true"></i></span>
          <h2>Purchase orders</h2>
          <p>Create and track POs to vendors — line items, delivery dates, and approval status.</p>
        </a>
        <a routerLink="/erp/inventory-transactions/quotations" class="erp-inv-hub__card">
          <span class="erp-inv-hub__icon"><i class="pi pi-comment" aria-hidden="true"></i></span>
          <h2>Quotations</h2>
          <p>Sales quotations to customers — valid-until dates, line pricing, and acceptance workflow.</p>
        </a>
        <a routerLink="/erp/inventory-transactions/delivery-notes" class="erp-inv-hub__card">
          <span class="erp-inv-hub__icon"><i class="pi pi-send" aria-hidden="true"></i></span>
          <h2>Delivery notes</h2>
          <p>Dispatch documents for goods — link to quotations or create standalone delivery notes.</p>
        </a>
      </div>
    </div>
  `,
})
export class InventoryTransactionsHubComponent {}
