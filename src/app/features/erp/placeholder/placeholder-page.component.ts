import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-placeholder-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-50">{{ title() }}</h2>
      @if (description(); as d) {
        <p class="text-sm text-slate-600 dark:text-slate-400">{{ d }}</p>
      }
      @if (apiNote(); as n) {
        <p class="text-sm text-slate-600 dark:text-slate-400">{{ n }}</p>
      } @else {
        <p class="text-sm text-slate-600 dark:text-slate-400">
          This screen is not in the current OpenAPI document bundled as <span class="font-mono text-xs">swagger.json</span>
          (generate from <span class="font-mono text-xs">/swagger/v1/swagger.json</span>). Wire it after the backend adds endpoints.
        </p>
      }
      @if (fallbackRoute(); as r) {
        <a [routerLink]="r" class="text-sm text-[var(--p-primary-color)] no-underline">Open related page →</a>
      }
    </div>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((d) => String(d['title'] ?? 'Coming soon'))),
    { initialValue: String(this.route.snapshot.data['title'] ?? 'Coming soon') },
  );

  readonly description = toSignal(
    this.route.data.pipe(
      map((d) => {
        const v = d['description'];
        return v == null ? null : String(v);
      }),
    ),
    { initialValue: null as string | null },
  );

  readonly fallbackRoute = toSignal(
    this.route.data.pipe(
      map((d) => {
        const v = d['fallbackRoute'];
        return v == null ? null : String(v);
      }),
    ),
    { initialValue: null as string | null },
  );

  /** Optional per-route note (e.g. "Use GET /foo when available"). */
  readonly apiNote = toSignal(
    this.route.data.pipe(
      map((d) => {
        const v = d['apiNote'];
        return v == null ? null : String(v);
      }),
    ),
    { initialValue: null as string | null },
  );
}

