import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.scss'
})
export class App {
  /** Eager init so theme is applied before first paint after bootstrap. */
  private readonly _theme = inject(ThemeService);
}
