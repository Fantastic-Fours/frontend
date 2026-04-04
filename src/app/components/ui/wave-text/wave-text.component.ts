import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Per-letter “wave” lift on hover — Angular analogue of React + framer-motion “Text_03”.
 * Relies on CSS; animates when a parent &lt;button&gt; is hovered (`:host-context`).
 */
@Component({
  selector: 'app-wave-text',
  standalone: true,
  templateUrl: './wave-text.component.html',
  styleUrl: './wave-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveTextComponent {
  /** Label to animate character-by-character */
  readonly text = input('');

  readonly chars = computed(() => [...this.text()]);
}
