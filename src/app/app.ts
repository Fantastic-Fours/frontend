import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthTokenService } from './core/services/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(private readonly authTokens: AuthTokenService) {}

  isAuthenticated(): boolean {
    return this.authTokens.hasTokens();
  }

  logout(): void {
    this.authTokens.clear();
  }
}
