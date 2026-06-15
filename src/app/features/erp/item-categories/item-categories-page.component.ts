import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ItemCategoriesApiService } from '../../../core/api/item-categories-api.service';
import { ItemCategoryDTO, CreateItemCategoryRequest, UpdateItemCategoryRequest } from '../../../core/api/erp-api.models';

@Component({
  selector: 'app-item-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    InputText,
    Dialog,
    Textarea,
    Select,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './item-categories-page.component.html',
  styleUrl: './item-categories-page.component.css'
})
export class ItemCategoriesPageComponent implements OnInit {
  private readonly categoriesApi = inject(ItemCategoriesApiService);
  private readonly fb = inject(FormBuilder);

  categories = signal<ItemCategoryDTO[]>([]);
  loading = signal(false);
  
  displayDialog = signal(false);
  editingCategory = signal<ItemCategoryDTO | null>(null);

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(1)]],
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    parentCategoryId: [null as number | null]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoriesApi.list().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  showAddDialog(): void {
    this.editingCategory.set(null);
    this.form.reset();
    this.displayDialog.set(true);
  }

  showEditDialog(category: ItemCategoryDTO): void {
    this.editingCategory.set(category);
    this.form.patchValue({
      code: category.code,
      name: category.name,
      description: category.description,
      parentCategoryId: category.parentCategoryId
    });
    this.displayDialog.set(true);
  }

  save(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const editing = this.editingCategory();

    if (editing) {
      const request: UpdateItemCategoryRequest = {
        code: val.code!,
        name: val.name!,
        description: val.description,
        parentCategoryId: val.parentCategoryId
      };
      this.categoriesApi.update(editing.id, request).subscribe(() => {
        this.displayDialog.set(false);
        this.loadCategories();
      });
    } else {
      const request: CreateItemCategoryRequest = {
        code: val.code!,
        name: val.name!,
        description: val.description,
        parentCategoryId: val.parentCategoryId
      };
      this.categoriesApi.create(request).subscribe(() => {
        this.displayDialog.set(false);
        this.loadCategories();
      });
    }
  }

  delete(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoriesApi.delete(id).subscribe(() => {
        this.loadCategories();
      });
    }
  }
}
