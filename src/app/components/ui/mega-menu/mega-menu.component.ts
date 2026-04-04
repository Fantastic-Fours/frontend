import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MegaMenuIconComponent } from './mega-menu-icon.component';
import type { MegaMenuItem } from './mega-menu.types';

@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MegaMenuIconComponent],
  templateUrl: './mega-menu.component.html',
  styleUrl: './mega-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MegaMenuComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = input.required<MegaMenuItem[]>();

  readonly openMenuLabel = signal<string | null>(null);
  readonly hoveredTriggerId = signal<number | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const root = this.host.nativeElement;
    if (!root.contains(ev.target as Node)) {
      this.closeMenu();
    }
  }

  onEnterMenu(label: string): void {
    this.openMenuLabel.set(label);
  }

  onLeaveMenu(): void {
    this.openMenuLabel.set(null);
    this.hoveredTriggerId.set(null);
  }

  onEnterTrigger(id: number): void {
    this.hoveredTriggerId.set(id);
  }

  onLeaveTrigger(): void {
    this.hoveredTriggerId.set(null);
  }

  /** Tap / click without hover (mobile) + explicit toggle */
  onTriggerClick(item: MegaMenuItem, ev: Event): void {
    if (!item.subMenus?.length) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    const cur = this.openMenuLabel();
    this.openMenuLabel.set(cur === item.label ? null : item.label);
  }

  closeMenu(): void {
    this.openMenuLabel.set(null);
    this.hoveredTriggerId.set(null);
  }

  isRouteActiveForItem(item: MegaMenuItem): boolean {
    const url = this.router.url;
    if (item.routerLink && url.startsWith(item.routerLink)) {
      return true;
    }
    for (const sub of item.subMenus ?? []) {
      for (const it of sub.items) {
        if (url.startsWith(it.routerLink)) {
          return true;
        }
      }
    }
    return false;
  }
}
