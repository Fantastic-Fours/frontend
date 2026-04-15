import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './profile-overview.page.html',
  styleUrl: './profile-overview.page.scss',
})
export class ProfileOverviewPage implements OnInit, OnDestroy {
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly translate = inject(TranslateService);

  private subs = new Subscription();

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  savedCount = signal(0);
  calcCount = signal(0);
  listingsCount = signal(0);
  todayLabel = signal('');

  readonly isAuthenticated = computed(() => this.authTokens.hasTokens());

  readonly displayName = computed(() => this.profile()?.username?.trim() || '');

  ngOnInit(): void {
    this.refreshToday();
    this.subs.add(
      this.translate.onLangChange.subscribe(() => this.refreshToday()),
    );

    if (!this.isAuthenticated()) {
      this.loading.set(false);
      return;
    }

    this.userApi.getMe().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loadStats();
      },
      error: (err) => {
        if (err?.status === 401) {
          this.authApi.logout();
          void this.router.navigate(['/login']);
        }
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private refreshToday(): void {
    const lang = this.translate.getCurrentLang() || 'ru';
    const locale = lang === 'kk' ? 'kk-KZ' : lang === 'en' ? 'en-GB' : 'ru-RU';
    try {
      const s = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
      this.todayLabel.set(s.charAt(0).toUpperCase() + s.slice(1));
    } catch {
      this.todayLabel.set(new Date().toDateString());
    }
  }

  private loadStats(): void {
    forkJoin({
      saved: this.userApi.getSavedApartments(1, 1),
      calcs: this.userApi.getCalculationHistory(1, 1),
      listings: this.userApi.getMyListings(),
    }).subscribe({
      next: ({ saved, calcs, listings }) => {
        this.savedCount.set(saved.count ?? 0);
        this.calcCount.set(calcs.count ?? 0);
        this.listingsCount.set(Array.isArray(listings) ? listings.length : 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
