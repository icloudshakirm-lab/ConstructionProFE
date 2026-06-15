import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-pos-counters-page',
  imports: [CommonModule],
  template: `
    <div class="space-y-6 p-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">POS Counters</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">Register and manage physical point-of-sale terminals and cash drawers.</p>
        </div>
        <button class="bg-[var(--p-primary-color)] text-[var(--p-primary-contrast-color)] px-4 py-2 rounded-lg text-sm font-medium">Add Counter</button>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div class="flex flex-col items-center gap-2">
          <i class="pi pi-desktop text-4xl text-slate-300"></i>
          <p class="text-slate-500">Connect and manage your hardware terminals here.</p>
        </div>
      </div>
    </div>
  `,
})
export class PosCountersPageComponent {}
