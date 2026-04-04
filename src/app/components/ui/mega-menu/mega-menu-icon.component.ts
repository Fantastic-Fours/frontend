import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MegaMenuIconId } from './mega-menu.types';

@Component({
  selector: 'app-mega-menu-icon',
  standalone: true,
  templateUrl: './mega-menu-icon.component.html',
  styleUrl: './mega-menu-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MegaMenuIconComponent {
  readonly name = input.required<MegaMenuIconId>();
}
