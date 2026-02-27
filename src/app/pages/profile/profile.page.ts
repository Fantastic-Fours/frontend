import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthTokenService } from '../../core/services/auth-token.service';

interface JwtPayload {
  user_id?: number;
  username?: string;
  exp?: number;
  [key: string]: unknown;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);

  private readonly rawToken = signal<string | null>(this.authTokens.getAccessToken());

  isAuthenticated = computed(() => this.authTokens.hasTokens());

  payload = computed<JwtPayload | null>(() => {
    const token = this.rawToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = typeof atob !== 'undefined' ? atob(base64) : null;
      return json ? (JSON.parse(json) as JwtPayload) : null;
    } catch {
      return null;
    }
  });

  get displayName(): string {
    const p = this.payload();
    if (!p) return 'Неизвестный пользователь';
    if (typeof p.username === 'string' && p.username) return p.username;
    if (typeof p.user_id === 'number') return `Пользователь #${p.user_id}`;
    return 'Неизвестный пользователь';
  }

  logout(): void {
    this.authTokens.clear();
    this.rawToken.set(null);
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

