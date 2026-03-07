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

  openMenu: 'mortgage' | 'estate' | null = null;

  isAuthenticated(): boolean {
    return this.authTokens.hasTokens();
  }

  openDropdown(menu: 'mortgage' | 'estate'): void {
    this.openMenu = menu;
  }

  closeDropdown(_menu?: 'mortgage' | 'estate'): void {
    this.openMenu = null;
  }

  isActiveMortgage(): boolean {
    const url = this.router.url;
    return url.startsWith('/match') || url.startsWith('/programs');
  }

  isActiveEstate(): boolean {
    const url = this.router.url;
    return url.startsWith('/estate/primary') || url.startsWith('/estate/secondary') || url.startsWith('/estate/submit');
  }

  logout(): void {
    this.authApi.logout();
  }
}
