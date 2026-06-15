import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { GodownsApiService } from '../../../core/api/godowns-api.service';
import { GodownDTO, CreateGodownRequest, UpdateGodownRequest } from '../../../core/api/erp-api.models';

@Component({
  selector: 'app-godowns-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    InputText,
    Dialog,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './godowns-page.component.html',
  styleUrl: './godowns-page.component.css'
})
export class GodownsPageComponent implements OnInit {
  private readonly godownsApi = inject(GodownsApiService);
  private readonly fb = inject(FormBuilder);

  godowns = signal<GodownDTO[]>([]);
  loading = signal(false);
  
  displayDialog = signal(false);
  editingGodown = signal<GodownDTO | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    address: [''],
    city: ['']
  });

  ngOnInit(): void {
    this.loadGodowns();
  }

  loadGodowns(): void {
    this.loading.set(true);
    this.godownsApi.list().subscribe({
      next: (data) => {
        this.godowns.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  showAddDialog(): void {
    this.editingGodown.set(null);
    this.form.reset();
    this.displayDialog.set(true);
  }

  showEditDialog(godown: GodownDTO): void {
    this.editingGodown.set(godown);
    this.form.patchValue({
      name: godown.name,
      address: godown.address,
      city: godown.city
    });
    this.displayDialog.set(true);
  }

  save(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const editing = this.editingGodown();

    if (editing) {
      const request: UpdateGodownRequest = {
        name: val.name!,
        address: val.address,
        city: val.city
      };
      this.godownsApi.update(editing.id, request).subscribe(() => {
        this.displayDialog.set(false);
        this.loadGodowns();
      });
    } else {
      const request: CreateGodownRequest = {
        name: val.name!,
        address: val.address,
        city: val.city
      };
      this.godownsApi.create(request).subscribe(() => {
        this.displayDialog.set(false);
        this.loadGodowns();
      });
    }
  }

  delete(id: number): void {
    if (confirm('Are you sure you want to delete this godown?')) {
      this.godownsApi.delete(id).subscribe(() => {
        this.loadGodowns();
      });
    }
  }
}
