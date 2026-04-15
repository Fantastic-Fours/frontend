import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';
import { profileDisplayName, profileInitials } from '../../core/utils/profile-display';
import { ProfileRefreshService } from '../../core/services/profile-refresh.service';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './profile-layout.component.html',
  styleUrl: './profile-layout.component.scss',
})
export class ProfileLayoutComponent implements OnInit, OnDestroy {
  private readonly authTokens = inject(AuthTokenService);
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly profileRefresh = inject(ProfileRefreshService);
  private sub = new Subscription();

  readonly profile = signal<UserProfile | null>(null);

  readonly isAuthenticated = computed(() => this.authTokens.hasTokens());

  readonly initials = computed(() => profileInitials(this.profile()));

  readonly displayName = computed(() => {
    const d = profileDisplayName(this.profile());
    return d || '—';
  });

  readonly progressPct = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    let n = 25;
    if (p.email) n += 20;
    if (p.phone?.trim()) n += 20;
    if ((p.privileges?.length ?? 0) > 0) n += 15;
    if ((p.first_name ?? '').trim()) n += 10;
    if ((p.last_name ?? '').trim()) n += 10;
    return Math.min(100, n);
  });

  ngOnInit(): void {
    if (!this.isAuthenticated()) return;
    this.fetchProfile();
    this.sub.add(
      this.profileRefresh.refresh$.subscribe(() => {
        if (this.isAuthenticated()) this.fetchProfile();
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private fetchProfile(): void {
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
