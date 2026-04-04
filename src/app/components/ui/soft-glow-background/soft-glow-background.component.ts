import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Full-viewport shell with centered soft yellow radial glow (multiply blend).
 * Angular analogue of the React `background-components` / shadcn-style layout wrapper.
 *
 * Usage:
 * ```html
 * <app-soft-glow-background>
 *   <div class="page">...</div>
 * </app-soft-glow-background>
 * ```
 */
@Component({
  selector: 'app-soft-glow-background',
  standalone: true,
  templateUrl: './soft-glow-background.component.html',
  styleUrl: './soft-glow-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoftGlowBackgroundComponent {}
