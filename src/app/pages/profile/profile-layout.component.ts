import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './profile-layout.component.html',
  styleUrl: './profile-layout.component.scss',
})
export class ProfileLayoutComponent implements OnInit {
  private readonly authTokens = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly profile = signal<UserProfile | null>(null);

  readonly isAuthenticated = computed(() => this.authTokens.hasTokens());

  readonly initials = computed(() => {
    const u = this.profile()?.username?.trim();
    if (!u) return '?';
    const parts = u.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return u.slice(0, 2).toUpperCase();
  });

  readonly displayName = computed(() => this.profile()?.username?.trim() || '—');

  readonly progressPct = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    let n = 30;
    if (p.email) n += 25;
    if (p.phone?.trim()) n += 25;
    if ((p.privileges?.length ?? 0) > 0) n += 20;
    return Math.min(100, n);
  });

  ngOnInit(): void {
    if (!this.isAuthenticated()) return;
    this.userApi.getMe().subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.profile.set(null),
    });
  }

  logout(): void {
    this.authApi.logout();
    void this.router.navigate(['/login']);
  }
}
