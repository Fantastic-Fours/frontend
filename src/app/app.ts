import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MegaMenuComponent, SiteFooterComponent, SoftGlowBackgroundComponent, WaveTextComponent } from './components/ui';
import { PRIMARY_NAV_ITEMS } from './nav-items';
import { AuthApiService } from './core/services/auth-api.service';
import { AuthTokenService } from './core/services/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SoftGlowBackgroundComponent,
    MegaMenuComponent,
    WaveTextComponent,
    SiteFooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authTokens = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);

  readonly primaryNavItems = PRIMARY_NAV_ITEMS;

  isAuthenticated(): boolean {
    return this.authTokens.hasTokens();
  }

  logout(): void {
    this.authApi.logout();
  }
}
