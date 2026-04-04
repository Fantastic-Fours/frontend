import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WaveTextComponent } from '../wave-text/wave-text.component';

/**
 * App-wide footer: gradient band aligned with primary palette (sky / slate).
 * Placed in shell layout under {@link App}.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, WaveTextComponent],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
}
