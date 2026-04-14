import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthApiService } from './core/services/auth-api.service';
import { AuthTokenService } from './core/services/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly authTokens = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);

  openMenu: 'estate' | null = null;
  mobileMenuOpen = false;

  isAuthenticated(): boolean {
    return this.authTokens.hasTokens();
  }

  openDropdown(menu: 'estate'): void {
    this.openMenu = menu;
  }

  closeDropdown(_menu?: 'estate'): void {
    this.openMenu = null;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleEstateNav(event: Event): void {
    if (typeof window === 'undefined' || window.innerWidth > 980) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openMenu = this.openMenu === 'estate' ? null : 'estate';
  }

  isActiveEstate(): boolean {
    const url = this.router.url;
    return url.startsWith('/estate/primary') || url.startsWith('/estate/secondary') || url.startsWith('/estate/submit');
  }

  logout(): void {
    this.authApi.logout();
    this.closeMobileMenu();
  }
}
