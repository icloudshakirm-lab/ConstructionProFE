import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PriceListsApiService } from '../../../core/api/price-lists-api.service';
import { ItemsApiService } from '../../../core/api/items-api.service';
import { LedgersApiService } from '../../../core/api/ledgers-api.service';
import { ItemDTO, LedgerDTO, PriceListItemDto, CreateBulkPriceListRequest } from '../../../core/api/erp-api.models';

@Component({
  selector: 'app-price-lists-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    InputText,
    Select,
    FormsModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './price-lists-page.component.html',
  styleUrl: './price-lists-page.component.css'
})
export class PriceListsPageComponent implements OnInit {
  private readonly priceListsApi = inject(PriceListsApiService);
  private readonly itemsApi = inject(ItemsApiService);
  private readonly ledgersApi = inject(LedgersApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  items = signal<ItemDTO[]>([]);
  ledgers = signal<LedgerDTO[]>([]);
  loading = signal(false);

  form = this.fb.group({
    ledgerId: [null as number | null, Validators.required],
    lines: this.fb.array([])
  });

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.loadLookups();
  }

  loadLookups(): void {
    this.itemsApi.list(1, 1000).subscribe(res => this.items.set(res.items));
    this.ledgersApi.list().subscribe(data => this.ledgers.set(data));
  }

  addLine(): void {
    const line = this.fb.group({
      itemId: [null as number | null, Validators.required],
      pricePerItem: [0, [Validators.required, Validators.min(0)]]
    });
    this.lines.push(line);
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const request: CreateBulkPriceListRequest = {
      ledgerId: val.ledgerId!,
      items: val.lines.map((l: any) => ({
        itemId: l.itemId,
        pricePerItem: l.pricePerItem
      }))
    };

    this.loading.set(true);
    this.priceListsApi.createBulk(request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Price list updated successfully' });
        this.loading.set(false);
        this.lines.clear();
        this.form.reset();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update price list' });
        this.loading.set(false);
      }
    });
  }
}
